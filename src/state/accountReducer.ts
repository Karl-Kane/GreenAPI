import { formatPhone } from '../lib/phone'
import type { AccountState, Chat, Message, MessageStatus } from '../types'

export type AccountAction =
  | { type: 'openChat'; chatId: string; title: string; phone?: string }
  | { type: 'closeChat' }
  | { type: 'receiveMessage'; message: Message; chatTitle?: string }
  | { type: 'sendStarted'; message: Message }
  | { type: 'sendSucceeded'; chatId: string; localId: string; id: string }
  | { type: 'sendFailed'; chatId: string; localId: string }
  | { type: 'retrySend'; chatId: string; localId: string }
  | { type: 'setStatus'; chatId: string; messageId: string; status: MessageStatus }

export const MAX_MESSAGES_PER_CHAT = 500

export const initialAccountState: AccountState = { chats: {}, messages: {}, activeChatId: null }

const STATUS_RANK: Record<MessageStatus, number> = { failed: -1, pending: 0, sent: 1, delivered: 2, read: 3 }

/** Statuses may arrive out of order — never downgrade (e.g. `read` → `delivered`). */
function mergeStatus(current: MessageStatus | undefined, next: MessageStatus): MessageStatus {
  if (!current || next === 'failed' || current === 'failed') return next
  return STATUS_RANK[next] > STATUS_RANK[current] ? next : current
}

function upsertChat(state: AccountState, chatId: string, patch: Partial<Chat>): Record<string, Chat> {
  const existing = state.chats[chatId]
  const chat: Chat = existing
    ? { ...existing, ...patch }
    : { chatId, title: patch.title || chatId, unread: 0, lastActivity: Date.now(), ...patch }
  return { ...state.chats, [chatId]: chat }
}

function updateMessages(state: AccountState, chatId: string, update: (list: Message[]) => Message[]) {
  return { ...state.messages, [chatId]: update(state.messages[chatId] ?? []).slice(-MAX_MESSAGES_PER_CHAT) }
}

function isPlaceholderTitle(chat: Chat): boolean {
  return chat.title === chat.chatId || (!!chat.phone && chat.title === formatPhone(chat.phone))
}

function insertSorted(list: Message[], message: Message): Message[] {
  const next = [...list, message]
  // Notifications are FIFO, so appending is almost always right; sort only when needed.
  if (list.length && list[list.length - 1].timestamp > message.timestamp) next.sort((a, b) => a.timestamp - b.timestamp)
  return next
}

export function accountReducer(state: AccountState, action: AccountAction): AccountState {
  switch (action.type) {
    case 'openChat': {
      const existing = state.chats[action.chatId]
      return {
        ...state,
        activeChatId: action.chatId,
        chats: upsertChat(state, action.chatId, existing ? { unread: 0 } : { title: action.title, phone: action.phone }),
      }
    }

    case 'closeChat':
      return { ...state, activeChatId: null }

    case 'receiveMessage': {
      const { message, chatTitle } = action
      const list = state.messages[message.chatId] ?? []
      const duplicate = list.find((m) => m.id === message.id)
      if (duplicate) {
        // Our own API send echoed back via outgoingAPIMessageReceived — keep the best-known status.
        if (!message.status || !duplicate.status) return state
        const status = mergeStatus(duplicate.status, message.status)
        if (status === duplicate.status) return state
        return { ...state, messages: updateMessages(state, message.chatId, (l) => l.map((m) => (m === duplicate ? { ...m, status } : m))) }
      }

      const existingChat = state.chats[message.chatId]
      const isUnread = message.direction === 'in' && state.activeChatId !== message.chatId
      return {
        ...state,
        chats: upsertChat(state, message.chatId, {
          // Replace auto-generated titles (raw id or the typed phone) with the contact name
          ...(chatTitle && (!existingChat || isPlaceholderTitle(existingChat)) && { title: chatTitle }),
          lastActivity: Math.max(existingChat?.lastActivity ?? 0, message.timestamp),
          unread: (existingChat?.unread ?? 0) + (isUnread ? 1 : 0),
        }),
        messages: updateMessages(state, message.chatId, (l) => insertSorted(l, message)),
      }
    }

    case 'sendStarted':
      return {
        ...state,
        chats: upsertChat(state, action.message.chatId, { lastActivity: action.message.timestamp }),
        messages: updateMessages(state, action.message.chatId, (l) => [...l, action.message]),
      }

    case 'sendSucceeded':
      return {
        ...state,
        messages: updateMessages(state, action.chatId, (list) => {
          // The echo notification may have beaten the HTTP response — then drop the local copy.
          if (list.some((m) => m.id === action.id)) return list.filter((m) => m.id !== action.localId)
          return list.map((m) => (m.id === action.localId ? { ...m, id: action.id, status: mergeStatus(m.status, 'sent') } : m))
        }),
      }

    case 'sendFailed':
    case 'retrySend': {
      const status: MessageStatus = action.type === 'sendFailed' ? 'failed' : 'pending'
      return {
        ...state,
        messages: updateMessages(state, action.chatId, (list) =>
          list.map((m) => (m.id === action.localId ? { ...m, status } : m)),
        ),
      }
    }

    case 'setStatus': {
      const list = state.messages[action.chatId]
      if (!list?.some((m) => m.id === action.messageId)) return state
      return {
        ...state,
        messages: updateMessages(state, action.chatId, (l) =>
          l.map((m) => (m.id === action.messageId ? { ...m, status: mergeStatus(m.status, action.status) } : m)),
        ),
      }
    }
  }
}
