import { resolveGiftIcon } from '@shared/lib/giftIcons';
import { cn } from '@shared/lib/cn';
import { Icon } from '@shared/components';

interface GiftTypeVisualProps {
  iconKey: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-9 w-9',
  md: 'h-11 w-11',
  lg: 'h-14 w-14',
};

export function GiftTypeVisual({ iconKey, name, size = 'md', className }: GiftTypeVisualProps) {
  const LucideIcon = resolveGiftIcon(iconKey);
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-xl bg-wheat/15 text-wheat',
        sizeClasses[size],
        className
      )}
      title={name}
    >
      <Icon icon={LucideIcon} size={size === 'lg' ? 'lg' : 'sm'} />
    </div>
  );
}
