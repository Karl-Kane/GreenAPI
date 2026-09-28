import { MESSENGERS, MESSENGER_ORDER } from '../messengers'
import type { Credentials, MessengerId } from '../types'
import { MessengerLogo } from './Icons'

interface Props {
  active: MessengerId
  sessions: Partial<Record<MessengerId, Credentials>>
  unread: Partial<Record<MessengerId, number>>
  onSelect: (id: MessengerId) => void
}

/** Vertical switcher between messengers (horizontal on phones). */
export function MessengerRail({ active, sessions, unread, onSelect }: Props) {
  return (
    <nav className="rail" aria-label="Мессенджеры">
      <div className="rail__brand" title="Green Chat — клиент для GREEN-API">
        GC
      </div>
      {MESSENGER_ORDER.map((id) => {
        const count = unread[id] ?? 0
        const connected = Boolean(sessions[id])
        return (
          <button
            key={id}
            type="button"
            className={`rail__item${id === active ? ' rail__item--active' : ''}`}
            onClick={() => onSelect(id)}
            aria-current={id === active ? 'page' : undefined}
            title={`${MESSENGERS[id].name}${connected ? '' : ' — не подключён'}`}
          >
            <span className={`rail__logo${connected ? '' : ' rail__logo--off'}`}>
              <MessengerLogo id={id} size={40} />
            </span>
            <span className="rail__label">{MESSENGERS[id].name}</span>
            {count > 0 && <span className="rail__badge">{count > 99 ? '99+' : count}</span>}
          </button>
        )
      })}
    </nav>
  )
}
