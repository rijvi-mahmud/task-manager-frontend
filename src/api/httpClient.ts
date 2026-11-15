import { z } from 'zod'
import { appConfig } from '../config/appConfig'

export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: Record<string, string>
  readonly requestId?: string

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}, requestId?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
    this.requestId = requestId
  }
}

const problemSchema = z.object({
  title: z.string().optional(), detail: z.string().optional(),
  errors: z.record(z.string(), z.string()).optional(),
  requestId: z.string().optional(),
})
const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
const CSRF_COOKIE = 'XSRF-TOKEN'
const CSRF_HEADER = 'X-XSRF-TOKEN'

function readCookie(name: string): string | null {
  const prefix = `${name}=`
  const cookie = document.cookie.split('; ').find(entry => entry.startsWith(prefix))
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null
}

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }
export interface RequestOptions { signal?: AbortSignal }

/**
 * Fetch wrapper for the API: one deadline covers fetching headers and
 * consuming the body, errors become {@link ApiError}, and responses are
 * validated with zod.
 *
 * Authentication is the HttpOnly session cookie, which the browser sends by
 * itself. For CSRF protection every unsafe request echoes the XSRF-TOKEN
 * cookie in the X-XSRF-TOKEN header; when the cookie is missing (first visit,
 * or just rotated by sign-in/out) it is fetched from /auth/csrf first.
 */
export class HttpClient {
  private readonly baseUrl: string
  private readonly timeoutMs: number

  constructor(baseUrl: string, timeoutMs: number = appConfig.api.requestTimeoutMs) {
    this.baseUrl = baseUrl
    this.timeoutMs = timeoutMs
  }

  get<T>(path: string, schema: z.ZodType<T>, options?: RequestOptions): Promise<T> {
    return this.request('GET', path, schema, undefined, options)
  }
  post<T, TBody extends JsonValue>(path: string, body: TBody, schema: z.ZodType<T>, options?: RequestOptions): Promise<T> {
    return this.request('POST', path, schema, body, options)
  }
  put<T, TBody extends JsonValue>(path: string, body: TBody, schema: z.ZodType<T>, options?: RequestOptions): Promise<T> {
    return this.request('PUT', path, schema, body, options)
  }
  patch<T, TBody extends JsonValue>(path: string, body: TBody, schema: z.ZodType<T>, options?: RequestOptions): Promise<T> {
    return this.request('PATCH', path, schema, body, options)
  }
  /** POST for endpoints that answer 202/204 without a body. */
  postNoContent<TBody extends JsonValue>(path: string, body: TBody, options?: RequestOptions): Promise<void> {
    return this.request('POST', path, undefined, body, options)
  }
  delete(path: string, options?: RequestOptions): Promise<void> {
    return this.request('DELETE', path, undefined, undefined, options)
  }

  private async request<T = void, TBody extends JsonValue = JsonValue>(method: string, path: string, schema?: z.ZodType<T>, body?: TBody,
    { signal }: RequestOptions = {}): Promise<T> {
    const controller = new AbortController()
    const cancel = () => controller.abort(signal?.reason)
    signal?.addEventListener('abort', cancel, { once: true })
    if (signal?.aborted) cancel()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)
    try {
      controller.signal.throwIfAborted()
      const csrfToken = UNSAFE_METHODS.has(method) ? await this.csrfToken(controller.signal) : null
      const response = await fetch(this.baseUrl + path, {
        method, signal: controller.signal, credentials: 'same-origin',
        headers: {
          Accept: 'application/json, application/problem+json',
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
          ...(csrfToken ? { [CSRF_HEADER]: csrfToken } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      })
      await this.ensureSuccessful(response)
      if (!schema) return undefined as T
      const json: JsonValue = await response.json().catch(<TError>(err: TError) => {
        if (controller.signal.aborted) throw err
        throw new ApiError(response.status, 'Unexpected response from server')
      })
      const result = z.object({
        data: schema,
        meta: z.object({ requestId: z.string().min(1), timestamp: z.iso.datetime() }),
      }).safeParse(json)
      if (!result.success) throw new ApiError(response.status, 'Unexpected response from server')
      return result.data.data
    } catch (err) {
      if (signal?.aborted) throw signal.reason ?? new DOMException('Request canceled', 'AbortError')
      if (controller.signal.aborted) throw new ApiError(0, method === 'GET'
        ? 'Request timed out. Try again.'
        : 'Request timed out. The change may have been saved. Reload before retrying.')
      if (err instanceof ApiError) throw err
      throw new ApiError(0, 'Cannot reach the server. Is the backend running?')
    } finally {
      clearTimeout(timer)
      signal?.removeEventListener('abort', cancel)
    }
  }

  private async csrfToken(signal: AbortSignal): Promise<string | null> {
    const existing = readCookie(CSRF_COOKIE)
    if (existing) return existing
    const response = await fetch(`${this.baseUrl}/auth/csrf`, { method: 'GET', signal, credentials: 'same-origin' })
    await this.ensureSuccessful(response)
    const token = readCookie(CSRF_COOKIE)
    if (!token) throw new ApiError(0, 'Could not prepare a secure request. Check that cookies are enabled and reload.')
    return token
  }

  private async ensureSuccessful(response: Response): Promise<void> {
    if (response.ok) return
    const fallback = response.statusText || 'Request failed'
    const problem = problemSchema.safeParse(await response.json().catch(() => null))
    throw new ApiError(response.status, problem.success
      ? problem.data.detail ?? problem.data.title ?? fallback : fallback,
    problem.success ? problem.data.errors : undefined,
    (problem.success ? problem.data.requestId : undefined) ?? response.headers.get('X-Request-ID') ?? undefined)
  }
}

export function errorMessage<TError>(err: TError): string {
  return err instanceof Error ? err.message : 'Something went wrong'
}
