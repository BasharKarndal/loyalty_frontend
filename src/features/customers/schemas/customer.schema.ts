import { z } from 'zod';
import { validateLocalPhone } from '@shared/lib/phoneUtils';

export const customerFormSchema = z.object({
  name: z.string().trim().min(1, 'الاسم مطلوب').max(255, 'الاسم طويل جداً'),
  dialCode: z.string().min(1, 'رمز الدولة مطلوب'),
  localPhone: z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      const error = validateLocalPhone(value);
      if (error) ctx.addIssue({ code: 'custom', message: error });
    }),
  notes: z.string().max(500, 'الملاحظات طويلة جداً').optional().or(z.literal('')),
  sendWhatsApp: z.boolean().optional(),
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;
