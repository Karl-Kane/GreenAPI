import { useEffect, useMemo } from 'react'
import { useAccount } from '../hooks/useAccount'
import type { Credentials, MessengerId } from '../types'
import { ChatView } from './ChatView'
import { ChatBubbleIcon } from './Icons'
import { Sidebar } from './Sidebar'

interface Props {
  messenger: MessengerId
  creds: Credentials
  hidden: boolean
  onUnreadChange: (id: MessengerId, count: number) => void
  onLogout: (id: MessengerId) => void
}

/** One logged-in messenger. Stays mounted while hidden so it keeps receiving messages. */
export function AccountSession({ messenger, creds, hidden, onUnreadChange, onLogout }: Props) {
  const { state, dispatch, connection, sendMessage, retryMessage } = useAccount(messenger, creds)
  const activeChat = state.activeChatId ? state.chats[state.activeChatId] : undefined

  const unread = useMemo(() => Object.values(state.chats).reduce((sum, c) => sum + c.unread, 0), [state.chats])
  useEffect(() => onUnreadChange(messenger, unread), [messenger, unread, onUnreadChange])

  return (
    <div className={`messenger${activeChat ? ' messenger--chat-open' : ''}`} data-messenger={messenger} hidden={hidden}>
      <Sidebar
        messenger={messenger}
        creds={creds}
        state={state}
        connection={connection}
        onOpenChat={(chatId, title, phone) => dispatch({ type: 'openChat', chatId, title, phone })}
        onLogout={() => onLogout(messenger)}
      />
      {activeChat ? (
        <ChatView
          key={activeChat.chatId}
          messenger={messenger}
          chat={activeChat}
          messages={state.messages[activeChat.chatId] ?? []}
          onSend={(text) => sendMessage(activeChat.chatId, text)}
          onRetry={(id) => retryMessage(activeChat.chatId, id)}
          onBack={() => dispatch({ type: 'closeChat' })}
        />
      ) : (
        <section className="empty">
          <div className="empty__icon">
            <ChatBubbleIcon width={40} height={40} />
          </div>
          <h2 className="empty__title">Выберите чат</h2>
          <p className="empty__text">или начните новый — по номеру телефона собеседника</p>
        </section>
      )}
    </div>
  )
}
