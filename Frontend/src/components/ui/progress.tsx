'use client'

import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'

import { cn } from '@/lib/utils'

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  const normalizedValue = Math.max(0, Math.min(100, value ?? 0))

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        'relative h-3 w-full overflow-hidden rounded-full bg-gradient-to-r from-muted/90 via-muted to-muted/90 ring-1 ring-inset ring-border/70 shadow-inner',
        className,
      )}
      {...props}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, transparent 0 18px, hsl(var(--border) / 0.35) 18px 19px)',
        }}
      />
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="relative h-full w-full flex-1 overflow-hidden rounded-full bg-gradient-to-r from-sky-500 via-emerald-500 via-amber-400 to-rose-500 transition-all duration-700 ease-out shadow-[0_0_14px_hsl(var(--primary)/0.28)]"
        style={{ transform: `translateX(-${100 - normalizedValue}%)` }}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(180deg, hsl(var(--background) / 0.35) 0%, transparent 55%, hsl(var(--foreground) / 0.14) 100%)',
          }}
        />
        <div
          aria-hidden="true"
          className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border border-background/70 bg-background/80 shadow-sm"
        />
      </ProgressPrimitive.Indicator>
    </ProgressPrimitive.Root>
  )
}

export { Progress }
