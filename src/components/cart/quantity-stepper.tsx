'use client';

import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * A quantity control.
 *
 * A real `<input type="number">` rather than two buttons around a span, so it
 * can be typed into and is announced correctly. The buttons are conveniences
 * on top, and are disabled at the bounds instead of silently doing nothing -
 * a button that looks pressable and is not is the same lie as a dead CTA.
 */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  label = 'Quantity',
  className,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  label?: string;
  className?: string;
}) {
  const clamp = (next: number) => Math.min(Math.max(next, min), max);

  return (
    <div className={cn('inline-flex items-center rounded-md border border-ink-200', className)}>
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= min}
        aria-label="Decrease quantity"
        className="inline-flex h-10 w-10 items-center justify-center rounded-l-md text-ink-600 transition-colors hover:bg-paper-200 disabled:cursor-not-allowed disabled:text-ink-200 disabled:hover:bg-transparent"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>

      <input
        type="number"
        inputMode="numeric"
        aria-label={label}
        value={value}
        min={min}
        max={max}
        onChange={(event) => {
          const next = Number(event.target.value);
          // An empty field parses to 0; treat that as "still typing" and leave
          // the value alone rather than snapping to the minimum mid-edit.
          if (event.target.value === '') return;
          if (Number.isFinite(next)) onChange(clamp(Math.trunc(next)));
        }}
        // Hides the native spinners, which are tiny and duplicate the buttons.
        className="h-10 w-12 border-x border-ink-200 bg-transparent text-center font-data text-sm text-ink-900 [appearance:textfield] focus:outline-none focus-visible:bg-paper-200 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />

      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= max}
        aria-label="Increase quantity"
        className="inline-flex h-10 w-10 items-center justify-center rounded-r-md text-ink-600 transition-colors hover:bg-paper-200 disabled:cursor-not-allowed disabled:text-ink-200 disabled:hover:bg-transparent"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
