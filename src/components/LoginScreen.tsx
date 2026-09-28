import { useState, type ChangeEvent, type FormEvent } from 'react'
import { greenApi } from '../api/greenApi'
import { MESSENGERS } from '../messengers'
import type { Credentials, MessengerId } from '../types'
import { MessengerLogo } from './Icons'

interface Props {
  messenger: MessengerId
  onLogin: (creds: Credentials) => void
}

const STATE_HINTS: Record<string, string> = {
  notAuthorized: 'Инстанс не авторизован — привяжите аккаунт в личном кабинете GREEN-API',
  blocked: 'Инстанс заблокирован',
  starting: 'Инстанс запускается, попробуйте через минуту',
  yellowCard: 'Отправка сообщений временно приостановлена мессенджером',
}

export function LoginScreen({ messenger, onLogin }: Props) {
  const { name } = MESSENGERS[messenger]
  const [form, setForm] = useState<Credentials>({ apiUrl: '', idInstance: '', apiTokenInstance: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const update = (field: keyof Credentials) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const creds: Credentials = {
      apiUrl: form.apiUrl.trim(),
      idInstance: form.idInstance.trim(),
      apiTokenInstance: form.apiTokenInstance.trim(),
    }
    if (!creds.apiUrl || !creds.idInstance || !creds.apiTokenInstance) {
      setError('Заполните все поля')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const { stateInstance } = await greenApi.getStateInstance(creds)
      if (stateInstance !== 'authorized') {
        setError(STATE_HINTS[stateInstance] ?? `Инстанс в состоянии «${stateInstance}»`)
        return
      }
      onLogin(creds)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось войти')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login" data-messenger={messenger}>
      <div className="login__hero" />
      <form className="login__card" onSubmit={handleSubmit} noValidate>
        <div className="login__logo">
          <MessengerLogo id={messenger} size={72} />
        </div>
        <h1 className="login__title">Вход в {name}</h1>
        <p className="login__subtitle">Введите данные инстанса GREEN-API, к которому привязан ваш аккаунт {name}</p>

        <label className="field">
          <span className="field__label">apiUrl</span>
          <input
            className="field__input"
            value={form.apiUrl}
            onChange={update('apiUrl')}
            placeholder="https://1103.api.green-api.com"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <label className="field">
          <span className="field__label">idInstance</span>
          <input
            className="field__input"
            value={form.idInstance}
            onChange={update('idInstance')}
            placeholder="1101000001"
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <label className="field">
          <span className="field__label">apiTokenInstance</span>
          <input
            className="field__input"
            type="password"
            value={form.apiTokenInstance}
            onChange={update('apiTokenInstance')}
            placeholder="d75b3a66374942c5b3c019c698abc2067e151558acbd412345"
            autoComplete="off"
            spellCheck={false}
          />
        </label>

        {error && (
          <p className="login__error" role="alert">
            {error}
          </p>
        )}

        <button className="login__submit" type="submit" disabled={loading}>
          {loading ? 'Проверяем…' : 'Войти'}
        </button>

        <p className="login__help">
          Данные находятся в{' '}
          <a href="https://console.green-api.com" target="_blank" rel="noreferrer">
            личном кабинете GREEN-API
          </a>
          . Для приёма сообщений поле webhookUrl в настройках инстанса должно быть пустым, а уведомления о входящих — включены.
        </p>
      </form>
    </div>
  )
}
