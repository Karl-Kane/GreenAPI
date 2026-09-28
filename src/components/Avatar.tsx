import type { CSSProperties } from 'react'

const PALETTE = ['#ff885e', '#ffcd6a', '#82e080', '#45e8d1', '#6ec9ff', '#b69fff', '#ff8aac']

function hash(value: string): number {
  let h = 0
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) | 0
  return Math.abs(h)
}

function initials(title: string): string {
  const words = title.replace(/[^\p{L}\p{N}\s]/gu, '').trim().split(/\s+/)
  if (!words[0] || /^\d/.test(words[0])) return ''
  return (words[0][0] + (words[1]?.[0] ?? '')).toUpperCase()
}

export function Avatar({ id, title, size = 48 }: { id: string; title: string; size?: number }) {
  const color = PALETTE[hash(id) % PALETTE.length]
  const letters = initials(title)
  return (
    <span className="avatar" style={{ width: size, height: size, '--avatar-color': color } as CSSProperties} aria-hidden>
      {letters || (
        <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.4 0-9 2.2-9 5.5V22h18v-2.5c0-3.3-4.6-5.5-9-5.5Z" />
        </svg>
      )}
    </span>
  )
}
