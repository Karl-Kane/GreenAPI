/** Strips everything but digits; a leading Russian trunk "8" becomes "7" (8 999 … → 7 999 …). */
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '')
  return digits.length === 11 && digits.startsWith('8') ? `7${digits.slice(1)}` : digits
}

export function isValidPhone(digits: string): boolean {
  return digits.length >= 10 && digits.length <= 15
}

/** 79991234567 → +7 999 123-45-67; other lengths are just prefixed with "+". */
export function formatPhone(digits: string): string {
  const m = /^7(\d{3})(\d{3})(\d{2})(\d{2})$/.exec(digits)
  return m ? `+7 ${m[1]} ${m[2]}-${m[3]}-${m[4]}` : `+${digits}`
}
