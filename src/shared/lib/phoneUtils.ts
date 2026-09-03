import { getDialCodesSorted } from '@shared/data/countries';

export const DEFAULT_DIAL_CODE = '964';

export function toDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function composePhone(dialCode: string, localNumber: string): string {
  const local = toDigits(localNumber);
  const cleaned = local.startsWith('0') ? local.slice(1) : local;
  return `+${dialCode}${cleaned}`;
}

export function splitPhone(stored: string): { dialCode: string; local: string } {
  const digits = toDigits(stored);
  for (const code of getDialCodesSorted()) {
    if (digits.startsWith(code)) {
      return { dialCode: code, local: digits.slice(code.length) };
    }
  }
  const local = digits.startsWith('0') ? digits.slice(1) : digits;
  return { dialCode: DEFAULT_DIAL_CODE, local };
}

export function validateLocalPhone(value: string): string | undefined {
  const digits = toDigits(value);
  if (!digits) return 'رقم الهاتف مطلوب';
  if (digits.length < 8 || digits.length > 12) return 'رقم الهاتف غير صالح';
  return undefined;
}
