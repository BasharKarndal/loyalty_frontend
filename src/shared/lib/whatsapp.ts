import QRCode from 'qrcode';
import { toDigits } from './phoneUtils';

export function isMobileDevice(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * Opens WhatsApp in a new tab/window so the SPA (and QR sheet) stays mounted.
 * Never uses location.assign — that unloads the page on mobile and breaks QR display.
 */
export function openWhatsApp(phone: string, message: string): boolean {
  const digits = toDigits(phone);
  if (!digits) return false;

  const url = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;

  try {
    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    if (opened) return true;
  } catch {
    // fall through to anchor click
  }

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  return true;
}

/** Generates a PNG blob via DataURL (qrcode package has no toBlob). */
export async function generateQrPngBlob(payload: string, size = 720): Promise<Blob> {
  const dataUrl = await QRCode.toDataURL(payload, {
    width: size,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: { dark: '#000000', light: '#ffffff' },
  });

  const response = await fetch(dataUrl);
  const blob = await response.blob();
  if (!blob.size) {
    throw new Error('QR_BLOB_EMPTY');
  }
  return blob;
}

export async function generateQrDataUrl(payload: string, size = 240): Promise<string> {
  return QRCode.toDataURL(payload, {
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
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export type ShareQrResult = 'shared' | 'clipboard' | 'downloaded';

/**
 * Shares QR image via native share sheet, clipboard, or download fallback.
 * Note: wa.me links cannot attach images — only Web Share API or clipboard work.
 */
export async function shareQrImage(blob: Blob, message: string): Promise<ShareQrResult> {
  const file = new File([blob], 'customer-qr.png', { type: 'image/png' });

  if (typeof navigator.share === 'function') {
    const attempts: ShareData[] = [
      { files: [file], text: message, title: 'رمز عضوية ولاء' },
      { files: [file], title: 'رمز عضوية ولاء' },
      { files: [file] },
    ];

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

    // Text-only share as last Web Share attempt (some mobile browsers reject files)
    try {
      await navigator.share({ text: message, title: 'رمز عضوية ولاء' });
      downloadBlob(blob, 'customer-qr.png');
      return 'downloaded';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error;
      }
    }
  }

  if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined' && !isMobileDevice()) {
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
