import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { ResourceDoc } from '@/lib/payload'
import { ResourceTileCard } from '@/components/resource-tile-card'

type Props = {
  zasoby: Array<ResourceDoc>
}

export function HomeFeatured({ zasoby }: Props) {
  return (
    <section aria-labelledby="featured-heading" className="space-y-4 px-2 md:px-0">
      <div className="flex items-center justify-between gap-4">
        <h2 id="featured-heading" className="text-xl font-semibold">
          Polecane
        </h2>
        <Button asChild variant="link">
          <Link href="/oferta">Zobacz wszystkie</Link>
        </Button>
      </div>

      {!zasoby?.length ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Brak polecanych zasobów do wyświetlenia.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {zasoby.map((z) => (
            <ResourceTileCard key={z.slug} zasob={z} />
          ))}
        </div>
      )}
    </section>
  )
}
