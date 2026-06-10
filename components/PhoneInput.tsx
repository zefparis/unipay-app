'use client';

import { useState, useEffect } from 'react';
import { isValidPhoneNumber } from 'libphonenumber-js/min';
import { DIAL_CODES, buildE164 } from '@/lib/phone';

interface Props {
  value: string;
  onChange: (e164: string) => void;
  onValid?: (valid: boolean) => void;
  placeholder?: string;
  inputClassName?: string;
  selectClassName?: string;
  disabled?: boolean;
}

export default function PhoneInput({
  value,
  onChange,
  onValid,
  placeholder,
  inputClassName = '',
  selectClassName = '',
  disabled = false,
}: Props) {
  const [dialCode, setDialCode] = useState('+243');
  const [local, setLocal]       = useState('');

  useEffect(() => {
    if (!value) return;
    const matched = DIAL_CODES.find((d) => value.startsWith(d.code));
    if (matched) {
      setDialCode(matched.code);
      setLocal(value.slice(matched.code.length));
    } else {
      setLocal(value);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleDialChange(code: string) {
    setDialCode(code);
    const e164 = buildE164(code, local);
    onChange(e164);
    onValid?.(isValidPhoneNumber(e164));
  }

  function handleLocalChange(raw: string) {
    setLocal(raw);
    const e164 = buildE164(dialCode, raw);
    onChange(e164);
    onValid?.(raw.length > 4 && isValidPhoneNumber(e164));
  }

  const selectedEntry = DIAL_CODES.find((d) => d.code === dialCode) ?? DIAL_CODES[0];

  return (
    <div className="flex gap-2">
      <select
        value={dialCode}
        onChange={(e) => handleDialChange(e.target.value)}
        disabled={disabled}
        className={`shrink-0 rounded-xl px-2 py-3.5 text-sm font-semibold border focus:outline-none focus:ring-2 focus:ring-[#00C896] transition-all bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 border-gray-200 dark:border-slate-600 ${selectClassName}`}
        aria-label="Indicatif pays"
      >
        {DIAL_CODES.map((d) => (
          <option key={`${d.iso}-${d.code}`} value={d.code}>
            {d.flag} {d.code}
          </option>
        ))}
      </select>

      <input
        type="tel"
        value={local}
        onChange={(e) => handleLocalChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder ?? (dialCode === '+243' ? '9X XXX XXXX' : 'N° local')}
        className={`flex-1 border rounded-xl px-4 py-3.5 text-base bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00C896] transition-all border-gray-200 dark:border-slate-600 ${inputClassName}`}
        aria-label="Numéro de téléphone"
      />

      <span className="sr-only">
        {selectedEntry.flag} {selectedEntry.label}
      </span>
    </div>
  );
}
