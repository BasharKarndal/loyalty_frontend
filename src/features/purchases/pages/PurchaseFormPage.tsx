import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { EmptyState, Icon, RouteFallback } from '@shared/components';
import { PurchasePermissions, usePermissions } from '@/features/auth';
import {
  useCreatePurchaseMutation,
  usePurchaseQuery,
  useUpdatePurchaseMutation,
} from '../api/purchases.queries';
import { PurchaseForm } from '../components/PurchaseForm';
import type { PurchaseEditValues, PurchaseFormValues } from '../schemas/purchase.schema';

export function PurchaseFormPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const preselectedCustomerId = searchParams.get('customerId') ?? undefined;

  const { can } = usePermissions();
  const canCreate = can(PurchasePermissions.CREATE);
  const canUpdate = can(PurchasePermissions.UPDATE);
  const allowed = isEditing ? canUpdate : canCreate;

  const { data: purchase, isLoading, isError } = usePurchaseQuery(isEditing ? id : undefined);
  const createMutation = useCreatePurchaseMutation();
  const updateMutation = useUpdatePurchaseMutation();

  if (!allowed) {
    return (
      <EmptyState
        message="ليس لديك صلاحية لهذا الإجراء"
        actionLabel="العودة للمشتريات"
        onAction={() => navigate('/purchases')}
      />
    );
  }

  if (isEditing && isLoading) return <RouteFallback compact />;

  if (isEditing && (isError || !purchase)) {
    return (
      <EmptyState
        message="تعذر تحميل بيانات المشترى"
        icon={AlertCircle}
        actionLabel="العودة للقائمة"
        onAction={() => navigate('/purchases')}
      />
    );
  }

  const handleSubmit = (values: PurchaseFormValues | PurchaseEditValues) => {
    const payload = {
      amount: values.amount,
      notes: values.notes?.trim() || null,
    };

    if (isEditing && id) {
      updateMutation.mutate(
        { id, payload },
        { onSuccess: () => navigate('/purchases') }
      );
      return;
    }

    const formValues = values as PurchaseFormValues;
    createMutation.mutate(
      {
        customer_id: formValues.customer_id,
        ...payload,
      },
      {
        onSuccess: (created) => navigate(`/customers/${created.customer_id}`),
      }
    );
  };

  const loading = createMutation.isPending || updateMutation.isPending;
  const backHref = isEditing
    ? '/purchases'
    : preselectedCustomerId
      ? `/customers/${preselectedCustomerId}`
      : '/purchases';

  return (
    <div className="page-shell mx-auto max-w-3xl space-y-5">
      <Link
        to={backHref}
        className="inline-flex items-center gap-1.5 text-sm font-bold text-wheat transition-colors hover:text-wheat-dark"
      >
        <Icon icon={ArrowRight} size="sm" />
        {isEditing ? 'العودة للمشتريات' : 'رجوع'}
      </Link>

      <div>
        <h2 className="text-xl font-extrabold text-ink">
          {isEditing ? 'تعديل المشترى' : 'إضافة مشترى جديد'}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {isEditing
            ? 'عدّل المبلغ أو الملاحظة — سيتم تحديث نقاط العميل تلقائياً'
            : 'اختر العميل وأدخل المبلغ لتسجيل المشترى'}
        </p>
      </div>

      <PurchaseForm
        purchase={purchase}
        defaultCustomerId={preselectedCustomerId}
        loading={loading}
        onSubmit={handleSubmit}
        onCancel={() => navigate(backHref)}
      />
    </div>
  );
}
