import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { greenApi } from '../api/greenApi'
import { parseNotification } from '../lib/notifications'
import { loadJson, saveJson } from '../lib/storage'
import { accountReducer, initialAccountState } from '../state/accountReducer'
import type { AccountState, Credentials, Message, MessengerId } from '../types'

export type ConnectionState = 'connecting' | 'online' | 'offline'

/** Seconds the server holds a ReceiveNotification request open when the queue is empty (5–60). */
const RECEIVE_TIMEOUT_SEC = 20
const MAX_BACKOFF_MS = 30_000

export function accountStorageKey(messenger: MessengerId, idInstance: string): string {
  return `green-chat:${messenger}:${idInstance}`
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms)
    signal.addEventListener('abort', () => {
      clearTimeout(timer)
      resolve()
    })
  })
}

function restoreState(key: string): AccountState {
  const saved = loadJson<AccountState>(key, initialAccountState)
  // A send interrupted by a reload never completed — surface it as failed so it can be retried.
  const messages = Object.fromEntries(
    Object.entries(saved.messages).map(([chatId, list]) => [
      chatId,
      list.map((m) => (m.status === 'pending' ? { ...m, status: 'failed' as const } : m)),
    ]),
  )
  return { ...saved, messages, activeChatId: null }
}

/**
 * Chat state for one GREEN-API instance: persisted to localStorage and kept up to date by
 * long-polling the notification queue (ReceiveNotification → handle → DeleteNotification).
 */
export function useAccount(messenger: MessengerId, creds: Credentials) {
  const storageKey = accountStorageKey(messenger, creds.idInstance)
  const [state, dispatch] = useReducer(accountReducer, storageKey, restoreState)
  const [connection, setConnection] = useState<ConnectionState>('online')

  useEffect(() => {
    saveJson(storageKey, state)
  }, [storageKey, state])

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    async function poll() {
      let backoff = 1000
      while (!signal.aborted) {
        try {
          const notification = await greenApi.receiveNotification(creds, RECEIVE_TIMEOUT_SEC, signal)
          setConnection('online')
          backoff = 1000
          if (!notification) continue

          const event = parseNotification(notification.body)
          if (event.kind === 'message') dispatch({ type: 'receiveMessage', message: event.message, chatTitle: event.chatTitle })
          else if (event.kind === 'status') dispatch({ type: 'setStatus', ...event })

          // Acknowledge even ignored notifications, otherwise the queue gets stuck on them.
          await greenApi.deleteNotification(creds, notification.receiptId, signal)
        } catch {
          if (signal.aborted) return
          setConnection('offline')
          await sleep(backoff, signal)
          backoff = Math.min(backoff * 2, MAX_BACKOFF_MS)
        }
      }
    }

    poll()
    return () => controller.abort()
  }, [creds])

  // Sending reads the latest messages through a ref so the callback identity stays stable.
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])

  const deliver = useCallback(
    async (chatId: string, localId: string, text: string) => {
      try {
        const { idMessage } = await greenApi.sendMessage(creds, chatId, text)
        dispatch({ type: 'sendSucceeded', chatId, localId, id: idMessage })
      } catch {
        dispatch({ type: 'sendFailed', chatId, localId })
      }
    },
    [creds],
  )

  const sendMessage = useCallback(
    (chatId: string, text: string) => {
      const message: Message = {
        id: `local-${crypto.randomUUID()}`,
        chatId,
        text,
        timestamp: Date.now(),
        direction: 'out',
        status: 'pending',
      }
      dispatch({ type: 'sendStarted', message })
      return deliver(chatId, message.id, text)
    },
    [deliver],
  )

  const retryMessage = useCallback(
    (chatId: string, localId: string) => {
      const message = stateRef.current.messages[chatId]?.find((m) => m.id === localId)
      if (!message) return
      dispatch({ type: 'retrySend', chatId, localId })
      return deliver(chatId, localId, message.text)
    },
    [deliver],
  )

  return { state, dispatch, connection, sendMessage, retryMessage }
}
