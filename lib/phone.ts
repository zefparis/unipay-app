export const DIAL_CODES = [
  { flag: '🇨🇩', code: '+243', iso: 'CD', label: 'Congo (RDC)'        },
  { flag: '�🇬', code: '+242', iso: 'CG', label: 'Congo (Brazzaville)' },
  { flag: '🇨🇲', code: '+237', iso: 'CM', label: 'Cameroun'           },
  { flag: '🇬🇦', code: '+241', iso: 'GA', label: 'Gabon'              },
  { flag: '🇨�🇫', code: '+236', iso: 'CF', label: 'Centrafrique'       },
  { flag: '🇧🇮', code: '+257', iso: 'BI', label: 'Burundi'            },
  { flag: '🇷🇼', code: '+250', iso: 'RW', label: 'Rwanda'             },
  { flag: '🇺🇬', code: '+256', iso: 'UG', label: 'Ouganda'            },
  { flag: '🇰🇪', code: '+254', iso: 'KE', label: 'Kenya'              },
  { flag: '🇹🇿', code: '+255', iso: 'TZ', label: 'Tanzanie'           },
  { flag: '🇿🇲', code: '+260', iso: 'ZM', label: 'Zambie'             },
  { flag: '🇿🇦', code: '+27',  iso: 'ZA', label: 'Afrique du Sud'     },
  { flag: '🇫🇷', code: '+33',  iso: 'FR', label: 'France'             },
  { flag: '🇧🇪', code: '+32',  iso: 'BE', label: 'Belgique'           },
  { flag: '��', code: '+49',  iso: 'DE', label: 'Allemagne'          },
  { flag: '��', code: '+31',  iso: 'NL', label: 'Pays-Bas'           },
  { flag: '🇬🇧', code: '+44',  iso: 'GB', label: 'Royaume-Uni'        },
  { flag: '🇨🇭', code: '+41',  iso: 'CH', label: 'Suisse'             },
  { flag: '🇨🇦', code: '+1',   iso: 'CA', label: 'Canada'             },
] as const;

export const AFRICAN_PREFIXES = [
  '+243', '+242', '+237', '+241', '+236',
  '+257', '+250', '+256', '+254', '+255',
  '+260', '+27',
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
