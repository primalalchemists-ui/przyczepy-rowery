// src/app/(frontend)/page.tsx
import { listActiveResources, getSiteSettings } from '@/lib/payload'
import { HomeHero } from 'src/components/home/HomeHero'
import { HomeWhy } from 'src/components/home/HomeWhy'
import { HomeFeatured } from 'src/components/home/HomeFeatured'
import { HomeHowItWorks } from 'src/components/home/HomeHowItWorks'
import { HomeContact } from 'src/components/home/HomeContact'
import { HomeCTA } from 'src/components/home/HomeCTA'
import { HomeFundingLogo } from 'src/components/home/HomeFundingLogo'

export default async function HomePage() {
  const site = await getSiteSettings()
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
      <HomeFundingLogo />
    </div>
  )
}
