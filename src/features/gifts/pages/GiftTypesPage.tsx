import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Gift, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  Button,
  EmptyState,
  Icon,
  Input,
  Modal,
  RouteFallback,
} from '@shared/components';
import {
  GiftTypePermissions,
  usePermissions,
} from '@/features/auth';
import {
  DEFAULT_GIFT_ICON_KEY,
  GIFT_ICON_OPTIONS,
} from '@shared/lib/giftIcons';
import {
  useCreateGiftTypeMutation,
  useDeleteGiftTypeMutation,
  useGiftTypesQuery,
  useUpdateGiftTypeMutation,
} from '../api/gifts.queries';
import { GiftTypeVisual } from '../components/GiftTypeVisual';
import type { GiftType } from '../types/gift.types';
import { CafeOwnerLabel } from '@/features/admin/components/CafeOwnerLabel';

export function GiftTypesPage() {
  const { can } = usePermissions();
  const canCreate = can(GiftTypePermissions.CREATE);
  const canUpdate = can(GiftTypePermissions.UPDATE);
  const canDelete = can(GiftTypePermissions.DELETE);

  const { data: giftTypes = [], isLoading, isError, refetch } = useGiftTypesQuery(true);
  const createMutation = useCreateGiftTypeMutation();
  const updateMutation = useUpdateGiftTypeMutation();
  const deleteMutation = useDeleteGiftTypeMutation();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<GiftType | null>(null);
  const [name, setName] = useState('');
  const [iconKey, setIconKey] = useState(DEFAULT_GIFT_ICON_KEY);
  const [sortOrder, setSortOrder] = useState(0);

  const active = giftTypes.filter((t) => t.is_active);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setIconKey(DEFAULT_GIFT_ICON_KEY);
    setSortOrder(active.length);
    setEditorOpen(true);
  };

  const openEdit = (type: GiftType) => {
    setEditing(type);
    setName(type.name);
    setIconKey(type.icon_key);
    setSortOrder(type.sort_order);
    setEditorOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const payload = { name: name.trim(), icon_key: iconKey, sort_order: sortOrder };
    if (editing) {
      updateMutation.mutate(
        { id: editing.id, payload },
        { onSuccess: () => setEditorOpen(false) }
      );
    } else {
      createMutation.mutate(payload, { onSuccess: () => setEditorOpen(false) });
    }
  };

  const loading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="page-shell mx-auto max-w-3xl space-y-5">
      <Link
        to="/gifts"
        className="inline-flex items-center gap-1.5 text-sm font-bold text-wheat hover:text-wheat-dark"
      >
        <Icon icon={ArrowRight} size="sm" />
        العودة للهدايا
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-ink">أنواع الهدايا</h2>
          <p className="mt-1 text-sm text-muted">
            أنت تتحكم بالكامل — أضف، عدّل، أو احذف أنواع الهدايا. لا توجد أنواع افتراضية في
            النظام.
          </p>
        </div>
        {canCreate && (
          <Button type="button" onClick={openCreate}>
            <Icon icon={Plus} size="sm" />
            إضافة نوع
          </Button>
        )}
      </div>

      {isLoading && <RouteFallback compact />}
      {isError && (
        <EmptyState message="تعذر تحميل أنواع الهدايا" actionLabel="إعادة المحاولة" onAction={() => refetch()} />
      )}

      {!isLoading && !isError && active.length === 0 && (
        <EmptyState
          message="لا توجد أنواع هدايا"
          description="ابدأ بإضافة أنواع الهدايا التي تريد تقديمها لعملائك — مثل: مشروب مجاني، حلى، أو أي مكافأة تناسبك."
          icon={Gift}
          actionLabel={canCreate ? 'إضافة نوع هدية' : undefined}
          onAction={canCreate ? openCreate : undefined}
        />
      )}

      {active.length > 0 && (
        <section className="space-y-3">
          {active.map((type) => (
            <GiftTypeRow
              key={type.id}
              type={type}
              canUpdate={canUpdate}
              canDelete={canDelete}
              onEdit={() => openEdit(type)}
              onDelete={() => deleteMutation.mutate(type.id)}
            />
          ))}
        </section>
      )}

      <Modal
        open={editorOpen}
        title={editing ? 'تعديل نوع الهدية' : 'إضافة نوع هدية'}
        confirmLabel={editing ? 'حفظ' : 'إضافة'}
        loading={loading}
        onConfirm={handleSave}
        onClose={() => setEditorOpen(false)}
      >
        <div className="space-y-4">
          <Input label="اسم الهدية" value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            label="ترتيب العرض"
            type="number"
            min={0}
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
          />
          <div>
            <p className="mb-2 text-sm font-bold text-ink">الأيقونة</p>
            <div className="grid grid-cols-4 gap-2">
              {GIFT_ICON_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setIconKey(option.key)}
                  className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-xs ${
                    iconKey === option.key ? 'border-wheat bg-wheat/10' : 'border-line'
                  }`}
                >
                  <Icon icon={option.icon} size="sm" />
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function GiftTypeRow({
  type,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
}: {
  type: GiftType;
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-panel p-4">
      <GiftTypeVisual iconKey={type.icon_key} name={type.name} />
      <div className="min-w-0 flex-1">
        <p className="font-extrabold text-ink">{type.name}</p>
        <CafeOwnerLabel ownerId={type.owner_id} />
        <p className="text-xs text-muted">ترتيب: {type.sort_order}</p>
      </div>
      <div className="flex gap-2">
        {canUpdate && (
          <button type="button" onClick={onEdit} className="rounded-lg p-2 text-muted hover:text-wheat">
            <Icon icon={Pencil} size="sm" />
          </button>
        )}
        {canDelete && (
          <button type="button" onClick={onDelete} className="rounded-lg p-2 text-muted hover:text-danger">
            <Icon icon={Trash2} size="sm" />
          </button>
        )}
      </div>
    </div>
  );
}
