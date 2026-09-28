import { describe, expect, it } from 'vitest'
import { parseNotification } from './notifications'

const senderData = { chatId: '10000000', chatName: 'Анна', senderName: 'Анна' }

describe('parseNotification', () => {
  it('parses an incoming text message', () => {
    const event = parseNotification({
      typeWebhook: 'incomingMessageReceived',
      timestamp: 1763115112,
      idMessage: 'A1',
      senderData,
      messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 'Привет' } },
    })
    expect(event).toEqual({
      kind: 'message',
      chatTitle: 'Анна',
      message: { id: 'A1', chatId: '10000000', text: 'Привет', timestamp: 1763115112000, direction: 'in', status: undefined },
    })
  })

  it('reads WhatsApp extended text', () => {
    const event = parseNotification({
      typeWebhook: 'incomingMessageReceived',
      idMessage: 'A2',
      senderData,
      messageData: { typeMessage: 'extendedTextMessage', extendedTextMessageData: { text: 'https://green-api.com' } },
    })
    expect(event.kind === 'message' && event.message.text).toBe('https://green-api.com')
  })

  it('marks non-text messages as unsupported', () => {
    const event = parseNotification({
      typeWebhook: 'incomingMessageReceived',
      idMessage: 'A3',
      senderData,
      messageData: { typeMessage: 'imageMessage' },
    })
    expect(event.kind === 'message' && event.message.unsupported).toBe(true)
  })

  it('treats messages sent from the phone as outgoing', () => {
    const event = parseNotification({
      typeWebhook: 'outgoingMessageReceived',
      idMessage: 'A4',
      senderData,
      messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 'С телефона' } },
    })
    expect(event.kind === 'message' && event.message.direction).toBe('out')
  })

  it('maps delivery statuses', () => {
    expect(parseNotification({ typeWebhook: 'outgoingMessageStatus', chatId: '1', idMessage: 'A1', status: 'read' })).toEqual({
      kind: 'status',
      chatId: '1',
      messageId: 'A1',
      status: 'read',
    })
    expect(parseNotification({ typeWebhook: 'outgoingMessageStatus', chatId: '1', idMessage: 'A1', status: 'noAccount' })).toMatchObject({
      status: 'failed',
    })
  })

  it('ignores unrelated webhooks', () => {
    expect(parseNotification({ typeWebhook: 'stateInstanceChanged' })).toEqual({ kind: 'ignore' })
  })
})
