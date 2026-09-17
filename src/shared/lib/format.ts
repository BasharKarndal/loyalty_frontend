export function formatNumber(value: number | string): string {
  const num = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(num)) return '0';
  // Western/English digits (0-9) while keeping Arabic UI copy elsewhere.
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatCurrency(value: number | string, currency = 'د.ع'): string {
  const num = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(num)) return `0 ${currency}`;
  return `${formatNumber(num)} ${currency}`;
}

export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  // Numeric months everywhere: DD/MM/YYYY (Western digits).
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export function customerInitial(name: string): string {
  return name.trim().charAt(0) || '؟';
}

export function encodeCustomerQr(customerId: string): string {
  return `cafe_loyalty:${customerId}`;
}
