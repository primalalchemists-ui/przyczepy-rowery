// src/components/resources/ResourceGallery.tsx
'use client'

import * as React from 'react'
import { resolveMediaUrl, type MediaDoc } from '@/lib/payload'
import { cn } from '@/lib/utils'
import { FadeImage } from '@/components/motion/FadeImage'
import { FullscreenGallery } from '@/components/gallery/FullscreenGallery'

type GalleryItem = { media?: MediaDoc | number | string; image?: MediaDoc | number | string }

type MediaItem = {
  src: string
  type: 'image' | 'video'
  alt?: string
}

function inferType(url: string): MediaItem['type'] {
  // prosta heurystyka — rozszerz jak chcesz
  const u = url.toLowerCase().split('?')[0].split('#')[0]
  if (u.endsWith('.mp4') || u.endsWith('.webm') || u.endsWith('.ogg') || u.endsWith('.mov')) return 'video'
  return 'image'
}

export function ResourceGallery(props: {
  hero?: MediaDoc | number | string | null
  gallery?: GalleryItem[] | null
  altBase: string
}) {
  const heroUrl = resolveMediaUrl(props.hero ?? null)

  const galleryUrls =
    props.gallery
      ?.map((g) => resolveMediaUrl(g?.media ?? g?.image ?? null))
      .filter((u): u is string => Boolean(u)) ?? []

  const all = [heroUrl, ...galleryUrls].filter((u): u is string => Boolean(u))

  const items: MediaItem[] = all.map((src, i) => ({
    src,
    type: inferType(src),
    alt:
      i === 0
        ? `${props.altBase} - media główne`
        : `${props.altBase} - media ${i + 1}`,
  }))

  const [open, setOpen] = React.useState(false)
  const [activeIndex, setActiveIndex] = React.useState(0)

  if (!items.length) {
    return (
      <div className="rounded-lg border p-6" role="status" aria-live="polite">
        <p className="text-sm text-muted-foreground">Brak zdjęć.</p>
      </div>
    )
  }

  const main = items[0]
  const rest = items.slice(1, 9)

  const openAt = (idx: number) => {
    setActiveIndex(idx)
    setOpen(true)
  }

  return (
    <section aria-label="Galeria mediów" className="grid gap-3">
      {/* MAIN */}
      <button
        type="button"
        onClick={() => openAt(0)}
        className="relative aspect-[16/9] overflow-hidden rounded-lg border bg-muted text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="Otwórz podgląd pełnoekranowy"
      >
        {main.type === 'image' ? (
          <FadeImage
            src={main.src}
            alt={main.alt ?? `${props.altBase} - zdjęcie główne`}
            fill
            sizes="(max-width: 768px) 100vw, 800px"
            className={cn('object-cover')}
            priority
          />
        ) : (
          <video
            src={main.src}
            className="h-full w-full object-cover"
            muted
            playsInline
            preload="metadata"
            aria-label={main.alt ?? `${props.altBase} - wideo główne`}
          />
        )}

        {/* mikro “shine” na hover */}
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 hover:opacity-100" />
      </button>

      {/* THUMBS */}
      {rest.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4" role="list" aria-label="Pozostałe media">
          {rest.map((item, idx) => {
            const absoluteIndex = idx + 1
            return (
              <button
                key={`${item.src}-${absoluteIndex}`}
                type="button"
                role="listitem"
                onClick={() => openAt(absoluteIndex)}
                className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label={`Otwórz media ${absoluteIndex + 1} w podglądzie pełnoekranowym`}
              >
                {item.type === 'image' ? (
                  <FadeImage
                    src={item.src}
                    alt={item.alt ?? `${props.altBase} - zdjęcie ${absoluteIndex + 1}`}
                    fill
                    sizes="(max-width: 768px) 50vw, 200px"
                    className="object-cover transition-transform duration-300 hover:scale-[1.02]"
                  />
                ) : (
                  <video
                    src={item.src}
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
                    muted
                    playsInline
                    preload="metadata"
                    aria-label={item.alt ?? `${props.altBase} - wideo ${absoluteIndex + 1}`}
                  />
                )}
              </button>
            )
          })}
        </div>
      ) : null}

      {/* FULLSCREEN */}
      <FullscreenGallery
        items={items}
        startIndex={activeIndex}
        open={open}
        onOpenChange={setOpen}
      />
    </section>
  )
}
