/**
 * Opens the browser print dialog scoped to the report element.
 * User can choose "Save as PDF" as a fallback when canvas export fails.
 */
export function printReportElement(element: HTMLElement): void {
  const previousTitle = document.title;
  document.title = 'تقرير ولاء';

  const cleanup = () => {
    document.title = previousTitle;
    element.classList.remove('report-print-active');
    window.removeEventListener('afterprint', cleanup);
  };

  element.classList.add('report-print-active');
  window.addEventListener('afterprint', cleanup);
  window.print();
}
