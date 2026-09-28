import { useState, type FormEvent } from 'react'
import { formatPhone, isValidPhone, normalizePhone } from '../lib/phone'
import { MESSENGERS } from '../messengers'
import type { Credentials, MessengerId } from '../types'
import { BackIcon } from './Icons'

interface Props {
  messenger: MessengerId
  creds: Credentials
  onCancel: () => void
  onCreated: (chatId: string, title: string, phone: string) => void
}

export function NewChatPanel({ messenger, creds, onCancel, onCreated }: Props) {
  const config = MESSENGERS[messenger]
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const digits = normalizePhone(phone)
    if (!isValidPhone(digits)) {
      setError('Введите номер в международном формате, например +7 999 123-45-67')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const chatId = await config.resolveChatId(creds, digits)
      onCreated(chatId, formatPhone(digits), digits)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось создать чат')
      setLoading(false)
    }
  }

  return (
    <div className="new-chat">
      <header className="sidebar__header">
        <button type="button" className="icon-btn" onClick={onCancel} aria-label="Назад">
          <BackIcon />
        </button>
        <h2 className="sidebar__title">Новый чат</h2>
      </header>
      <form className="new-chat__form" onSubmit={handleSubmit} noValidate>
        <label className="field">
          <span className="field__label">Номер телефона получателя</span>
          <input
            className="field__input"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+7 999 123-45-67"
            autoComplete="tel"
            autoFocus
          />
        </label>
        {error && (
          <p className="new-chat__error" role="alert">
            {error}
          </p>
        )}
        <button className="new-chat__submit" type="submit" disabled={loading}>
          {loading ? `Ищем в ${config.name}…` : 'Создать чат'}
        </button>
        <p className="new-chat__hint">Проверим, что номер зарегистрирован в {config.name}, и откроем переписку.</p>
      </form>
    </div>
  )
}
