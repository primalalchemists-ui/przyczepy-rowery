import Image from 'next/image'
import Link from 'next/link'

export function HomeFundingLogo() {
  return (
    <section aria-label="Informacja o dofinansowaniu" className="border-t">
      <div className="mx-auto max-w-[1400px] px-4 py-6">
        <Link
          href="/dofinansowanie"
          aria-label="Przejdź do strony z informacją o dofinansowaniu projektu"
          className="inline-flex items-center gap-3 rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <Image
            src="/logo/Logotyp_unia.avif"
            alt="Logotyp Funduszy Europejskich i NextGenerationEU"
            width={320}
            height={80}
            className="h-auto w-auto max-w-[320px] object-contain"
          />

          {/* Tekst dla czytników (i opcjonalnie dla SEO) */}
          <span className="sr-only">Dofinansowanie – informacje o projekcie</span>
        </Link>
      </div>
    </section>
  )
}
