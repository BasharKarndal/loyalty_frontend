const QR_PREFIX = 'cafe_loyalty:';
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function encodeCustomerQr(customerId: string): string {
  return `${QR_PREFIX}${customerId}`;
}

/** Parses prefixed payloads and legacy raw UUIDs — mirrors Flutter CustomerQrCodec. */
export function decodeCustomerQr(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;

  if (value.startsWith(QR_PREFIX)) {
    const id = value.slice(QR_PREFIX.length).trim();
    return id || null;
  }

  if (UUID_PATTERN.test(value)) return value;
  return null;
}
