import Link from 'next/link'
import { TrailerCard } from '@/components/trailer-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type Props = {
  przyczepy: Array<any>
}

export function HomeFeatured({ przyczepy }: Props) {
  return (
    <section aria-labelledby="featured-heading" className="space-y-4 px-2 md:px-0">
      <div className="flex items-center justify-between gap-4">
        <h2 id="featured-heading" className="text-xl font-semibold">
          Polecane
        </h2>
        <Button asChild variant="link">
          <Link href="/przyczepy">Zobacz wszystkie</Link>
        </Button>
      </div>

      {!przyczepy?.length ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Brak aktywnych przyczep do wyświetlenia.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {przyczepy.map((p) => (
            <TrailerCard key={p.slug} przyczepa={p} />
          ))}
        </div>
      )}
    </section>
  )
}
