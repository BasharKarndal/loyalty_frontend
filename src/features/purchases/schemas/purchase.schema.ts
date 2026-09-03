import { z } from 'zod';

export const purchaseFormSchema = z.object({
  customer_id: z.string().uuid('اختر عميلاً صالحاً'),
  amount: z.coerce
    .number({ message: 'المبلغ مطلوب' })
    .positive('المبلغ يجب أن يكون أكبر من صفر'),
  notes: z.string().max(500, 'الملاحظات طويلة جداً').optional().or(z.literal('')),
});

export const purchaseEditSchema = purchaseFormSchema.omit({ customer_id: true });

export type PurchaseFormValues = z.infer<typeof purchaseFormSchema>;
export type PurchaseEditValues = z.infer<typeof purchaseEditSchema>;
