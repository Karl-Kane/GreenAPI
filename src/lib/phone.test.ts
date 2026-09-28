import { describe, expect, it } from 'vitest'
import { formatPhone, isValidPhone, normalizePhone } from './phone'

describe('phone', () => {
  it('strips formatting and converts a leading 8 to 7', () => {
    expect(normalizePhone('+7 (999) 123-45-67')).toBe('79991234567')
    expect(normalizePhone('8 999 123 45 67')).toBe('79991234567')
  })

  it('validates length', () => {
    expect(isValidPhone('79991234567')).toBe(true)
    expect(isValidPhone('12345')).toBe(false)
  })

  it('formats Russian numbers', () => {
    expect(formatPhone('79991234567')).toBe('+7 999 123-45-67')
    expect(formatPhone('380501234567')).toBe('+380501234567')
  })
})
