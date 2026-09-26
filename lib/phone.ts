import {
  AsYouType,
  getExampleNumber,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js/min';
import mobileExamples from 'libphonenumber-js/examples.mobile.json';

export const DIAL_CODES = [
  { code: '+243', iso: 'cd', name: 'Congo (RDC)'         },
  { code: '+242', iso: 'cg', name: 'Congo (Brazzaville)' },
  { code: '+237', iso: 'cm', name: 'Cameroun'            },
  { code: '+225', iso: 'ci', name: "Côte d'Ivoire"       },
  { code: '+221', iso: 'sn', name: 'Sénégal'             },
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
  { code: '+1',   iso: 'ca', name: 'Canada / USA'        },
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
 * The strip is iterative: a trunk "0" may precede the country code
 * ("0243853315944") and the code may be duplicated ("243243853315944").
 * This prevents the double-prefix bug (e.g. "+243243853315944").
 */
function stripRedundantDialCode(dialCode: string, localDigits: string): string {
  const ccDigits = dialCode.replace(/\D/g, ''); // e.g. "243"
  let prev: string;
  do {
    prev = localDigits;
    localDigits = localDigits.replace(/^0+/, '');
    if (ccDigits && localDigits.startsWith(ccDigits)) {
      localDigits = localDigits.slice(ccDigits.length);
    }
  } while (localDigits !== prev);
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

/**
 * Build the final E.164 number from the composite input (dial-code selector +
 * local field). A leading "+" typed by the user wins over the selector —
 * the input is treated as a complete international number, which prevents
 * double prefixes like "+24333758060556" (selector +243, user typed "+33…").
 */
export function buildE164(dialCode: string, local: string): string {
  const trimmed = local.trim();

  if (trimmed.startsWith('+')) {
    const parsed = parsePhoneNumberFromString(trimmed);
    if (parsed?.isValid()) return parsed.number;
    let digits = trimmed.replace(/\D/g, '');
    const cc = dialCode.replace(/\D/g, '');
    // "+243 243 853…" — the typed number itself repeats the selected code.
    if (cc && digits.startsWith(cc + cc)) {
      digits = digits.slice(cc.length);
    }
    return `+${digits}`;
  }

  // Country-aware parse: libphonenumber applies each country's trunk-prefix
  // rules correctly (France drops the leading 0, Côte d'Ivoire keeps it in
  // the national number).
  const entry = DIAL_CODES.find((d) => d.code === dialCode);
  const parsed = entry
    ? parsePhoneNumberFromString(local, entry.iso.toUpperCase() as CountryCode)
    : undefined;
  if (parsed?.isValid()) return parsed.number;

  // Fallback for inputs strict parsing rejects ("0243…", "243243…"):
  // iteratively strip trunk 0s and the selected dial code.
  const localDigits = stripRedundantDialCode(dialCode, local.replace(/\D/g, ''));
  return `${dialCode}${localDigits}`;
}

/**
 * Strict E.164 validation: "+" followed by 8–15 digits, first digit non-zero.
 */
export function isValidE164(phone: string): boolean {
  return /^\+[1-9][0-9]{7,14}$/.test(phone);
}

/**
 * Full international validation via libphonenumber-js metadata — checks the
 * number is actually valid for its country, not just shaped like E.164.
 */
export function isValidIntlPhone(phone: string): boolean {
  try {
    return isValidPhoneNumber(phone);
  } catch {
    return false;
  }
}

/**
 * Local-format example for a dial code (no country prefix) — used as the
 * input placeholder so users see what to type.
 */
export function exampleLocalNumber(dialCode: string): string {
  const entry = DIAL_CODES.find((d) => d.code === dialCode);
  if (!entry) return '';
  const iso = entry.iso.toUpperCase() as Parameters<typeof getExampleNumber>[0];
  const ex = getExampleNumber(iso, mobileExamples);
  return ex ? ex.formatNational() : '';
}

/**
 * Detect the dial code of a "+…" input while the user types. Returns the
 * matching code from DIAL_CODES, or null if not recognised / not listed.
 */
export function detectDialCode(input: string): string | null {
  if (!input.trimStart().startsWith('+')) return null;
  const formatter = new AsYouType();
  formatter.input(input);
  const iso = formatter.getCountry();
  if (!iso) return null;
  return DIAL_CODES.find((d) => d.iso === iso.toLowerCase())?.code ?? null;
}
