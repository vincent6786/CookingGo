"use client";

export function PageHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-4 flex items-end justify-between gap-3">
      <div>
        <p className="eyebrow mb-1">{eyebrow}</p>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
          {title}
        </h1>
      </div>
      {action}
    </header>
  );
}

export function Stepper({
  value,
  onChange,
  min = 1,
  max = 99,
  label,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  label?: string;
}) {
  return (
    <div className="inline-flex items-center gap-2">
      {label && <span className="text-sm text-ink-faint">{label}</span>}
      <div className="inline-flex items-center overflow-hidden rounded-xl border border-line bg-surface-raised">
        <button
          type="button"
          aria-label="decrease"
          className="flex h-10 w-10 items-center justify-center text-lg text-ink hover:bg-surface-sunk disabled:opacity-40"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
        >
          −
        </button>
        <span className="readout w-10 text-center text-base font-semibold">{value}</span>
        <button
          type="button"
          aria-label="increase"
          className="flex h-10 w-10 items-center justify-center text-lg text-ink hover:bg-surface-sunk disabled:opacity-40"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
        >
          +
        </button>
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-sunk text-ink-faint">
        {icon}
      </div>
      <div>
        <p className="font-display text-lg font-semibold text-ink">{title}</p>
        <p className="mt-1 text-sm text-ink-faint">{hint}</p>
      </div>
      {action}
    </div>
  );
}
