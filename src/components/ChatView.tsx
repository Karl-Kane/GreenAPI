import { Fragment, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { formatDayLabel, formatTime, isSameDay } from '../lib/format'
import { formatPhone } from '../lib/phone'
import type { Chat, Message, MessengerId } from '../types'
import { Avatar } from './Avatar'
import { BackIcon, SendIcon, StatusIcon } from './Icons'

interface Props {
  messenger: MessengerId
  chat: Chat
  messages: Message[]
  onSend: (text: string) => void
  onRetry: (messageId: string) => void
  onBack: () => void
}

/** GREEN-API limit for SendMessage */
const MAX_LENGTH = 4000

const PLACEHOLDER: Record<MessengerId, string> = {
  max: 'Сообщение',
  telegram: 'Сообщение',
  whatsapp: 'Введите сообщение',
}

export function ChatView({ messenger, chat, messages, onSend, onRetry, onBack }: Props) {
  const listRef = useRef<HTMLDivElement>(null)
  const stickToBottom = useRef(true)

  // Follow new messages only if the user hasn't scrolled up to read history.
  useLayoutEffect(() => {
    const el = listRef.current
    const last = messages[messages.length - 1]
    if (el && (stickToBottom.current || last?.direction === 'out')) el.scrollTop = el.scrollHeight
  }, [messages])

  const handleScroll = () => {
    const el = listRef.current
    if (el) stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }

  return (
    <section className="chat">
      <header className="chat__header">
        <button type="button" className="icon-btn chat__back" onClick={onBack} aria-label="К списку чатов">
          <BackIcon />
        </button>
        <Avatar id={chat.chatId} title={chat.title} size={40} />
        <div className="chat__heading">
          <h2 className="chat__title">{chat.title}</h2>
          <span className="chat__subtitle">{chat.phone && chat.title !== formatPhone(chat.phone) ? formatPhone(chat.phone) : `ID ${chat.chatId}`}</span>
        </div>
      </header>

      <div className="chat__messages" ref={listRef} onScroll={handleScroll}>
        <div className="chat__messages-inner">
          {messages.length === 0 && <div className="chat__hint">Сообщений пока нет. Напишите первым!</div>}
          {messages.map((message, i) => {
            const prev = messages[i - 1]
            const newDay = !prev || !isSameDay(prev.timestamp, message.timestamp)
            const next = messages[i + 1]
            const first = newDay || prev.direction !== message.direction
            const last = !next || next.direction !== message.direction || !isSameDay(next.timestamp, message.timestamp)
            return (
              <Fragment key={message.id}>
                {newDay && (
                  <div className="day-separator">
                    <span>{formatDayLabel(message.timestamp)}</span>
                  </div>
                )}
                <MessageBubble message={message} first={first} last={last} onRetry={onRetry} />
              </Fragment>
            )
          })}
        </div>
      </div>

      <Composer placeholder={PLACEHOLDER[messenger]} onSend={onSend} />
    </section>
  )
}

function MessageBubble({ message, first, last, onRetry }: { message: Message; first: boolean; last: boolean; onRetry: (id: string) => void }) {
  const failed = message.status === 'failed'
  return (
    <div className={`bubble-row bubble-row--${message.direction}${first ? ' bubble-row--first' : ''}${last ? ' bubble-row--last' : ''}`}>
      <div className={`bubble bubble--${message.direction}`}>
        {message.unsupported ? (
          <span className="bubble__unsupported">Медиа-сообщение — поддерживается только текст</span>
        ) : (
          <span className="bubble__text">{message.text}</span>
        )}
        <span className="bubble__meta">
          <time dateTime={new Date(message.timestamp).toISOString()}>{formatTime(message.timestamp)}</time>
          {message.status && (
            <span className={`bubble__status status--${message.status}`}>
              <StatusIcon status={message.status} />
            </span>
          )}
        </span>
      </div>
      {failed && message.id.startsWith('local-') && (
        <button type="button" className="bubble__retry" onClick={() => onRetry(message.id)}>
          Не отправлено. Повторить
        </button>
      )}
    </div>
  )
}

function Composer({ placeholder, onSend }: { placeholder: string; onSend: (text: string) => void }) {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const trimmed = text.trim()

  // Grow with content up to the CSS max-height.
  useLayoutEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [text])

  function submit(e?: FormEvent) {
    e?.preventDefault()
    if (!trimmed || trimmed.length > MAX_LENGTH) return
    onSend(trimmed)
    setText('')
    inputRef.current?.focus()
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) submit(e)
  }

  return (
    <form className="composer" onSubmit={submit}>
      <div className="composer__field">
        <textarea
          ref={inputRef}
          className="composer__input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          maxLength={MAX_LENGTH}
          autoFocus
          aria-label="Текст сообщения"
        />
      </div>
      <button type="submit" className="composer__send" disabled={!trimmed} aria-label="Отправить">
        <SendIcon />
      </button>
    </form>
  )
}
