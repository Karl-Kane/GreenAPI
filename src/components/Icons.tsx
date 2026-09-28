import type { SVGProps } from 'react'
import type { MessageStatus, MessengerId } from '../types'

type IconProps = SVGProps<SVGSVGElement>

const base = (props: IconProps): IconProps => ({
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  ...props,
})

export const SendIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4.5 12 3 4.5l18 7.5-18 7.5L4.5 12Zm0 0H12" />
  </svg>
)

export const ComposeIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 20h9M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
)

export const BackIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M19 12H5m6-7-7 7 7 7" />
  </svg>
)

export const LogoutIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14 5-5-5-5m5 5H9" />
  </svg>
)

export const AlertIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v4m0 4h.01" />
  </svg>
)

export const ChatBubbleIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12Z" />
  </svg>
)

export function StatusIcon({ status }: { status: MessageStatus }) {
  const common = { width: 16, height: 11, viewBox: '0 0 16 11', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (status) {
    case 'pending':
      return (
        <svg {...common} viewBox="0 0 12 12" width={12} height={12} aria-label="Отправляется">
          <circle cx="6" cy="6" r="4.8" />
          <path d="M6 3.5V6l1.6 1" />
        </svg>
      )
    case 'sent':
      return (
        <svg {...common} aria-label="Отправлено">
          <path d="m1.5 5.8 3 3 6.5-7" />
        </svg>
      )
    case 'delivered':
    case 'read':
      return (
        <svg {...common} aria-label={status === 'read' ? 'Прочитано' : 'Доставлено'}>
          <path d="m1 5.8 3 3 6.5-7M7.5 8.3l.5.5 6.5-7" />
        </svg>
      )
    case 'failed':
      return <AlertIcon width={14} height={14} aria-label="Не отправлено" />
  }
}

/** Simplified brand marks for the messenger switcher. */
export function MessengerLogo({ id, size = 40 }: { id: MessengerId; size?: number }) {
  switch (id) {
    case 'max':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
          <defs>
            <linearGradient id="max-grad" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="#2e6bff" />
              <stop offset=".55" stopColor="#5b4dff" />
              <stop offset="1" stopColor="#b44dff" />
            </linearGradient>
          </defs>
          <rect width="40" height="40" rx="12" fill="url(#max-grad)" />
          <path d="M20 10.5a9.5 9.5 0 1 0 5 17.6l3.6 1.4-.9-3.8A9.5 9.5 0 0 0 20 10.5Z" fill="none" stroke="#fff" strokeWidth="3" strokeLinejoin="round" />
        </svg>
      )
    case 'telegram':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
          <circle cx="20" cy="20" r="20" fill="#2aabee" />
          <path d="M9.5 19.6 28 12.4c.9-.3 1.6.2 1.3 1.5l-3.1 14.8c-.2 1-.9 1.3-1.7.8l-4.8-3.5-2.3 2.2c-.3.3-.5.5-1 .5l.3-4.9 8.9-8c.4-.3-.1-.5-.6-.2L14 22.5l-4.7-1.5c-1-.3-1-1 .2-1.4Z" fill="#fff" />
        </svg>
      )
    case 'whatsapp':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
          <circle cx="20" cy="20" r="20" fill="#25d366" />
          <path d="M20 9.5a10.5 10.5 0 0 0-9 15.9L9.5 30.5l5.3-1.4A10.5 10.5 0 1 0 20 9.5Z" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M16.3 15.2c.3-.6.6-.6.9-.6h.7c.2 0 .5 0 .7.6l1 2.3c.1.3 0 .5-.1.7l-.7.8c-.2.2-.2.4 0 .6.4.7 1 1.4 1.6 1.9.7.6 1.3.9 1.9 1.1.2.1.4 0 .6-.2l.8-1c.2-.3.4-.3.7-.2l2.2 1c.3.2.5.3.5.4 0 .4 0 1.1-.4 1.7-.4.6-1.6 1.2-2.3 1.2-1 0-2.1-.3-4.2-1.5a11.4 11.4 0 0 1-3.8-4.2c-.8-1.4-.8-2.6-.1-3.9Z" fill="#fff" />
        </svg>
      )
  }
}
