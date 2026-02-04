'use client'

export function CalendarLegend({ readonly = false }: { readonly?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1">
        <span className="h-3 w-3 rounded-sm bg-emerald-400/50" />
        Dostępne
      </span>

      <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1">
        <span className="h-3 w-3 rounded-sm bg-red-500/60" />
        Zajęte
      </span>

      <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1">
        <span className="h-3 w-3 rounded-sm bg-black/70" />
        Niedostępne
      </span>

      {!readonly && (
        <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1">
          <span className="h-3 w-3 rounded-sm border border-black" />
          Wybrane
        </span>
      )}
    </div>
  )
}
