'use client'

import Link from 'next/link'
import type { ResourceDoc } from '@/lib/payload'
import { resolveMediaUrl } from '@/lib/payload'
import { formatPLN } from '@/lib/utils'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MotionDiv, useMotionSafe } from '@/components/motion/MotionSafe'
import { MotionImage } from '@/components/motion/MotionImage'

function unitLabel(u?: string) {
  if (u === 'dzien') return 'doba'
  return 'noc'
}

type Props = {
  zasob: ResourceDoc
  index?: number
}

export function ResourceTileCard({ zasob, index = 0 }: Props) {
  const { fadeUp } = useMotionSafe()

  const imgUrl = resolveMediaUrl((zasob as any).heroMedia as any)
  const basePrice = Number((zasob as any)?.cena?.basePrice ?? 0)
  const jednostka = String((zasob as any)?.cena?.jednostka ?? 'noc')
  const unit = unitLabel(jednostka)

  const opis = String((zasob as any)?.opisKrotki ?? '').trim()
  const hasOpis = opis.length > 0

  return (
    <MotionDiv {...fadeUp(index)}>
      <Card className="h-full overflow-hidden transition-shadow hover:shadow-md flex flex-col">
        <div className="relative aspect-[16/9] w-full bg-muted">
          {imgUrl ? (
            <MotionImage
              src={imgUrl}
              alt={String(((zasob as any).heroMedia as any)?.alt ?? `Zdjęcie: ${zasob.nazwa}`)}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover"
              priority={index < 3} // top 3 szybciej
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              Brak zdjęcia
            </div>
          )}
        </div>

        <CardHeader className="pb-2">
          <CardTitle className="text-[15px] leading-snug line-clamp-2">{zasob.nazwa}</CardTitle>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>od</span>

            {basePrice > 0 ? (
              <Badge variant="secondary" className="text-xs">
                {formatPLN(basePrice)} / {unit}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                Cena ustalana indywidualnie
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0 flex-1">
          <div className="relative min-h-[40px]">
            {hasOpis ? (
              <div className="group">
                <p className="text-sm text-muted-foreground line-clamp-2" title={opis}>
                  {opis}
                </p>

                <div
                  className={[
                    'pointer-events-none absolute left-0 top-full z-20 mt-2 w-[min(360px,calc(100vw-2rem))]',
                    'rounded-md border bg-background p-3 text-sm text-foreground shadow-lg',
                    'opacity-0 translate-y-1 transition',
                    'group-hover:opacity-100 group-hover:translate-y-0',
                    'group-focus-within:opacity-100 group-focus-within:translate-y-0',
                    'hidden md:block',
                  ].join(' ')}
                  aria-hidden="true"
                >
                  {opis}
                </div>
              </div>
            ) : (
              <span aria-hidden="true" className="block">
                &nbsp;
              </span>
            )}
          </div>
        </CardContent>

        <CardFooter className="mt-auto flex flex-col gap-2 sm:flex-row">
          <Button asChild size="sm" className="w-full sm:w-auto">
            <Link href={`/oferta/${zasob.slug}`}>Szczegóły</Link>
          </Button>

          <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
            <Link href={`/rezerwacje?resource=${encodeURIComponent(zasob.slug)}`}>Rezerwuj</Link>
          </Button>
        </CardFooter>
      </Card>
    </MotionDiv>
  )
}
