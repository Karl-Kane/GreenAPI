import { GreenApiError, greenApi } from './api/greenApi'
import type { Credentials, MessengerId } from './types'

export interface MessengerConfig {
  id: MessengerId
  name: string
  /** Turns a phone number (digits only) into the chatId GREEN-API expects for this messenger */
  resolveChatId: (creds: Credentials, phone: string) => Promise<string>
}

async function resolveViaCheckAccount(creds: Credentials, phone: string, name: string): Promise<string> {
  const { exist, chatId } = await greenApi.checkAccount(creds, Number(phone))
  if (!exist || !chatId) throw new GreenApiError(`Номер +${phone} не зарегистрирован в ${name}`)
  return String(chatId)
}

export const MESSENGERS: Record<MessengerId, MessengerConfig> = {
  max: {
    id: 'max',
    name: 'MAX',
    resolveChatId: (creds, phone) => resolveViaCheckAccount(creds, phone, 'MAX'),
  },
  telegram: {
    id: 'telegram',
    name: 'Telegram',
    resolveChatId: (creds, phone) => resolveViaCheckAccount(creds, phone, 'Telegram'),
  },
  whatsapp: {
    id: 'whatsapp',
    name: 'WhatsApp',
    resolveChatId: async (creds, phone) => {
      const { existsWhatsapp } = await greenApi.checkWhatsapp(creds, Number(phone))
      if (!existsWhatsapp) throw new GreenApiError(`Номер +${phone} не зарегистрирован в WhatsApp`)
      return `${phone}@c.us`
    },
  },
}

export const MESSENGER_ORDER: MessengerId[] = ['max', 'telegram', 'whatsapp']
