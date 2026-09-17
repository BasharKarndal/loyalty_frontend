import { generateQrDataUrl } from '@shared/lib/whatsapp';

export interface LoyaltyCardRenderInput {
  cafeName: string;
  appName: string;
  customerName: string;
  phone?: string | null;
  visitsLabel: string;
  pointsLabel: string;
  spentLabel: string;
  visitsValue: string;
  pointsValue: string;
  spentValue: string;
  qrPayload: string;
  logoSrc: string;
}

const W = 720;
const H = 1080;
const PAD = 48;
const GOLD = '#e8c87a';
const WHITE = '#ffffff';

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('IMAGE_LOAD_FAILED'));
    img.src = src;
  });
}

function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  baseSize: number,
  minSize = 22
): number {
  let size = baseSize;
  ctx.font = `800 ${size}px Cairo, Tahoma, sans-serif`;
  while (size > minSize && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `800 ${size}px Cairo, Tahoma, sans-serif`;
  }
  return size;
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  size: number,
  radius: number
) {
  ctx.save();
  roundRect(ctx, x, y, size, size, radius);
  ctx.clip();
  const scale = Math.max(size / img.width, size / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, x + (size - dw) / 2, y + (size - dh) / 2, dw, dh);
  ctx.restore();

  ctx.save();
  roundRect(ctx, x, y, size, size, radius);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

/**
 * Renders a loyalty card PNG with Canvas2D — reliable on mobile (no html2canvas).
 */
export async function renderLoyaltyCardPng(input: LoyaltyCardRenderInput): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('CANVAS_UNSUPPORTED');

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#0f1f3d');
  bg.addColorStop(0.42, '#1a3b70');
  bg.addColorStop(0.78, '#1e7585');
  bg.addColorStop(1, '#0f1f3d');
  ctx.fillStyle = bg;
  roundRect(ctx, 0, 0, W, H, 48);
  ctx.fill();

  // Soft gold glows
  const glow1 = ctx.createRadialGradient(80, 60, 10, 80, 60, 220);
  glow1.addColorStop(0, 'rgba(207,163,78,0.35)');
  glow1.addColorStop(1, 'rgba(207,163,78,0)');
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, W, H);

  const glow2 = ctx.createRadialGradient(W - 40, H - 40, 10, W - 40, H - 40, 260);
  glow2.addColorStop(0, 'rgba(232,200,122,0.22)');
  glow2.addColorStop(1, 'rgba(232,200,122,0)');
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, W, H);

  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';

  // Load assets in parallel
  const [logoImg, qrDataUrl] = await Promise.all([
    loadImage(input.logoSrc).catch(() => null),
    generateQrDataUrl(input.qrPayload, 360),
  ]);
  const qrImg = await loadImage(qrDataUrl);

  // Header: logo + cafe
  const logoSize = 88;
  if (logoImg) {
    drawCoverImage(ctx, logoImg, W - PAD - logoSize, PAD, logoSize, 22);
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    roundRect(ctx, W - PAD - logoSize, PAD, logoSize, logoSize, 22);
    ctx.fill();
  }

  ctx.fillStyle = GOLD;
  ctx.font = '700 18px Cairo, Tahoma, sans-serif';
  ctx.fillText('LOYALTY', W - PAD - logoSize - 20, PAD + 32);

  ctx.fillStyle = WHITE;
  const cafeSize = fitText(ctx, input.cafeName, W - PAD * 2 - logoSize - 40, 34, 22);
  ctx.font = `800 ${cafeSize}px Cairo, Tahoma, sans-serif`;
  ctx.fillText(input.cafeName, W - PAD - logoSize - 20, PAD + 72);

  // Member badge
  ctx.fillStyle = 'rgba(232,200,122,0.15)';
  roundRect(ctx, PAD, PAD + 12, 110, 40, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(232,200,122,0.4)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, PAD, PAD + 12, 110, 40, 20);
  ctx.stroke();
  ctx.fillStyle = GOLD;
  ctx.font = '700 20px Cairo, Tahoma, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('عضو', PAD + 55, PAD + 39);
  ctx.textAlign = 'right';

  // Card holder
  let y = PAD + logoSize + 56;
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '600 22px Cairo, Tahoma, sans-serif';
  ctx.fillText('حامل البطاقة', W - PAD, y);

  y += 48;
  ctx.fillStyle = WHITE;
  const nameSize = fitText(ctx, input.customerName, W - PAD * 2, 52, 28);
  ctx.font = `800 ${nameSize}px Cairo, Tahoma, sans-serif`;
  ctx.fillText(input.customerName, W - PAD, y);

  if (input.phone) {
    y += 42;
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '600 28px ui-monospace, Menlo, monospace';
    ctx.direction = 'ltr';
    ctx.textAlign = 'left';
    ctx.fillText(input.phone, PAD, y);
    ctx.direction = 'rtl';
    ctx.textAlign = 'right';
  }

  // Stats row
  y += 56;
  const gap = 16;
  const boxW = (W - PAD * 2 - gap * 2) / 3;
  const boxH = 130;
  const stats = [
    { label: input.visitsLabel, value: input.visitsValue },
    { label: input.pointsLabel, value: input.pointsValue },
    { label: input.spentLabel, value: input.spentValue },
  ];

  stats.forEach((stat, i) => {
    const x = PAD + i * (boxW + gap);
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, x, y, boxW, boxH, 24);
    ctx.fill();
    roundRect(ctx, x, y, boxW, boxH, 24);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '700 20px Cairo, Tahoma, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(stat.label, x + boxW / 2, y + 40);

    ctx.fillStyle = GOLD;
    const valueSize = fitText(ctx, stat.value, boxW - 20, 34, 18);
    ctx.font = `800 ${valueSize}px Cairo, Tahoma, sans-serif`;
    ctx.direction = 'ltr';
    ctx.fillText(stat.value, x + boxW / 2, y + 88);
    ctx.direction = 'rtl';
  });

  ctx.textAlign = 'right';

  // QR + caption
  const qrSize = 220;
  const qrX = PAD;
  const qrY = H - PAD - qrSize - 8;
  ctx.fillStyle = WHITE;
  roundRect(ctx, qrX - 14, qrY - 14, qrSize + 28, qrSize + 28, 28);
  ctx.fill();
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  const textMax = W - PAD * 2 - qrSize - 40;
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '600 22px Cairo, Tahoma, sans-serif';
  const tip = 'امسح رمز QR عند الزيارة لتسجيل المشتريات ونقاط الولاء فوراً.';
  wrapText(ctx, tip, W - PAD, qrY + 24, textMax, 32);

  ctx.fillStyle = 'rgba(232,200,122,0.85)';
  ctx.font = '700 20px Cairo, Tahoma, sans-serif';
  ctx.fillText(input.appName, W - PAD, qrY + qrSize - 8);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result || result.size === 0) reject(new Error('CARD_BLOB_EMPTY'));
        else resolve(result);
      },
      'image/png',
      1
    );
  });

  return blob;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(' ');
  let line = '';
  let cursorY = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      line = word;
      cursorY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cursorY);
}
