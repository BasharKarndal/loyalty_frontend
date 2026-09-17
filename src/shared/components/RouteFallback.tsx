interface RouteFallbackProps {
  compact?: boolean;
  message?: string;
}

export const RouteFallback = ({
  compact = false,
  message = 'جاري التحميل...',
}: RouteFallbackProps) => (
  <div
    className={
      compact
        ? 'flex items-center justify-center py-12'
        : 'flex min-h-[40vh] items-center justify-center'
    }
  >
    <div className="text-center px-6">
      <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-wheat/30 border-t-wheat" />
      <p className="text-sm text-muted">{message}</p>
    </div>
  </div>
);
