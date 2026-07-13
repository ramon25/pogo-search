import type { ReactNode } from 'react'

interface SectionProps {
  title: string
  subtitle?: string
  /** Optionales Element rechts neben dem Titel (z. B. ein Sammel-Schalter). */
  action?: ReactNode
  children: ReactNode
}

export function Section({ title, subtitle, action, children }: SectionProps) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
        {action}
      </div>
      {subtitle && (
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>
      )}
      <div className="mt-3">{children}</div>
    </section>
  )
}
