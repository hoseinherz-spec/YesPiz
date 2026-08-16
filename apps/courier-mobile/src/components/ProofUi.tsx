'use client';

import { cn } from '@/lib/cn';
import { hx } from '@/lib/heroui-classes';

type ErrorBannerProps = {
  message: string;
  className?: string;
};

export function ErrorBanner({ message, className }: ErrorBannerProps) {
  return (
    <p
      role="alert"
      className={cn(
        'rounded-[18px] border border-border bg-card px-4 py-3 text-sm text-danger',
        className,
      )}
    >
      {message}
    </p>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  hint?: string;
};

export function ProofField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  inputMode,
  hint,
}: FieldProps) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-muted">
      {label}
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(hx.field, 'h-14 bg-field-background')}
      />
      {hint ? <span className={hx.caption}>{hint}</span> : null}
    </label>
  );
}
