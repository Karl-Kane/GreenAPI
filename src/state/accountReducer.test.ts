import { describe, expect, it } from 'vitest'
import type { AccountState, Message } from '../types'
import { accountReducer, initialAccountState, type AccountAction } from './accountReducer'

const CHAT = '10000000'

function msg(partial: Partial<Message>): Message {
  return { id: 'm1', chatId: CHAT, text: 'hi', timestamp: 1000, direction: 'in', ...partial }
}

function run(...actions: AccountAction[]): AccountState {
  return actions.reduce(accountReducer, initialAccountState)
}

const openByPhone: AccountAction = { type: 'openChat', chatId: CHAT, title: '+7 999 123-45-67', phone: '79991234567' }

describe('accountReducer', () => {
  it('creates a chat on the first incoming message and counts it as unread', () => {
    const state = run({ type: 'receiveMessage', message: msg({}), chatTitle: 'Анна' })
    expect(state.chats[CHAT]).toMatchObject({ title: 'Анна', unread: 1 })
    expect(state.messages[CHAT]).toHaveLength(1)
  })

  it('does not count messages in the open chat as unread', () => {
    const state = run(openByPhone, { type: 'receiveMessage', message: msg({}) })
    expect(state.chats[CHAT].unread).toBe(0)
  })

  it('replaces the phone placeholder title with the contact name', () => {
    const state = run(openByPhone, { type: 'receiveMessage', message: msg({}), chatTitle: 'Анна' })
    expect(state.chats[CHAT].title).toBe('Анна')
  })

  it('ignores duplicate notifications', () => {
    const state = run({ type: 'receiveMessage', message: msg({}) }, { type: 'receiveMessage', message: msg({}) })
    expect(state.messages[CHAT]).toHaveLength(1)
    expect(state.chats[CHAT].unread).toBe(1)
  })

  it('swaps the local id for the server id after sending', () => {
    const state = run(
      { type: 'sendStarted', message: msg({ id: 'local-1', direction: 'out', status: 'pending' }) },
      { type: 'sendSucceeded', chatId: CHAT, localId: 'local-1', id: 'SRV1' },
    )
    expect(state.messages[CHAT]).toEqual([expect.objectContaining({ id: 'SRV1', status: 'sent' })])
  })

  it('drops the local copy when the API echo arrived before the HTTP response', () => {
    const state = run(
      { type: 'sendStarted', message: msg({ id: 'local-1', direction: 'out', status: 'pending' }) },
      { type: 'receiveMessage', message: msg({ id: 'SRV1', direction: 'out', status: 'sent' }) },
      { type: 'sendSucceeded', chatId: CHAT, localId: 'local-1', id: 'SRV1' },
    )
    expect(state.messages[CHAT].map((m) => m.id)).toEqual(['SRV1'])
  })

  it('never downgrades a delivery status', () => {
    const state = run(
      { type: 'receiveMessage', message: msg({ id: 'SRV1', direction: 'out', status: 'sent' }) },
      { type: 'setStatus', chatId: CHAT, messageId: 'SRV1', status: 'read' },
      { type: 'setStatus', chatId: CHAT, messageId: 'SRV1', status: 'delivered' },
    )
    expect(state.messages[CHAT][0].status).toBe('read')
  })

  it('marks a failed send and lets it be retried', () => {
    const failed = run(
      { type: 'sendStarted', message: msg({ id: 'local-1', direction: 'out', status: 'pending' }) },
      { type: 'sendFailed', chatId: CHAT, localId: 'local-1' },
    )
    expect(failed.messages[CHAT][0].status).toBe('failed')
    const retried = accountReducer(failed, { type: 'retrySend', chatId: CHAT, localId: 'local-1' })
    expect(retried.messages[CHAT][0].status).toBe('pending')
  })
})
