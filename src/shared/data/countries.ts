import { all as allCountryCodes } from 'country-codes-list';

export interface CountryOption {
  iso: string;
  name: string;
  nameAr?: string;
  dialCode: string;
  flag: string;
}

/** Matches Flutter branded_country_picker favorites. */
export const FAVORITE_COUNTRY_CODES = [
  'IQ',
  'SA',
  'AE',
  'KW',
  'QA',
  'BH',
  'OM',
  'JO',
  'EG',
  'LB',
  'SY',
  'PS',
  'YE',
  'LY',
  'TN',
  'MA',
  'DZ',
  'SD',
  'US',
  'GB',
  'TR',
  'IR',
] as const;

const ARABIC_NAMES: Record<string, string> = {
  IQ: 'العراق',
  SA: 'السعودية',
  AE: 'الإمارات',
  KW: 'الكويت',
  QA: 'قطر',
  BH: 'البحرين',
  OM: 'عُمان',
  JO: 'الأردن',
  EG: 'مصر',
  LB: 'لبنان',
  SY: 'سوريا',
  PS: 'فلسطين',
  YE: 'اليمن',
  LY: 'ليبيا',
  TN: 'تونس',
  MA: 'المغرب',
  DZ: 'الجزائر',
  SD: 'السودان',
  US: 'الولايات المتحدة',
  GB: 'المملكة المتحدة',
  TR: 'تركيا',
  IR: 'إيران',
};

function toCountryOption(entry: (typeof allCountryCodes)[number]): CountryOption | null {
  const dialCode = entry.countryCallingCode?.replace(/\D/g, '') ?? '';
  if (!dialCode || !entry.countryCode) return null;
  return {
    iso: entry.countryCode,
    name: entry.countryNameEn,
    nameAr: ARABIC_NAMES[entry.countryCode],
    dialCode,
    flag: entry.flag || '🏳️',
  };
}

export const ALL_COUNTRIES: CountryOption[] = allCountryCodes()
  .map(toCountryOption)
  .filter((c): c is CountryOption => c !== null)
  .sort((a, b) => a.name.localeCompare(b.name, 'ar'));

export const FAVORITE_COUNTRIES: CountryOption[] = FAVORITE_COUNTRY_CODES.map((iso) =>
  ALL_COUNTRIES.find((c) => c.iso === iso)
).filter((c): c is CountryOption => c !== undefined);

let dialCodesSortedCache: string[] | null = null;

export function getDialCodesSorted(): string[] {
  if (!dialCodesSortedCache) {
    dialCodesSortedCache = [...new Set(ALL_COUNTRIES.map((c) => c.dialCode))].sort(
      (a, b) => b.length - a.length
    );
  }
  return dialCodesSortedCache;
}

export function findCountryByDialCode(dialCode: string): CountryOption | undefined {
  return ALL_COUNTRIES.find((c) => c.dialCode === dialCode);
}

export function searchCountries(query: string): CountryOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return ALL_COUNTRIES;
  return ALL_COUNTRIES.filter((c) => {
    const display = c.nameAr ?? c.name;
    return (
      display.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.iso.toLowerCase().includes(q) ||
      c.dialCode.includes(q.replace(/\D/g, '')) ||
      `+${c.dialCode}`.includes(q)
    );
  });
}
