interface RouteFallbackProps {
  compact?: boolean;
}

export const RouteFallback = ({ compact = false }: RouteFallbackProps) => (
  <div className={compact ? 'flex py-12 items-center justify-center' : 'flex min-h-[40vh] items-center justify-center'}>
    <div className="text-center">
      <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-wheat/30 border-t-wheat" />
      <p className="text-sm text-muted">جاري التحميل...</p>
    </div>
  </div>
);
