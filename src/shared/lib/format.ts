export function formatNumber(value: number | string): string {
  const num = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(num)) return '0';
  return new Intl.NumberFormat('ar-IQ').format(num);
}

export function formatCurrency(value: number | string, currency = 'د.ع'): string {
  const num = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(num)) return `0 ${currency}`;
  return `${formatNumber(num)} ${currency}`;
}

export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ar-IQ', {
    dateStyle: 'medium',
  }).format(date);
}

export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ar-IQ', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function customerInitial(name: string): string {
  return name.trim().charAt(0) || '؟';
}

export function encodeCustomerQr(customerId: string): string {
  return `cafe_loyalty:${customerId}`;
}