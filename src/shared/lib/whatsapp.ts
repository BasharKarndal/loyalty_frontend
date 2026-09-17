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

  if (isMobileDevice()) {
    // Popup may be blocked — show an in-page preview the user can long-press to save.
    const overlay = document.createElement('div');
    overlay.setAttribute(
      'style',
      'position:fixed;inset:0;z-index:99999;background:rgba(15,23,42,0.92);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;gap:12px;'
    );

    const img = document.createElement('img');
    img.src = url;
    img.alt = filename;
    img.setAttribute(
      'style',
      'max-width:100%;max-height:70vh;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,0.35);background:#fff;'
    );

    const hint = document.createElement('p');
    hint.textContent = 'اضغط مطولاً على الصورة ثم اختر حفظ الصورة';
    hint.setAttribute(
      'style',
      'color:#fff;font-family:Cairo,Tahoma,sans-serif;font-size:14px;font-weight:700;text-align:center;margin:0;'
    );

    const close = document.createElement('button');
    close.type = 'button';
    close.textContent = 'إغلاق';
    close.setAttribute(
      'style',
      'margin-top:4px;border:0;border-radius:12px;background:#cfa34e;color:#fff;font-family:Cairo,Tahoma,sans-serif;font-weight:800;padding:10px 22px;cursor:pointer;'
    );

    const cleanup = () => {
      overlay.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    };
    close.onclick = cleanup;
    overlay.onclick = (event) => {
      if (event.target === overlay) cleanup();
    };

    overlay.appendChild(img);
    overlay.appendChild(hint);
    overlay.appendChild(close);
    document.body.appendChild(overlay);
    return;
  }

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/** Prefer native share sheet on mobile (works for save/share); falls back to download/open. */
export async function saveOrShareImageBlob(
  blob: Blob,
  filename: string,
  title = 'بطاقة ولاء'
): Promise<'shared' | 'downloaded'> {
  const file = new File([blob], filename, { type: blob.type || 'image/png' });

  if (isMobileDevice() && typeof navigator.share === 'function') {
    try {
      const data: ShareData = { files: [file], title };
      if (typeof navigator.canShare !== 'function' || navigator.canShare(data)) {
        await navigator.share(data);
        return 'shared';
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
    }

    try {
      await navigator.share({ files: [file] });
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
    }
  }

  downloadBlob(blob, filename);
  return 'downloaded';
}

export function openSms(phone: string, message: string): boolean {
  const digits = toDigits(phone);
  if (!digits) return false;
  // iOS wants &body=, Android wants ?body=
  const joiner = /iPhone|iPad|iPod/i.test(navigator.userAgent) ? '&' : '?';
  const url = `sms:${digits}${joiner}body=${encodeURIComponent(message)}`;
  try {
    window.location.href = url;
    return true;
  } catch {
    return false;
  }
}

export type ShareQrResult = 'shared' | 'clipboard' | 'downloaded';

/**
 * Shares an image via native share sheet, clipboard, or download fallback.
 */
export async function shareImageBlob(
  blob: Blob,
  options: {
    filename?: string;
    title?: string;
    message?: string;
  } = {}
): Promise<ShareQrResult> {
  const filename = options.filename ?? 'loyalty-card.png';
  const title = options.title ?? 'بطاقة ولاء';
  const message = options.message ?? '';
  const file = new File([blob], filename, { type: blob.type || 'image/png' });

  if (typeof navigator.share === 'function') {
    const attempts: ShareData[] = [
      { files: [file], text: message, title },
      { files: [file], title },
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

    try {
      await navigator.share({ text: message || title, title });
      downloadBlob(blob, filename);
      return 'downloaded';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error;
      }
    }
  }

  if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined' && !isMobileDevice()) {
    try {
      await navigator.clipboard.write([new ClipboardItem({ [blob.type || 'image/png']: blob })]);
      return 'clipboard';
    } catch {
      // fall through to download
    }
  }

  downloadBlob(blob, filename);
  return 'downloaded';
}

/**
 * Shares QR image via native share sheet, clipboard, or download fallback.
 * Note: wa.me links cannot attach images — only Web Share API or clipboard work.
 */
export async function shareQrImage(blob: Blob, message: string): Promise<ShareQrResult> {
  return shareImageBlob(blob, {
    filename: 'customer-qr.png',
    title: 'رمز عضوية ولاء',
    message,
  });
}
