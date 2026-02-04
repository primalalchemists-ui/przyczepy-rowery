// src/components/trailers/TrailerGallery.tsx
import Image from 'next/image'
import { resolveMediaUrl, type MediaDoc } from '@/lib/payload'
import { cn } from '@/lib/utils'

type GalleryItem = { image: MediaDoc | number | string }

export function TrailerGallery(props: {
  hero?: MediaDoc | number | string | null
  gallery?: GalleryItem[] | null
  altBase: string
}) {
  const heroUrl = resolveMediaUrl(props.hero ?? null)
  const galleryUrls =
    props.gallery
      ?.map((g) => resolveMediaUrl(g.image))
      .filter((u): u is string => Boolean(u)) ?? []

  const all = [heroUrl, ...galleryUrls].filter((u): u is string => Boolean(u))

  if (!all.length) {
    return (
      <div className="rounded-lg border p-6">
        <p className="text-sm text-muted-foreground">Brak zdjęć.</p>
      </div>
    )
  }

  const main = all[0]
  const rest = all.slice(1, 9)

  return (
    <section aria-label="Galeria zdjęć" className="grid gap-3">
      <div className="relative aspect-[16/9] overflow-hidden rounded-lg border">
        <Image
          src={main}
          alt={`${props.altBase} - zdjęcie główne`}
          fill
          sizes="(max-width: 768px) 100vw, 800px"
          className={cn('object-cover')}
          priority
        />
      </div>

      {rest.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {rest.map((u, idx) => (
            <div key={u} className="relative aspect-[4/3] overflow-hidden rounded-lg border">
              <Image
                src={u}
                alt={`${props.altBase} - zdjęcie ${idx + 2}`}
                fill
                sizes="(max-width: 768px) 50vw, 200px"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}
