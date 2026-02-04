import { BadgeCheck, CalendarDays, PhoneOff } from "lucide-react"

const items = [
  {
    title: "Bezpiecznie",
    desc: "Jasne zasady i przejrzysty proces rezerwacji.",
    icon: BadgeCheck,
  },
  {
    title: "Bez dzwonienia",
    desc: "Rezerwujesz online — kiedy chcesz.",
    icon: PhoneOff,
  },
  {
    title: "Kontrola terminów",
    desc: "Sprawdzasz dostępność w kalendarzu i wybierasz.",
    icon: CalendarDays,
  },
]

export function HomeWhy() {
  return (
    <section className="px-6 md:px-0">
      <div className="grid gap-10 md:grid-cols-3">
        {items.map(({ title, desc, icon: Icon }) => (
          <div key={title} className="space-y-2">
            <div className="flex items-center gap-3">
              <Icon className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-semibold tracking-tight">
                {title}
              </h3>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              {desc}
            </p>

            <div className="pt-3 border-b border-border/60" />
          </div>
        ))}
      </div>
    </section>
  )
}
