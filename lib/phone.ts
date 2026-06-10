export const DIAL_CODES = [
  { flag: '🇨🇩', code: '+243', iso: 'CD', label: 'Congo RDC' },
  { flag: '🇫🇷', code: '+33',  iso: 'FR', label: 'France'   },
  { flag: '🇧🇪', code: '+32',  iso: 'BE', label: 'Belgique' },
  { flag: '🇨🇦', code: '+1',   iso: 'CA', label: 'Canada'   },
  { flag: '🇺🇸', code: '+1',   iso: 'US', label: 'États-Unis' },
  { flag: '🇬🇧', code: '+44',  iso: 'GB', label: 'Royaume-Uni' },
] as const;

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('243') && digits.length === 12) return `+${digits}`;
  if (digits.startsWith('0') && digits.length === 10) return `+243${digits.slice(1)}`;
  if (raw.trimStart().startsWith('+')) return raw.replace(/\s/g, '');
  return `+${digits}`;
}

export function validateDRCPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  return /^\+243[0-9]{9}$/.test(normalized);
}

export function validatePhone(phone: string): boolean {
  return /^\+[1-9][0-9]{7,14}$/.test(phone.replace(/\s/g, ''));
}

export function buildE164(dialCode: string, local: string): string {
  const localDigits = local.replace(/\D/g, '').replace(/^0+/, '');
  return `${dialCode}${localDigits}`;
}
