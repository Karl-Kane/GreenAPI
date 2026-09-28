import type { Credentials } from '../types'

export class GreenApiError extends Error {
  readonly status: number | null

  constructor(message: string, status: number | null = null) {
    super(message)
    this.name = 'GreenApiError'
    this.status = status
  }
}

export interface SendMessageResponse {
  idMessage: string
}

export interface StateInstanceResponse {
  stateInstance: 'authorized' | 'notAuthorized' | 'blocked' | 'starting' | 'yellowCard' | string
}

export interface CheckAccountResponse {
  exist: boolean
  chatId: string
}

export interface CheckWhatsappResponse {
  existsWhatsapp: boolean
}

/** Raw webhook body as returned by ReceiveNotification. Only the fields we use are typed. */
export interface NotificationBody {
  typeWebhook: string
  timestamp?: number
  idMessage?: string
  chatId?: string
  status?: string
  senderData?: {
    chatId: string
    chatName?: string
    sender?: string
    senderName?: string
    senderContactName?: string
  }
  messageData?: {
    typeMessage: string
    textMessageData?: { textMessage: string }
    extendedTextMessageData?: { text: string }
  }
}

export interface Notification {
  receiptId: number
  body: NotificationBody
}

export function normalizeApiUrl(apiUrl: string): string {
  const trimmed = apiUrl.trim().replace(/\/+$/, '')
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

function methodUrl(creds: Credentials, method: string, suffix = ''): string {
  return `${normalizeApiUrl(creds.apiUrl)}/waInstance${creds.idInstance.trim()}/${method}/${creds.apiTokenInstance.trim()}${suffix}`
}

function describeHttpError(status: number): string {
  switch (status) {
    case 400:
      return 'Некорректный запрос'
    case 401:
    case 403:
      return 'Неверный idInstance или apiTokenInstance'
    case 404:
      return 'Метод не найден — проверьте apiUrl'
    case 429:
      return 'Слишком много запросов, попробуйте чуть позже'
    case 466:
      return 'Исчерпан лимит тарифа (на бесплатном тарифе — не более 3 чатов)'
    default:
      return status >= 500 ? 'Сервер GREEN-API временно недоступен' : `Ошибка HTTP ${status}`
  }
}

async function request<T>(
  creds: Credentials,
  method: string,
  { httpMethod = 'GET', body, suffix, signal }: { httpMethod?: string; body?: unknown; suffix?: string; signal?: AbortSignal } = {},
): Promise<T> {
  let response: Response
  try {
    response = await fetch(methodUrl(creds, method, suffix), {
      method: httpMethod,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (error) {
    if (signal?.aborted) throw error
    throw new GreenApiError('Не удалось связаться с GREEN-API. Проверьте apiUrl и подключение к сети')
  }

  if (!response.ok) throw new GreenApiError(describeHttpError(response.status), response.status)

  const text = await response.text()
  return (text ? JSON.parse(text) : null) as T
}

export const greenApi = {
  getStateInstance: (creds: Credentials, signal?: AbortSignal) =>
    request<StateInstanceResponse>(creds, 'getStateInstance', { signal }),

  sendMessage: (creds: Credentials, chatId: string, message: string) =>
    request<SendMessageResponse>(creds, 'sendMessage', { httpMethod: 'POST', body: { chatId, message } }),

  /** Long-polls the notification queue; resolves with `null` when the queue stayed empty for `timeoutSec`. */
  receiveNotification: (creds: Credentials, timeoutSec: number, signal?: AbortSignal) =>
    request<Notification | null>(creds, 'receiveNotification', { suffix: `?receiveTimeout=${timeoutSec}`, signal }),

  deleteNotification: (creds: Credentials, receiptId: number, signal?: AbortSignal) =>
    request<{ result: boolean }>(creds, 'deleteNotification', { httpMethod: 'DELETE', suffix: `/${receiptId}`, signal }),

  /** MAX / Telegram: resolves a phone number to the messenger's numeric chatId. */
  checkAccount: (creds: Credentials, phoneNumber: number) =>
    request<CheckAccountResponse>(creds, 'checkAccount', { httpMethod: 'POST', body: { phoneNumber } }),

  checkWhatsapp: (creds: Credentials, phoneNumber: number) =>
    request<CheckWhatsappResponse>(creds, 'checkWhatsapp', { httpMethod: 'POST', body: { phoneNumber } }),
}
