const time = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' })
const dayMonth = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' })
const dayMonthYear = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
const shortDate = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' })
const weekday = new Intl.DateTimeFormat('ru-RU', { weekday: 'short' })

const DAY = 24 * 60 * 60 * 1000

function startOfDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function formatTime(ts: number): string {
  return time.format(ts)
}

export function isSameDay(a: number, b: number): boolean {
  return startOfDay(a) === startOfDay(b)
}

/** Separator between message groups: «Сегодня», «Вчера», «12 марта». */
export function formatDayLabel(ts: number, now = Date.now()): string {
  const diff = startOfDay(now) - startOfDay(ts)
  if (diff === 0) return 'Сегодня'
  if (diff === DAY) return 'Вчера'
  return new Date(ts).getFullYear() === new Date(now).getFullYear() ? dayMonth.format(ts) : dayMonthYear.format(ts)
}

/** Timestamp in the chat list: time today, weekday this week, date otherwise. */
export function formatListTime(ts: number, now = Date.now()): string {
  const diff = startOfDay(now) - startOfDay(ts)
  if (diff === 0) return formatTime(ts)
  if (diff < 7 * DAY) return weekday.format(ts)
  return shortDate.format(ts)
}
