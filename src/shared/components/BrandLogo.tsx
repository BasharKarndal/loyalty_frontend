import { cn } from '@shared/lib/cn';
import { APP_NAME } from '@/config/env';
import brandLogo from '@/assets/app-icon.png';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  subtitle?: string;
  title?: string;
  logoSrc?: string | null;
  className?: string;
  /** On dark backgrounds (sidebar / login) use light text */
  inverted?: boolean;
}

const sizeMap = {
  sm: { img: 'h-10 w-10', title: 'text-sm', sub: 'text-[10px]' },
  md: { img: 'h-12 w-12', title: 'text-sm', sub: 'text-[11px]' },
  lg: { img: 'h-28 w-28', title: 'text-xl', sub: 'text-sm' },
};

export const BrandLogo = ({
  size = 'md',
  showText = true,
  subtitle,
  title,
  logoSrc,
  className,
  inverted = false,
}: BrandLogoProps) => {
  const s = sizeMap[size];
  const displayTitle = title?.trim() || APP_NAME;

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <img
        src={logoSrc ?? brandLogo}
        alt={displayTitle}
        className={cn(
          s.img,
          'shrink-0 rounded-2xl object-cover',
          size === 'lg' && 'drop-shadow-md'
        )}
      />
      {showText && (
        <div className="min-w-0 text-right">
          <div
            className={cn(
              'font-bold leading-snug',
              s.title,
              inverted ? 'text-white' : 'text-wheat'
            )}
          >
            {displayTitle}
          </div>
          {subtitle ? (
            <div
              className={cn(
                'mt-0.5 leading-snug',
                s.sub,
                inverted ? 'text-white/70' : 'text-muted'
              )}
            >
              {subtitle}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
