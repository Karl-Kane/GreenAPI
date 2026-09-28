import type { NotificationBody } from '../api/greenApi'
import type { Message, MessageStatus } from '../types'

export type ChatEvent =
  | { kind: 'message'; message: Message; chatTitle?: string }
  | { kind: 'status'; chatId: string; messageId: string; status: MessageStatus }
  | { kind: 'ignore' }

const IGNORE: ChatEvent = { kind: 'ignore' }

function extractText(messageData: NotificationBody['messageData']): string | null {
  if (!messageData) return null
  switch (messageData.typeMessage) {
    case 'textMessage':
      return messageData.textMessageData?.textMessage ?? null
    // WhatsApp sends messages with link previews / replies as extended text
    case 'extendedTextMessage':
    case 'quotedMessage':
      return messageData.extendedTextMessageData?.text ?? null
    default:
      return null
  }
}

function mapStatus(status: string | undefined): MessageStatus | null {
  switch (status) {
    case 'sent':
    case 'delivered':
    case 'read':
      return status
    case 'failed':
    case 'noAccount':
    case 'notInGroup':
      return 'failed'
    default:
      return null
  }
}

/** Converts a GREEN-API webhook body into an event the chat state understands. */
export function parseNotification(body: NotificationBody): ChatEvent {
  switch (body.typeWebhook) {
    case 'incomingMessageReceived':
    case 'outgoingMessageReceived': // sent from the phone app
    case 'outgoingAPIMessageReceived': {
      // sent via API (including from this app)
      const { senderData, idMessage, messageData } = body
      if (!senderData?.chatId || !idMessage) return IGNORE

      const incoming = body.typeWebhook === 'incomingMessageReceived'
      const text = extractText(messageData)
      return {
        kind: 'message',
        chatTitle: incoming ? senderData.senderContactName || senderData.chatName || senderData.senderName : senderData.chatName,
        message: {
          id: idMessage,
          chatId: senderData.chatId,
          text: text ?? '',
          ...(text === null && { unsupported: true }),
          timestamp: (body.timestamp ?? Date.now() / 1000) * 1000,
          direction: incoming ? 'in' : 'out',
          status: incoming ? undefined : 'sent',
        },
      }
    }
    case 'outgoingMessageStatus': {
      const status = mapStatus(body.status)
      if (!status || !body.chatId || !body.idMessage) return IGNORE
      return { kind: 'status', chatId: body.chatId, messageId: body.idMessage, status }
    }
    default:
      return IGNORE
  }
}
