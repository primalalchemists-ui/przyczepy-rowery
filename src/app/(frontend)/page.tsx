// src/app/(frontend)/page.tsx
import { listActiveResources, getSiteSettings, getBookingSettings } from '@/lib/payload'
import { HomeHero } from 'src/components/home/HomeHero'
import { HomeWhy } from 'src/components/home/HomeWhy'
import { HomeFeatured } from 'src/components/home/HomeFeatured'
import { HomeHowItWorks } from 'src/components/home/HomeHowItWorks'
import { HomeContact } from 'src/components/home/HomeContact'
import { HomeCTA } from 'src/components/home/HomeCTA'
import { HomeFAQ } from 'src/components/home/HomeFAQ'
import { HomeFundingLogo } from 'src/components/home/HomeFundingLogo'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Strona główna',
}


export default async function HomePage() {
  const site = await getSiteSettings()
  const booking = await getBookingSettings()
  const zasoby = await listActiveResources({ limit: 3, depth: 2 })

  return (
    <div className="space-y-10">
      <HomeHero siteName={site?.siteName ?? 'Oferta'} />
      <HomeWhy />
      <HomeFeatured zasoby={zasoby ?? []} />
      <HomeHowItWorks />
      <HomeContact siteName={site?.siteName ?? 'Oferta'} />
      <HomeCTA
        phone={site?.phone ?? null}
        email={site?.email ?? null}
        address={site?.address ?? null}
      />
      <HomeFAQ items={booking?.faq ?? null} />
      <HomeFundingLogo />
    </div>
  )
}
