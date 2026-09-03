import { TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '@shared/lib/cn';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, label, className = '', id, ...props }, ref) => {
    const textareaId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="mb-1.5 block text-sm font-medium text-ink">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'min-h-[96px] w-full rounded-lg border bg-panel px-3 py-2.5 text-sm text-ink shadow-sm transition-colors',
            'placeholder:text-muted/70',
            'focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/25',
            error ? 'border-danger' : 'border-line',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
