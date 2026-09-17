export function buildWhatsAppWelcomeMessage(
  customerName: string,
  cafeName: string,
  points = 0
): string {
  return (
    `مرحباً ${customerName}، أهلاً بك في برنامج ولاء ${cafeName}.\n` +
    `رصيد نقاطك الحالي: ${points} نقطة.\n` +
    'يسعدنا انضمامك، وسنرسل لك رمز العضوية QR في الرسالة التالية.'
  );
}

export function buildQrFollowUpMessage(customerName: string): string {
  return (
    `مرحباً ${customerName}، هذا رمز QR الخاص بعضويتك في برنامج الولاء. ` +
    'قدّمه عند الزيارة لتسجيل مشترياتك بسهولة.'
  );
}

export function buildLoyaltyCardTextMessage(input: {
  customerName: string;
  phone?: string | null;
  cafeName: string;
  visits: string;
  points: string;
  spent: string;
}): string {
  const lines = [
    `بطاقة ولاء — ${input.cafeName}`,
    `الاسم: ${input.customerName}`,
  ];
  if (input.phone) lines.push(`الهاتف: ${input.phone}`);
  lines.push(
    `الزيارات: ${input.visits}`,
    `النقاط: ${input.points}`,
    `إجمالي المدفوع: ${input.spent}`,
    '',
    'قدّم بطاقة الولاء أو رمز QR عند الزيارة لتسجيل مشترياتك ونقاطك.'
  );
  return lines.join('\n');
}
