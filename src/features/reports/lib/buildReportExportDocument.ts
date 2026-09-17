import type { ReportStats } from '../types/report.types';
import { formatCurrency, formatNumber } from '@shared/lib/format';
import { formatShortDate } from '@shared/lib/reportRange';

export interface ReportExportDocumentInput {
  stats: ReportStats;
  cafeName: string;
  rangeLabel: string;
  currency: string;
  logoDataUrl: string | null;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function statBox(label: string, value: string): string {
  return `
    <div style="flex:1;min-width:140px;border:1px solid #e5eaf0;border-radius:12px;padding:14px;background:#fff;">
      <div style="font-size:18px;font-weight:800;color:#2b2d42;margin-bottom:6px;">${escapeHtml(value)}</div>
      <div style="font-size:11px;font-weight:700;color:#5a6278;">${escapeHtml(label)}</div>
    </div>
  `;
}

function buildDailySalesRows(stats: ReportStats, currency: string): string {
  if (stats.daily_sales.length === 0) {
    return `<tr><td colspan="2" style="padding:12px;text-align:center;color:#5a6278;">لا توجد مبيعات</td></tr>`;
  }

  const max = Math.max(...stats.daily_sales.map((p) => Number(p.total)), 1);

  return stats.daily_sales
    .map((point) => {
      const total = Number(point.total);
      const width = Math.max(8, Math.round((total / max) * 100));
      return `
        <tr>
          <td style="padding:8px 10px;font-size:12px;color:#2b2d42;white-space:nowrap;">${escapeHtml(formatShortDate(point.day))}</td>
          <td style="padding:8px 10px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <div style="flex:1;height:8px;background:#f0f2f5;border-radius:999px;overflow:hidden;">
                <div style="width:${width}%;height:100%;background:#cfa34e;border-radius:999px;"></div>
              </div>
              <span style="font-size:12px;font-weight:700;color:#2b2d42;white-space:nowrap;">${escapeHtml(formatCurrency(total, currency))}</span>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');
}

function buildTopCustomersRows(stats: ReportStats, currency: string): string {
  if (stats.top_customers.length === 0) {
    return `<tr><td colspan="3" style="padding:12px;text-align:center;color:#5a6278;">لا يوجد عملاء</td></tr>`;
  }

  return stats.top_customers
    .map(
      (item) => `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #eef1f5;font-size:12px;font-weight:700;color:#2b2d42;">${escapeHtml(item.customer_name)}</td>
        <td style="padding:10px;border-bottom:1px solid #eef1f5;font-size:11px;color:#5a6278;">${escapeHtml(item.customer_phone)}</td>
        <td style="padding:10px;border-bottom:1px solid #eef1f5;font-size:12px;font-weight:800;color:#2b2d42;text-align:left;">${escapeHtml(formatCurrency(item.spent, currency))}</td>
      </tr>
    `
    )
    .join('');
}

export function buildReportExportHtml(input: ReportExportDocumentInput): string {
  const { stats, cafeName, rangeLabel, currency, logoDataUrl } = input;
  const generatedAt = new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date());

  const logoBlock = logoDataUrl
    ? `<img src="${logoDataUrl}" alt="" style="width:52px;height:52px;border-radius:12px;object-fit:cover;border:1px solid rgba(255,255,255,0.35);" />`
    : `<div style="width:52px;height:52px;border-radius:12px;background:rgba(255,255,255,0.15);"></div>`;

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px;
      font-family: "Cairo", "Segoe UI", Tahoma, Arial, sans-serif;
      background: #ffffff;
      color: #2b2d42;
      width: 760px;
    }
  </style>
</head>
<body>
  <div id="report-root" style="max-width:760px;margin:0 auto;">
    <div style="display:flex;align-items:center;gap:14px;padding:18px;border-radius:16px;background:#1a3b70;color:#fff;margin-bottom:18px;">
      ${logoBlock}
      <div>
        <div style="font-size:11px;opacity:0.85;">تقرير الأداء</div>
        <div style="font-size:20px;font-weight:800;">${escapeHtml(cafeName)}</div>
        <div style="font-size:11px;opacity:0.85;margin-top:4px;">${escapeHtml(rangeLabel)}</div>
      </div>
    </div>

    <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:18px;">
      ${statBox('مجموع المشتريات', formatCurrency(stats.total_sales, currency))}
      ${statBox('عدد المشتريات', formatNumber(stats.purchases_count))}
      ${statBox('عدد الهدايا', formatNumber(stats.gifts_count))}
      ${statBox('متوسط المشترى', formatCurrency(stats.average_purchase, currency))}
    </div>

    <div style="border:1px solid #e5eaf0;border-radius:14px;overflow:hidden;margin-bottom:18px;">
      <div style="padding:12px 14px;border-bottom:1px solid #e5eaf0;font-size:13px;font-weight:800;">اتجاه المبيعات</div>
      <table style="width:100%;border-collapse:collapse;">${buildDailySalesRows(stats, currency)}</table>
    </div>

    <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:18px;">
      ${statBox('هدايا معلّقة', formatNumber(stats.pending_gifts_count))}
      ${statBox('هدايا مُسلّمة', formatNumber(stats.delivered_gifts_count))}
      ${statBox('هدايا الزيارات', formatNumber(stats.visit_track_gifts_count))}
      ${statBox('هدايا النقاط', formatNumber(stats.points_track_gifts_count))}
    </div>

    <div style="border:1px solid #e5eaf0;border-radius:14px;overflow:hidden;margin-bottom:18px;">
      <div style="padding:12px 14px;border-bottom:1px solid #e5eaf0;font-size:13px;font-weight:800;">أفضل العملاء</div>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#f8f9fa;">
            <th style="padding:10px;text-align:right;font-size:11px;color:#5a6278;">العميل</th>
            <th style="padding:10px;text-align:right;font-size:11px;color:#5a6278;">الهاتف</th>
            <th style="padding:10px;text-align:left;font-size:11px;color:#5a6278;">الإنفاق</th>
          </tr>
        </thead>
        <tbody>${buildTopCustomersRows(stats, currency)}</tbody>
      </table>
    </div>

    <div style="text-align:center;font-size:10px;color:#5a6278;padding-top:8px;border-top:1px solid #e5eaf0;">
      تم إنشاء التقرير بواسطة نظام ولاء — ${escapeHtml(generatedAt)}
    </div>
  </div>
</body>
</html>`;
}
