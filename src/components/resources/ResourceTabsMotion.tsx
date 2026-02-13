'use client'

import * as React from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

type Props = {
  defaultTab?: 'opis' | 'spec'
  opis: React.ReactNode
  spec: React.ReactNode
}

export function ResourceTabsMotion({ defaultTab = 'opis', opis, spec }: Props) {
  const reduce = useReducedMotion()
  const [tab, setTab] = React.useState<'opis' | 'spec'>(defaultTab)

  // TabsTrigger w shadcn zmienia value przez eventy — my robimy prosty most:
  // parent ustawi tab przez props? Tu robimy minimalny “self controlled” handler:
  // Użyjemy data-attr w parent (poniżej) i callback.
  // Ale żeby było copy-paste bez komplikacji, zostawimy to jako komponent,
  // który będzie sterowany przez TabsContent render conditions (poniżej).
  //
  // W tym podejściu NIE używamy setTab z zewnątrz — bo i tak Next tabs przełącza view.
  // Więc to jest wersja “manual switch” jeśli będziesz kiedyś chciał bez shadcn.
  //
  // Na teraz: użyjemy tego komponentu w page bez własnych Tabs,
  // więc wklejamy też prosty header przełączający.
  //
  // Jeśli chcesz zachować shadcn TabsList/Trigger, patrz wariant 2 niżej.

  return (
    <section className="relative">
      {/* glow/poświata */}

      {/* proste przełączniki, WCAG: button + aria-selected */}
      <div role="tablist" aria-label="Sekcje zasobu" className="inline-flex rounded-lg bg-muted p-1">
        <TabBtn active={tab === 'opis'} onClick={() => setTab('opis')}>
          Opis
        </TabBtn>
        <TabBtn active={tab === 'spec'} onClick={() => setTab('spec')}>
          Specyfikacja
        </TabBtn>
      </div>

      <div className="mt-4">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            layout
            initial={reduce ? { opacity: 1 } : { opacity: 0, y: 6 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={reduce ? { duration: 0.01 } : { duration: 0.22, ease: 'easeOut' }}
            className="relative"
          >
            {/* floating surface */}
            <div className="">
              {tab === 'opis' ? opis : spec}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={[
        'min-h-[40px] px-3 text-sm font-medium rounded-md',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        active ? 'bg-background shadow-sm' : 'text-foreground/70 hover:text-foreground',
      ].join(' ')}
    >
      {children}
    </button>
  )
}
