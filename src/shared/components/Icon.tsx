import type { LucideIcon, LucideProps } from 'lucide-react';
import { cn } from '../lib/cn';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const sizeMap: Record<IconSize, number> = {
  xs: 14,
  sm: 16,
  md: 18,
  lg: 22,
  xl: 28,
};

export interface IconProps extends Omit<LucideProps, 'size'> {
  icon: LucideIcon;
  size?: IconSize;
}

export const Icon = ({
  icon: LucideComponent,
  size = 'md',
  className,
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <LucideComponent
    size={sizeMap[size]}
    strokeWidth={strokeWidth}
    className={cn('shrink-0', className)}
    aria-hidden
    {...props}
  />
);
