export type MessengerId = 'max' | 'telegram' | 'whatsapp'

export interface Credentials {
  apiUrl: string
  idInstance: string
  apiTokenInstance: string
}

export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed'

export interface Message {
  id: string
  chatId: string
  text: string
  /** Unix time, ms */
  timestamp: number
  direction: 'in' | 'out'
  status?: MessageStatus
  /** Non-text message we can't render (media, stickers, etc.) */
  unsupported?: boolean
}

export interface Chat {
  chatId: string
  title: string
  phone?: string
  unread: number
  lastActivity: number
}

export interface AccountState {
  chats: Record<string, Chat>
  messages: Record<string, Message[]>
  activeChatId: string | null
}
