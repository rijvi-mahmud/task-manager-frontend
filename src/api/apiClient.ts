import { appConfig } from '../config/appConfig'
import { HttpClient } from './httpClient'

/** Single shared client for the backend; Vite proxies /api in development. */
export const apiClient = new HttpClient(`/api/${appConfig.api.version}`)
