// src/components/trailer-card.tsx
import Image from 'next/image'
import Link from 'next/link'
import { type PrzyczepaDoc, resolveMediaUrl } from '@/lib/payload'
import { formatPLN } from '@/lib/utils'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type Props = {
  przyczepa: PrzyczepaDoc
}

export function TrailerCard({ przyczepa }: Props) {
  const imgUrl = resolveMediaUrl(przyczepa.heroImage as any)
  const price = przyczepa.cena?.basePricePerNight ?? 0

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-[16/10] w-full bg-muted">
        {imgUrl ? (
          <Image
            src={imgUrl}
            alt={String((przyczepa.heroImage as any)?.alt ?? `Zdjęcie: ${przyczepa.nazwa}`)}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
            Brak zdjęcia
          </div>
        )}
      </div>

      <CardHeader>
        <CardTitle className="text-base">{przyczepa.nazwa}</CardTitle>
        <div className="mt-2 flex flex-wrap gap-2">
          od <Badge variant="secondary">{formatPLN(price)} / doba</Badge>
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-muted-foreground h-[100px]">{przyczepa.opisKrotki}</p>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 sm:flex-row">
        <Button asChild className="w-full sm:w-auto">
          <Link href={`/przyczepy/${przyczepa.slug}`}>Szczegóły</Link>
        </Button>
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href={`/rezerwacje?caravan=${encodeURIComponent(przyczepa.slug)}`}>Rezerwuj</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
