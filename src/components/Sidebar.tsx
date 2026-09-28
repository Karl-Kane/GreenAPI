import { useMemo, useState } from 'react'
import type { ConnectionState } from '../hooks/useAccount'
import { formatListTime } from '../lib/format'
import { MESSENGERS } from '../messengers'
import type { AccountState, Credentials, MessengerId } from '../types'
import { Avatar } from './Avatar'
import { ComposeIcon, LogoutIcon, StatusIcon } from './Icons'
import { NewChatPanel } from './NewChatPanel'

interface Props {
  messenger: MessengerId
  creds: Credentials
  state: AccountState
  connection: ConnectionState
  onOpenChat: (chatId: string, title: string, phone?: string) => void
  onLogout: () => void
}

const CONNECTION_LABEL: Record<ConnectionState, string | null> = {
  connecting: 'Подключение…',
  online: null,
  offline: 'Нет соединения, переподключаемся…',
}

export function Sidebar({ messenger, creds, state, connection, onOpenChat, onLogout }: Props) {
  const [creating, setCreating] = useState(false)
  const chats = useMemo(() => Object.values(state.chats).sort((a, b) => b.lastActivity - a.lastActivity), [state.chats])
  const connectionLabel = CONNECTION_LABEL[connection]

  if (creating) {
    return (
      <aside className="sidebar">
        <NewChatPanel
          messenger={messenger}
          creds={creds}
          onCancel={() => setCreating(false)}
          onCreated={(chatId, title, phone) => {
            setCreating(false)
            onOpenChat(chatId, title, phone)
          }}
        />
      </aside>
    )
  }

  return (
    <aside className="sidebar">
      <header className="sidebar__header">
        <div className="sidebar__heading">
          <h2 className="sidebar__title">{MESSENGERS[messenger].name}</h2>
          <span className={`sidebar__status sidebar__status--${connection}`}>
            {connectionLabel ?? `Инстанс ${creds.idInstance}`}
          </span>
        </div>
        <button type="button" className="icon-btn" onClick={() => setCreating(true)} title="Новый чат" aria-label="Новый чат">
          <ComposeIcon />
        </button>
        <button type="button" className="icon-btn" onClick={onLogout} title="Выйти" aria-label="Выйти">
          <LogoutIcon />
        </button>
      </header>

      <ul className="chat-list">
        {chats.length === 0 && (
          <li className="chat-list__empty">
            <p>Чатов пока нет</p>
            <button type="button" className="text-btn" onClick={() => setCreating(true)}>
              Начать новый чат
            </button>
          </li>
        )}
        {chats.map((chat) => {
          const list = state.messages[chat.chatId]
          const last = list?.[list.length - 1]
          const active = chat.chatId === state.activeChatId
          return (
            <li key={chat.chatId}>
              <button
                type="button"
                className={`chat-item${active ? ' chat-item--active' : ''}`}
                onClick={() => onOpenChat(chat.chatId, chat.title, chat.phone)}
              >
                <Avatar id={chat.chatId} title={chat.title} />
                <span className="chat-item__body">
                  <span className="chat-item__row">
                    <span className="chat-item__title">{chat.title}</span>
                    {last && <span className="chat-item__time">{formatListTime(last.timestamp)}</span>}
                  </span>
                  <span className="chat-item__row">
                    <span className="chat-item__preview">
                      {last?.direction === 'out' && last.status && (
                        <span className={`chat-item__status status--${last.status}`}>
                          <StatusIcon status={last.status} />
                        </span>
                      )}
                      {last ? (last.unsupported ? 'Медиа-сообщение' : last.text) : 'Нет сообщений'}
                    </span>
                    {chat.unread > 0 && <span className="chat-item__badge">{chat.unread}</span>}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
