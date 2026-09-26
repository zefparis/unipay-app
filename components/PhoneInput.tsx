'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { isValidPhoneNumber, AsYouType } from 'libphonenumber-js/min';
import { DIAL_CODES, buildE164 } from '@/lib/phone';

/** Concrete local-format examples shown as placeholders (no dial code). */
const PLACEHOLDER_BY_DIAL: Record<string, string> = {
  '+243': '853 315 944',
  '+242': '06 123 4567',
  '+237': '6 12 34 56 78',
  '+33':  '6 12 34 56 78',
  '+32':  '470 12 34 56',
  '+44':  '7400 123456',
  '+1':   '555 123 4567',
};

interface Props {
  value: string;
  onChange: (e164: string) => void;
  onValid?: (valid: boolean) => void;
  placeholder?: string;
  inputClassName?: string;
  selectClassName?: string;
  inputStyle?: React.CSSProperties;
  selectStyle?: React.CSSProperties;
  disabled?: boolean;
}

export default function PhoneInput({
  value,
  onChange,
  onValid,
  placeholder,
  inputClassName = '',
  selectClassName = '',
  inputStyle,
  selectStyle,
  disabled = false,
}: Props) {
  const [dialCode, setDialCode] = useState('+243');
  const [local, setLocal]       = useState('');
  const [open, setOpen]         = useState(false);
  const dropRef                 = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  function handleDialChange(code: string) {
    setDialCode(code);
    const e164 = buildE164(code, local);
    onChange(e164);
    onValid?.(isValidPhoneNumber(e164));
    setOpen(false);
  }

  function handleLocalChange(raw: string) {
    setLocal(raw);
    const e164 = buildE164(dialCode, raw);
    onChange(e164);
    onValid?.(raw.length > 4 && isValidPhoneNumber(e164));
  }

  const selected = DIAL_CODES.find((d) => d.code === dialCode) ?? DIAL_CODES[0];

  // A "+" typed in the local field means a full international number — it
  // overrides the selector, so we surface what will actually be sent.
  const typedIntl = local.trimStart().startsWith('+');

  const preview = useMemo(() => {
    if (!local.trim()) return '';
    const e164 = buildE164(dialCode, local);
    const formatted = new AsYouType().input(e164);
    return formatted || e164;
  }, [local, dialCode]);

  return (
    <div className="flex w-full gap-2 min-w-0">

      {/* Country selector — custom dropdown */}
      <div ref={dropRef} className="relative shrink-0">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}
          style={selectStyle}
          className={`flex items-center gap-1.5 h-full px-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00C896] transition-all ${selectClassName}`}
          aria-label="Indicatif pays"
          aria-expanded={open}
        >
          <span className="text-sm font-semibold text-gray-900 dark:text-slate-100 whitespace-nowrap">
            {dialCode} · {selected.name}
          </span>
        </button>

        {open && (
          <div className="absolute left-0 top-full mt-1 z-50 w-56 max-h-64 overflow-y-auto rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-xl">
            {DIAL_CODES.map((d) => (
              <button
                key={`${d.iso}-${d.code}`}
                type="button"
                onClick={() => handleDialChange(d.code)}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 dark:hover:bg-slate-700 ${
                  dialCode === d.code ? 'bg-green-50 dark:bg-green-900/20' : ''
                }`}
              >
                <span className="font-semibold text-gray-700 dark:text-slate-300">{d.code}</span>
                <span className="text-gray-500 dark:text-slate-500">·</span>
                <span className="text-gray-600 dark:text-slate-400 truncate">{d.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Phone number input + live E.164 preview */}
      <div className="min-w-0 flex-1 flex flex-col">
        <input
          type="tel"
          value={local}
          onChange={(e) => handleLocalChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder ?? (PLACEHOLDER_BY_DIAL[dialCode] ?? 'N° local')}
          autoComplete="off"
          inputMode="tel"
          style={inputStyle}
          className={`min-w-0 w-full border rounded-xl px-4 py-3.5 text-base bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-500 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00C896] transition-all border-gray-200 dark:border-slate-600 ${inputClassName}`}
          aria-label="Numero de telephone"
        />
        {preview && (
          <p className="mt-1.5 px-1 text-xs text-gray-500 dark:text-slate-400">
            Sera enregistré comme : <span className="font-semibold text-gray-700 dark:text-slate-300">{preview}</span>
          </p>
        )}
        {typedIntl && (
          <p className="mt-1 px-1 text-xs text-amber-600 dark:text-amber-400">
            Indicatif déjà sélectionné ci-contre — saisissez uniquement le numéro local.
          </p>
        )}
      </div>

    </div>
  );
}
