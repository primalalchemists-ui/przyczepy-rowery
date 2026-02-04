import { Caravan, CalendarCheck2, CreditCard } from "lucide-react"

const steps = [
  {
    title: "Wybierz przyczepę",
    desc: "Wejdź w szczegóły i sprawdź opis, galerię oraz cenę.",
    icon: Caravan,
  },
  {
    title: "Podaj termin",
    desc: "Wybierz daty wynajmu i zwrotu w kalendarzu.",
    icon: CalendarCheck2,
  },
  {
    title: "Płatność i potwierdzenie",
    desc: "Opłać rezerwację online i dostaniesz potwierdzenie e-mail.",
    icon: CreditCard,
  },
]

export function HomeHowItWorks() {
  return (
    <section className="px-6 md:px-0">
      <div className="grid gap-10 md:grid-cols-3">
        {steps.map(({ title, desc, icon: Icon }, i) => (
          <div key={title} className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-muted-foreground">
                0{i + 1}
              </span>

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
