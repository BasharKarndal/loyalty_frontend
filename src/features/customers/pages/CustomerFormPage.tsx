import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { EmptyState, Icon, RouteFallback } from '@shared/components';
import { APP_NAME } from '@/config/env';
import { useSettingsQuery } from '@/features/settings';
import { CustomerPermissions, usePermissions } from '@/features/auth/hooks/usePermissions';
import {
  useCreateCustomerMutation,
  useCustomerQuery,
  useUpdateCustomerMutation,
} from '../api/customers.queries';
import { CustomerForm } from '../components/CustomerForm';
import { composePhone } from '@shared/lib/phoneUtils';
import { CustomerWelcomeSheet } from '../components/CustomerWelcomeSheet';
import type { CustomerFormValues } from '../schemas/customer.schema';

interface WelcomeState {
  customerId: string;
  customerName: string;
  phone: string;
}

export function CustomerFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const { can } = usePermissions();
  const { data: settings } = useSettingsQuery();
  const [welcome, setWelcome] = useState<WelcomeState | null>(null);

  const canCreate = can(CustomerPermissions.CREATE);
  const canUpdate = can(CustomerPermissions.UPDATE);

  const { data: customer, isLoading, isError } = useCustomerQuery(isEditing ? id : undefined);
  const createMutation = useCreateCustomerMutation();
  const updateMutation = useUpdateCustomerMutation();

  const allowed = isEditing ? canUpdate : canCreate;
  const cafeName = settings?.cafe_name?.trim() || APP_NAME;

  if (!allowed) {
    return (
      <EmptyState
        message="ليس لديك صلاحية لهذا الإجراء"
        actionLabel="العودة للعملاء"
        onAction={() => navigate('/customers')}
      />
    );
  }

  if (isEditing && isLoading) return <RouteFallback compact />;

  if (isEditing && (isError || !customer)) {
    return (
      <EmptyState
        message="تعذر تحميل بيانات العميل"
        icon={AlertCircle}
        actionLabel="العودة للقائمة"
        onAction={() => navigate('/customers')}
      />
    );
  }

  const handleSubmit = (values: CustomerFormValues) => {
    const payload = {
      name: values.name.trim(),
      phone: composePhone(values.dialCode, values.localPhone),
      notes: values.notes?.trim() || null,
    };

    if (isEditing && id) {
      updateMutation.mutate(
        { id, payload },
        { onSuccess: () => navigate(`/customers/${id}`) }
      );
      return;
    }

    createMutation.mutate(payload, {
      onSuccess: (created) => {
        if (values.sendWhatsApp) {
          setWelcome({
            customerId: created.id,
            customerName: created.name,
            phone: payload.phone,
          });
          return;
        }
        navigate(`/customers/${created.id}`);
      },
    });
  };

  const loading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="page-shell mx-auto max-w-3xl space-y-5">
      <Link
        to={isEditing && id ? `/customers/${id}` : '/customers'}
        className="inline-flex items-center gap-1.5 text-sm font-bold text-wheat transition-colors hover:text-wheat-dark"
      >
        <Icon icon={ArrowRight} size="sm" />
        {isEditing ? 'العودة للتفاصيل' : 'العودة للعملاء'}
      </Link>

      <div>
        <h2 className="text-xl font-extrabold text-ink">
          {isEditing ? 'تعديل العميل' : 'إضافة عميل جديد'}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {isEditing ? 'عدّل بيانات العميل واحفظ التغييرات' : 'أدخل بيانات العميل الجديد'}
        </p>
      </div>

      <CustomerForm
        customer={customer}
        loading={loading}
        onSubmit={handleSubmit}
        onCancel={() =>
          navigate(isEditing && id ? `/customers/${id}` : '/customers')
        }
      />

      {welcome && (
        <CustomerWelcomeSheet
          open
          customerId={welcome.customerId}
          customerName={welcome.customerName}
          phone={welcome.phone}
          cafeName={cafeName}
          onComplete={() => navigate(`/customers/${welcome.customerId}`)}
        />
      )}
    </div>
  );
}
