import { useCafeDirectory } from '../hooks/useCafeDirectory';

export function CafeOwnerLabel({ ownerId, className }: { ownerId?: string | null; className?: string }) {
  const { enabled, nameOf } = useCafeDirectory();
  if (!enabled) return null;
  const name = nameOf(ownerId);
  if (!name) return null;
  return <p className={className ?? 'truncate text-[11px] font-bold text-wheat'}>{name}</p>;
}
