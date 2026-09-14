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

/**
 * Strip a redundant country dial code that the user may have typed in the
 * local-number field even though the dial-code selector already provides it.
 *
 * For example, with dialCode '+243' the user might type:
 *   "243853315944"  → strip the leading "243" → "853315944"
 *   "0243853315944" → strip leading "0" then "243" → "853315944"
 *   "0853315944"    → strip leading "0"            → "853315944"
 *   "853315944"     → already clean               → "853315944"
 *
 * This prevents the double-prefix bug (e.g. "+243243853315944").
 */
function stripRedundantDialCode(dialCode: string, localDigits: string): string {
  const ccDigits = dialCode.replace(/\D/g, ''); // e.g. "243"
  if (ccDigits && localDigits.startsWith(ccDigits)) {
    localDigits = localDigits.slice(ccDigits.length);
  }
  // Also strip a leading "0" (local trunk prefix)
  localDigits = localDigits.replace(/^0+/, '');
  return localDigits;
}

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');

  // +243XXXXXXXXX (E.164, 12 digits) → already correct
  if (digits.startsWith('243') && digits.length === 12) return `+${digits}`;

  // 0XXXXXXXXX (local with leading 0, 10 digits) → +243XXXXXXXXX
  if (digits.startsWith('0') && digits.length === 10) return `+243${digits.slice(1)}`;

  // 243243XXXXXXXXX (double-prefix bug, 15 digits) → strip first 243, keep 9 digits
  if (digits.startsWith('243243') && digits.length === 15) return `+243${digits.slice(6)}`;

  // 243XXXXXXXXX without + but exactly 12 digits → +243XXXXXXXXX (already handled above)
  // Bare 9 digits starting with 8 or 9 → DRC local
  if (digits.length === 9 && /^[89]/.test(digits)) return `+243${digits}`;

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
  const localDigits = stripRedundantDialCode(dialCode, local.replace(/\D/g, ''));
  return `${dialCode}${localDigits}`;
}
