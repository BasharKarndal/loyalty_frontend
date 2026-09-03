import QRCode from 'qrcode';
import { toDigits } from './phoneUtils';

export function openWhatsApp(phone: string, message: string): boolean {
  const digits = toDigits(phone);
  if (!digits) return false;

  const url = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}

/** Generates a PNG blob directly — more reliable than SVG→canvas conversion. */
export async function generateQrPngBlob(payload: string, size = 720): Promise<Blob> {
  return QRCode.toBlob(payload, {
    type: 'png',
    width: size,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: { dark: '#000000', light: '#ffffff' },
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export type ShareQrResult = 'shared' | 'clipboard' | 'downloaded';

/**
 * Shares QR image via native share sheet, clipboard, or download fallback.
 * Note: wa.me links cannot attach images — only Web Share API or clipboard work.
 */
export async function shareQrImage(blob: Blob, message: string): Promise<ShareQrResult> {
  const file = new File([blob], 'customer-qr.png', { type: 'image/png' });

  if (typeof navigator.share === 'function') {
    const attempts: ShareData[] = [{ files: [file], text: message }, { files: [file] }];

    for (const data of attempts) {
      try {
        const canTry = typeof navigator.canShare !== 'function' || navigator.canShare(data);
        if (!canTry) continue;
        await navigator.share(data);
        return 'shared';
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw error;
        }
      }
    }
  }

  if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      return 'clipboard';
    } catch {
      // fall through to download
    }
  }

  downloadBlob(blob, 'customer-qr.png');
  return 'downloaded';
}

export function isMobileDevice(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}
