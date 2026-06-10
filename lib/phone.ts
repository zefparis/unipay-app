export const DIAL_CODES = [
  { code: '+243', iso: 'cd', name: 'Congo (RDC)'         },
  { code: '+242', iso: 'cg', name: 'Congo (Brazzaville)' },
  { code: '+237', iso: 'cm', name: 'Cameroun'            },
  { code: '+241', iso: 'ga', name: 'Gabon'               },
  { code: '+236', iso: 'cf', name: 'Centrafrique'        },
  { code: '+257', iso: 'bi', name: 'Burundi'             },
  { code: '+250', iso: 'rw', name: 'Rwanda'              },
  { code: '+256', iso: 'ug', name: 'Ouganda'             },
  { code: '+254', iso: 'ke', name: 'Kenya'               },
  { code: '+255', iso: 'tz', name: 'Tanzanie'            },
  { code: '+260', iso: 'zm', name: 'Zambie'              },
  { code: '+27',  iso: 'za', name: 'Afrique du Sud'      },
  { code: '+33',  iso: 'fr', name: 'France'              },
  { code: '+32',  iso: 'be', name: 'Belgique'            },
  { code: '+49',  iso: 'de', name: 'Allemagne'           },
  { code: '+31',  iso: 'nl', name: 'Pays-Bas'            },
  { code: '+44',  iso: 'gb', name: 'Royaume-Uni'         },
  { code: '+41',  iso: 'ch', name: 'Suisse'              },
  { code: '+1',   iso: 'ca', name: 'Canada'              },
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
