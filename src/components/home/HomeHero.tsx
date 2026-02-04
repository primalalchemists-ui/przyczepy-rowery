import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

type Props = {
  siteName: string
  heroDesktopSrc?: string
  heroMobileSrc?: string
}

export function HomeHero({
  heroDesktopSrc = '/images/image-1--desktop.jpeg',
  heroMobileSrc = '/images/image-1--mobile.jpeg', // na razie to samo
}: Props) {
  return (
    <section
      aria-labelledby="hero-heading"
      className={[
        "relative overflow-hidden shadow-sm",
        // ✅ mobile: pełna szerokość ekranu, nawet jeśli rodzic ma max-w + px
        "w-screen left-1/2 -translate-x-1/2",
        // ✅ desktop: normalnie w layoucie (żeby nie rozjechać md+)
        "md:w-full md:left-auto md:translate-x-0",
        // ramka tylko na md+ (żeby na mobile nie rysować “paska”)
        "md:border md:rounded-lg md:shadow-sm",
      ].join(" ")}
    >
      {/* MOBILE: full viewport */}
      <div className="relative min-h-[100svh] md:hidden">
        <Image
          src={heroMobileSrc}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />

        {/* overlay pod czytelność */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/35 to-black/70"
        />

        {/* content na dole, bez “naokoło” */}
       <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-24">
        <h1
          id="hero-heading"
          className="text-balance text-4xl font-semibold tracking-tight text-white"
        >
          Wynajem Przyczep Campingowych.
          Klarownie, Szybko, Wygodnie.
        </h1>

        <p className="mt-2 text-pretty text-sm text-white/90">
          wybierz przyczepę, sprawdź terminy i zarezerwuj w kilku krokach.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button asChild variant="default" className="min-h-[44px] w-full">
            <Link href="/rezerwacje">Rezerwuj</Link>
          </Button>

          <Button
            asChild
            variant="secondary"
            className="min-h-[44px] w-full border-white/70 bg-white/10 text-white hover:bg-white/20 hover:text-white"
          >
            <Link href="/przyczepy">Przyczepy</Link>
          </Button>
        </div>
      </div>

      </div>

      {/* DESKTOP: dobry aspekt ratio, nie full viewport */}
      <div className="relative hidden md:block">
        {/* wysokość: wygląda jak hero-banner, nie “ściana” */}
        <div className="relative h-[520px] lg:h-[560px]">
          <Image
            src={heroDesktopSrc}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />

          {/* overlay delikatniejszy niż mobile */}
          <div aria-hidden="true" className="absolute inset-0">
            {/* winieta: ciemniej po bokach */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.05)_0%,rgba(0,0,0,0.35)_70%,rgba(0,0,0,0.55)_100%)]" />
            {/* dodatkowy gradient z lewej pod czytelność tekstu */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent" />
          </div>

          <div className="absolute inset-0 z-10 mx-auto flex max-w-6xl items-center  pt-54 mr-40">

            <div className="max-w-2xl mdmt-32">
              <h1
                className="text-balance text-5xl font-semibold  tracking-tight text-white"
              >
                Wynajem przyczep campingowych — szybko, wygodnie, online.
              </h1>

              <p className="mt-3 text-pretty text-base text-white/90">
                wybierz przyczepę, sprawdź terminy i zarezerwuj w kilku krokach.
              </p>

              <div className="mt-5 flex items-center gap-3">

                <Button asChild variant="default" className="min-h-[24px] px-10">
                  <Link href="/rezerwacje">Rezerwuj</Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="min-h-[44px] border-white/70 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                >
                  <Link href="/przyczepy">Zobacz przyczepy</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
