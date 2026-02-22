import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { HeroArt, HeroCarouselArt } from './HeroArtClient'

type Props = {
  siteName: string
}

export function HomeHero({ siteName }: Props) {
  return (
    <section
      aria-labelledby="hero-heading"
      className={[
        'relative overflow-hidden',
        'w-screen left-1/2 -translate-x-1/2',
        'md:w-full md:left-auto md:translate-x-0',
        '-mt-[var(--header-h)] pt-[var(--header-h)]',
      ].join(' ')}
    >
      {/* tło hero */}
      <div aria-hidden="true" className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-[oklch(97%_0_0)]" />
        <div className="absolute -top-24 left-1/2 h-72 w-[48rem] -translate-x-1/2 rounded-full bg-[oklch(95%_0.03_152deg)] blur-3xl opacity-70" />
        <div className="absolute -bottom-36 left-10 h-72 w-72 rounded-full bg-[oklch(96.5%_0.006_250deg)] blur-3xl opacity-70" />
      </div>

      <div className="relative mx-auto max-w-[1400px] px-4 pb-8 md:px-6">
        <div className="min-h-[calc(100svh-var(--header-h))] py-10 md:py-12 flex flex-col justify-center">
          <header className="mx-auto max-w-3xl text-center">
            <h1
              id="hero-heading"
              className="text-balance text-3xl font-semibold tracking-tight md:text-5xl leading-[1.05]"
            >
              Podróżuj po Swojemu.
              <span className="block text-foreground/70">Zarezerwuj w kilka kliknięć.</span>
            </h1>
          </header>

          <div className="mt-6 grid grid-cols-1 gap-4 md:mt-8 md:gap-6">
            {/* CARD 1 — Camper */}
            <div className="relative overflow-hidden rounded-2xl border bg-white/70 shadow-sm backdrop-blur">
              {/* MOBILE */}
              <div className="md:hidden">
                <div className="relative overflow-hidden rounded-t-2xl">
                  <HeroCarouselArt
                    side="right"
                    images={[
                      '/images/hero-1.jpg',
                      '/images/hero-2.jpg',
                      '/images/hero-3.jpg',
                      '/images/hero-4.jpg',
                      '/images/hero-5.jpg',
                      '/images/hero-6.jpg',
                    ]}
                    alt=""
                    intervalMs={2000}
                    fit="cover"
                    withBg
                    heightClassName="h-[220px]"
                    className="w-full"
                  />
                </div>

                <div className="p-5">
                  <p className="text-xs font-medium tracking-wide text-foreground/60">Przyczepy kempingowe</p>

                  <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight">
                    Mobilne Zakwaterowanie
                  </h2>

                  <p className="mt-2 max-w-[44ch] text-sm text-foreground/70">
                    Dostarczymy przyczepe w wybrane miejsce w Polsce.
                  </p>

                  <div className="mt-5">
                    <Button asChild className="min-h-[44px] px-6">
                      <Link href="/oferta?type=przyczepa">Zobacz ofertę</Link>
                    </Button>
                  </div>
                </div>
              </div>

              {/* DESKTOP */}
              <div className="hidden md:block">
                <div className="relative z-10 grid items-center gap-4 p-6 md:grid-cols-2 min-h-[320px]">
                  <div className="order-1 lg:ml-20">
                    <p className="text-xs font-medium tracking-wide text-foreground/60">Przyczepy kempingowe</p>

                    <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
                      Mobilne Zakwaterowanie
                    </h2>

                    <p className="mt-2 max-w-[44ch] text-sm text-foreground/70 md:text-base">
                      Dostarczymy przyczepe w wybrane miejsce w Polsce.
                    </p>

                    <div className="mt-5">
                      <Button asChild className="min-h-[44px] px-6">
                        <Link href="/oferta?type=przyczepa">Zobacz ofertę</Link>
                      </Button>
                    </div>
                  </div>

                  {/* PRAWO: pane dociśnięty do ramki */}
                  <div className="relative order-2 -my-6 -mr-6 pl-6">
                    <div className="overflow-hidden rounded-r-2xl shadow-xl">
                      <HeroCarouselArt
                        side="right"
                        images={[
                          '/images/hero-1.jpg',
                          '/images/hero-2.jpg',
                          '/images/hero-3.jpg',
                          '/images/hero-4.jpg',
                          '/images/hero-5.jpg',
                          '/images/hero-6.jpg',
                        ]}
                        alt=""
                        intervalMs={2000}
                        fit="cover"
                        withBg
                        heightClassName="h-[320px]"
                        className="w-[560px] ml-auto"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2 — E-bike (jak było, tylko zmienia obraz) */}
            <div className="relative overflow-hidden rounded-2xl border bg-white/70 shadow-sm backdrop-blur">
              <div className="relative z-10 grid items-center gap-4 p-5 md:grid-cols-2 md:p-6 min-h-[260px] md:min-h-[320px]">
                {/* LEWO: e-bike jako "obiekt" (contain, bez tła) */}
                <div className="relative order-1">
                  <HeroCarouselArt
                    side="left"
                    images={[
                      '/images/e-bike-1.png',
                      '/images/e-bike-2.png',
                      '/images/e-bike-3.webp',
                      '/images/e-bike-4.png',
                    ]}
                    alt=""
                    intervalMs={2000}
                    fit="contain"
                    withBg={false}
                    heightClassName="h-[220px] md:h-[260px]"
                    className={['w-[340px] mx-auto', 'md:w-[420px] md:ml-0 md:mr-auto'].join(' ')}
                  />
                </div>

                {/* PRAWO: tekst */}
                <div className="order-2 md:order-2 lg:ml-20">
                  <p className="text-xs font-medium tracking-wide text-foreground/60">Rowery elektryczne</p>

                  <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
                    Wynajem Rowerów
                  </h2>

                  <p className="mt-2 max-w-[48ch] text-sm text-foreground/70 md:text-base">
                    Odbierz rower we Wrocławiu.
                  </p>

                  <div className="mt-5">
                    <Button asChild className="min-h-[44px] px-6">
                      <Link href="/oferta?type=ebike">Zobacz ofertę</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* jeśli nadal łapie scroll na niektórych ekranach, zmniejsz mt-6 -> mt-4 */}
        </div>
      </div>
    </section>
  )
}
