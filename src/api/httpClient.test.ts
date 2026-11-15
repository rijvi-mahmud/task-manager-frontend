import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { ApiError, HttpClient } from './httpClient'

const client = new HttpClient('/api')
const schema = z.object({ id: z.number() })

function mockFetch<TBody>(status: number, body: TBody) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(body === undefined ? null : JSON.stringify(status < 400 ? { data: body, meta: { requestId: 'test-request', timestamp: '2026-11-15T10:00:00Z' } } : body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
    ),
  )
}

beforeEach(() => { document.cookie = 'XSRF-TOKEN=test-token; path=/' })

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
  document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
})

describe('HttpClient', () => {
  it('returns schema-validated data', async () => {
    mockFetch(200, { id: 1 })
    await expect(client.get('/x', schema)).resolves.toEqual({ id: 1 })
  })

  it('sends JSON bodies', async () => {
    mockFetch(201, { id: 2 })
    await client.post('/x', { a: 1 }, schema)
    expect(fetch).toHaveBeenCalledWith('/api/x', expect.objectContaining({ method: 'POST', body: '{"a":1}' }))
  })

  it('maps problem responses to ApiError with field errors', async () => {
    mockFetch(400, { detail: 'Validation failed', errors: { title: 'Title is required' } })
    const error = await client.post('/x', {}, schema).catch(<TError>(e: TError) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 400, message: 'Validation failed', fieldErrors: { title: 'Title is required' } })
  })

  it('echoes the CSRF cookie in a header on writes, but not on reads', async () => {
    document.cookie = 'XSRF-TOKEN=abc%3D; path=/'
    mockFetch(201, { id: 2 })
    await client.post('/x', { a: 1 }, schema)
    expect(fetch).toHaveBeenCalledWith('/api/x', expect.objectContaining({
      credentials: 'same-origin', headers: expect.objectContaining({ 'X-XSRF-TOKEN': 'abc=' }),
    }))
    vi.mocked(fetch).mockClear()
    mockFetch(200, { id: 1 })
    await client.get('/x', schema)
    expect(vi.mocked(fetch).mock.calls[0][1]?.headers).not.toHaveProperty('X-XSRF-TOKEN')
  })

  it('fetches a CSRF token first when the cookie is missing', async () => {
    document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/'
    const calls: string[] = []
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      calls.push(url)
      if (url.endsWith('/auth/csrf')) document.cookie = 'XSRF-TOKEN=fresh; path=/'
      return new Response(JSON.stringify({ id: 3 }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }))
    await client.delete('/x/3')
    expect(calls).toEqual(['/api/auth/csrf', '/api/x/3'])
    expect(vi.mocked(fetch).mock.calls[1][1]?.headers).toMatchObject({ 'X-XSRF-TOKEN': 'fresh' })
  })

  it('rejects responses that do not match the schema', async () => {
    mockFetch(200, { id: 'not-a-number' })
    await expect(client.get('/x', schema)).rejects.toThrow('Unexpected response from server')
  })

  it('reports network failures clearly', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    await expect(client.get('/x', schema)).rejects.toMatchObject({ status: 0 })
  })
})

function stallUntilAborted<TResponse>(signal: AbortSignal): Promise<TResponse> {
  return new Promise((_resolve, reject) => {
    if (signal.aborted) reject(signal.reason)
    else signal.addEventListener('abort', () => reject(signal.reason), { once: true })
  })
}

it('times out a stalled fetch and releases its timer', async () => {
  vi.useFakeTimers()
  vi.stubGlobal('fetch', vi.fn((_url, options: RequestInit) => stallUntilAborted(options.signal!)))
  const outcome = new HttpClient('/api', 50).get('/x', schema).catch(<TError>(err: TError) => err)
  await vi.advanceTimersByTimeAsync(50)
  expect(await outcome).toMatchObject({ status: 0, message: 'Request timed out. Try again.' })
  expect(vi.getTimerCount()).toBe(0)
})

it('keeps the deadline active while reading a stalled response body', async () => {
  vi.useFakeTimers()
  vi.stubGlobal('fetch', vi.fn(async (_url, options: RequestInit) => ({
    ok: true, status: 200, json: () => stallUntilAborted(options.signal!),
  })))
  const outcome = new HttpClient('/api', 50).get('/x', schema).catch(<TError>(err: TError) => err)
  await vi.advanceTimersByTimeAsync(50)
  expect(await outcome).toMatchObject({ status: 0, message: 'Request timed out. Try again.' })
})

it('propagates caller cancellation instead of reporting an offline error', async () => {
  vi.useFakeTimers()
  vi.stubGlobal('fetch', vi.fn((_url, options: RequestInit) => stallUntilAborted(options.signal!)))
  const controller = new AbortController()
  const outcome = client.get('/x', schema, { signal: controller.signal }).catch(<TError>(err: TError) => err)
  controller.abort(new DOMException('Superseded', 'AbortError'))
  expect(await outcome).toMatchObject({ name: 'AbortError', message: 'Superseded' })
  expect(vi.getTimerCount()).toBe(0)
})

it('warns that a timed-out write may already have committed', async () => {
  vi.useFakeTimers()
  vi.stubGlobal('fetch', vi.fn((_url, options: RequestInit) => stallUntilAborted(options.signal!)))
  const outcome = new HttpClient('/api', 50).post('/x', {}, schema).catch(<TError>(err: TError) => err)
  await vi.advanceTimersByTimeAsync(50)
  expect(await outcome).toMatchObject({ message: expect.stringContaining('may have been saved') })
})

it('clears the deadline after a successful response', async () => {
  vi.useFakeTimers()
  mockFetch(200, { id: 1 })
  await expect(client.get('/x', schema)).resolves.toEqual({ id: 1 })
  expect(vi.getTimerCount()).toBe(0)
})


it('stops a write when CSRF initialization fails', async () => {
  document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/'
  mockFetch(503, { detail: 'Service unavailable', requestId: 'failed-csrf' })
  await expect(client.post('/x', {}, schema)).rejects.toMatchObject({ status: 503, requestId: 'failed-csrf' })
  expect(fetch).toHaveBeenCalledTimes(1)
})

it('reports blocked cookies before attempting a write', async () => {
  document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/'
  mockFetch(204, undefined)
  await expect(client.delete('/x')).rejects.toThrow('cookies are enabled')
  expect(fetch).toHaveBeenCalledTimes(1)
})
