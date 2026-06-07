export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('243')) return '+' + digits;
  if (digits.startsWith('0')) return '+243' + digits.slice(1);
  return '+' + digits;
}

export function validateDRCPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  return /^\+243[0-9]{9}$/.test(normalized);
}
