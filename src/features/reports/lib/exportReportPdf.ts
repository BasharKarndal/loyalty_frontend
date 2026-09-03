import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { ReportStats } from '../types/report.types';
import { buildReportExportHtml } from './buildReportExportDocument';

const PDF_MARGIN_MM = 10;
const CAPTURE_SCALE = 1.5;
const RENDER_WIDTH_PX = 820;
const EXPORT_TIMEOUT_MS = 20_000;

async function loadImageAsDataUrl(src: string): Promise<string | null> {
  if (!src) return null;
  if (src.startsWith('data:')) return src;

  try {
    const response = await fetch(src);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), ms);
    promise
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timer);
        reject(error);
      });
  });
}

function addCanvasPagesToPdf(pdf: jsPDF, canvas: HTMLCanvasElement, marginMm: number): void {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - marginMm * 2;
  const contentHeight = pageHeight - marginMm * 2;

  const sliceHeightPx = Math.max(1, Math.floor((contentHeight * canvas.width) / contentWidth));
  let offsetY = 0;
  let page = 0;

  while (offsetY < canvas.height) {
    if (page > 0) pdf.addPage();

    const height = Math.min(sliceHeightPx, canvas.height - offsetY);
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = height;

    const ctx = pageCanvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    ctx.drawImage(canvas, 0, offsetY, canvas.width, height, 0, 0, canvas.width, height);

    const imgData = pageCanvas.toDataURL('image/jpeg', 0.92);
    const imgHeightMm = (height * contentWidth) / canvas.width;
    pdf.addImage(imgData, 'JPEG', marginMm, marginMm, contentWidth, imgHeightMm);

    offsetY += height;
    page += 1;
  }
}

async function mountExportHost(html: string): Promise<{ host: HTMLDivElement; root: HTMLElement }> {
  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText = [
    'position:fixed',
    'left:-10000px',
    'top:0',
    `width:${RENDER_WIDTH_PX}px`,
    'background:#ffffff',
    'z-index:-1',
    'pointer-events:none',
  ].join(';');

  // Extract body content from full HTML document for in-page rendering
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  host.innerHTML = `${styleMatch ? `<style>${styleMatch[1]}</style>` : ''}${bodyMatch?.[1] ?? html}`;
  document.body.appendChild(host);

  const root =
    (host.querySelector('#report-root') as HTMLElement | null) ??
    (host.querySelector('div') as HTMLElement | null) ??
    host;

  // Allow layout/paint without waiting on external fonts (that hung previously)
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

  return { host, root };
}

export interface ExportReportPdfInput {
  stats: ReportStats;
  cafeName: string;
  rangeLabel: string;
  currency: string;
  filename: string;
  fallbackLogo: string;
}

async function captureAndSavePdf(input: ExportReportPdfInput): Promise<void> {
  const logoDataUrl = (await loadImageAsDataUrl(input.fallbackLogo)) ?? null;

  const html = buildReportExportHtml({
    stats: input.stats,
    cafeName: input.cafeName,
    rangeLabel: input.rangeLabel,
    currency: input.currency,
    logoDataUrl,
  });

  const { host, root } = await mountExportHost(html);

  try {
    const canvas = await html2canvas(root, {
      scale: CAPTURE_SCALE,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: root.scrollWidth || RENDER_WIDTH_PX,
      height: root.scrollHeight,
      windowWidth: RENDER_WIDTH_PX,
      foreignObjectRendering: false,
      imageTimeout: 5_000,
    });

    if (!canvas.width || !canvas.height) {
      throw new Error('EMPTY_CAPTURE');
    }

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });
    addCanvasPagesToPdf(pdf, canvas, PDF_MARGIN_MM);
    pdf.save(input.filename);
  } finally {
    if (host.parentNode) {
      document.body.removeChild(host);
    }
  }
}

/** Downloads a PDF file directly (no print dialog). */
export async function exportReportToPdf(input: ExportReportPdfInput): Promise<void> {
  await withTimeout(captureAndSavePdf(input), EXPORT_TIMEOUT_MS, 'EXPORT_TIMEOUT');
}
