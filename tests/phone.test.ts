import { describe, it, expect } from 'vitest';
import {
  buildE164,
  detectDialCode,
  exampleLocalNumber,
  isValidE164,
  isValidIntlPhone,
  normalizePhone,
  validateDRCPhone,
} from '@/lib/phone';

describe('buildE164 — saisie robuste anti double-indicatif', () => {
  it.each<[string, string, string]>([
    // local nu
    ['758060556', '+33', '+33758060556'],
    // trunk 0
    ['0758060556', '+33', '+33758060556'],
    // indicatif déjà tapé dans le champ local
    ['+33758060556', '+33', '+33758060556'],
    ['+33 7 58 06 05 56', '+33', '+33758060556'],
    // indicatif sans "+"
    ['33758060556', '+33', '+33758060556'],
    // RDC
    ['812345678', '+243', '+243812345678'],
    ['+243812345678', '+243', '+243812345678'],
    // "+" tapé avec un sélecteur différent → le "+" l'emporte
    ['+33 7 58 06 05 56', '+243', '+33758060556'],
    // trunk 0 devant l'indicatif
    ['0243853315944', '+243', '+243853315944'],
    // indicatif dupliqué
    ['243243853315944', '+243', '+243853315944'],
    ['+243 243 853 315 944', '+243', '+243853315944'],
    // séparateurs divers
    ['08 53-31 59 44', '+243', '+243853315944'],
    ['(085) 331-5944', '+243', '+243853315944'],
  ])('buildE164(%j, %j) → %j', (local, dial, expected) => {
    expect(buildE164(dial, local)).toBe(expected);
  });
});

describe('isValidE164 — validation stricte (8–15 chiffres)', () => {
  it.each([
    '+243853315944',
    '+33758060556',
    '+12345678',
    '+2438533159',
    '+123456789012345', // 15 chiffres, max E.164
  ])('accepte %j', (phone) => {
    expect(isValidE164(phone)).toBe(true);
  });

  it.each([
    '',
    '+243',
    '0853315944',         // pas de "+"
    '+0123456',           // commence par 0
    '+1234567890123456',  // 16 chiffres, dépasse E.164
    '+243 853 315 944',   // espaces non nettoyés
    'abc',
  ])('rejette %j', (phone) => {
    expect(isValidE164(phone)).toBe(false);
  });
});

describe('validateDRCPhone — gate inscription (RDC uniquement)', () => {
  it('accepte un +243 valide quel que soit le format saisi', () => {
    for (const raw of ['+243853315944', '0853315944', '243853315944', '+243 853 315 944']) {
      expect(validateDRCPhone(raw)).toBe(true);
      expect(normalizePhone(raw)).toBe('+243853315944');
    }
  });

  it('rejette les numéros non-RDC (le backend impose +243 + 9 chiffres)', () => {
    expect(validateDRCPhone('+33758060556')).toBe(false);
  });
});

describe('buildE164 — multi-pays', () => {
  it.each<[string, string, string]>([
    ['612345678', '+33', '+33612345678'],
    ['853315944', '+243', '+243853315944'],
    ['+33 6 12 34 56 78', '+243', '+33612345678'], // le "+" gagne, sélecteur corrigé
    ['0612345678', '+33', '+33612345678'],
    ['0243853315944', '+243', '+243853315944'],
    ['0707070707', '+225', '+2250707070707'],
    ['77 123 45 67', '+221', '+221771234567'],
    ['470123456', '+32', '+32470123456'],
  ])('buildE164(%j, %j) → %j', (local, dial, expected) => {
    expect(buildE164(dial, local)).toBe(expected);
  });
});

describe('isValidIntlPhone — validation par pays via libphonenumber', () => {
  it.each([
    ['+33612345678'],
    ['+243853315944'],
    ['+2250707070707'],
    ['+32470123456'],
    ['+12024561414'],
  ])('accepte %j', (phone) => {
    expect(isValidIntlPhone(phone)).toBe(true);
  });

  it.each([
    ['+33123', false],           // trop court pour la France
    ['+2431234', false],         // trop court pour la RDC
    ['+999999999999', false],    // indicatif inexistant
    ['abc', false],
    ['', false],
  ])('%j → %j', (phone, expected) => {
    expect(isValidIntlPhone(phone)).toBe(expected);
  });
});

describe('detectDialCode — sélecteur suit le "+" tapé', () => {
  it.each<[string, string | null]>([
    ['+33612345678', '+33'],
    ['+33 6 12', '+33'],
    ['+243853315944', '+243'],
    ['+22507', '+225'],
    ['612345678', null],   // pas de "+"
    ['+999', null],        // indicatif inconnu
  ])('detectDialCode(%j) → %j', (input, expected) => {
    expect(detectDialCode(input)).toBe(expected);
  });
});

describe('exampleLocalNumber — placeholder par pays', () => {
  it('fournit un exemple national sans indicatif', () => {
    const fr = exampleLocalNumber('+33');
    const cd = exampleLocalNumber('+243');
    expect(fr).toMatch(/^[0-9 .-]+$/);
    expect(cd).toMatch(/^[0-9 .-]+$/);
    expect(fr).not.toContain('+33');
    expect(cd).not.toContain('+243');
  });
});
