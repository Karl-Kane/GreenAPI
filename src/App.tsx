import { useCallback, useEffect, useState } from 'react'
import { AccountSession } from './components/AccountSession'
import { LoginScreen } from './components/LoginScreen'
import { MessengerRail } from './components/MessengerRail'
import { loadJson, saveJson } from './lib/storage'
import { MESSENGER_ORDER } from './messengers'
import type { Credentials, MessengerId } from './types'

type Sessions = Partial<Record<MessengerId, Credentials>>

const SESSIONS_KEY = 'green-chat:sessions'
const ACTIVE_KEY = 'green-chat:active'

export default function App() {
  const [sessions, setSessions] = useState<Sessions>(() => loadJson(SESSIONS_KEY, {}))
  const [active, setActive] = useState<MessengerId>(() => loadJson(ACTIVE_KEY, 'max'))
  const [unread, setUnread] = useState<Partial<Record<MessengerId, number>>>({})

  useEffect(() => saveJson(SESSIONS_KEY, sessions), [sessions])
  useEffect(() => saveJson(ACTIVE_KEY, active), [active])

  const totalUnread = Object.values(unread).reduce((sum, n) => sum + (n ?? 0), 0)
  useEffect(() => {
    document.title = totalUnread ? `(${totalUnread}) Green Chat` : 'Green Chat'
  }, [totalUnread])

  const handleUnreadChange = useCallback((id: MessengerId, count: number) => {
    setUnread((prev) => (prev[id] === count ? prev : { ...prev, [id]: count }))
  }, [])

  const login = (id: MessengerId, creds: Credentials) => setSessions((prev) => ({ ...prev, [id]: creds }))

  const logout = useCallback((id: MessengerId) => {
    setSessions(({ [id]: _removed, ...rest }) => rest)
    setUnread(({ [id]: _removed, ...rest }) => rest)
  }, [])

  const activeCreds = sessions[active]

  return (
    <div className="app">
      <MessengerRail active={active} sessions={sessions} unread={unread} onSelect={setActive} />
      <main className="app__content">
        {MESSENGER_ORDER.map((id) => {
          const creds = sessions[id]
          return (
            creds && (
              <AccountSession
                key={`${id}:${creds.idInstance}`}
                messenger={id}
                creds={creds}
                hidden={id !== active}
                onUnreadChange={handleUnreadChange}
                onLogout={logout}
              />
            )
          )
        })}
        {!activeCreds && <LoginScreen key={active} messenger={active} onLogin={(creds) => login(active, creds)} />}
      </main>
    </div>
  )
}
