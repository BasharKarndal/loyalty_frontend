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
