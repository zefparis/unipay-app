export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('243')) return '+' + digits;
  if (digits.startsWith('0')) return '+243' + digits.slice(1);
  return '+' + digits;
}
