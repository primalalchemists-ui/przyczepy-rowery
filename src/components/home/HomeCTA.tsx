'use client'

import * as React from 'react'
import Link from 'next/link'
import { Mail, MapPin, Phone } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Props = {
  phone?: string | null
  email?: string | null
  address?: string | null

  primaryHref?: string
  secondaryHref?: string
}

function toGoogleMapsHref(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
}

function ContactRow(props: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center self-center text-primary" aria-hidden="true">
        {props.icon}
      </div>

      <div className="min-w-0">
        <div className="text-sm font-medium text-left">{props.label}</div>
        <div className="min-w-0 text-sm text-muted-foreground">{props.children}</div>
      </div>
    </div>
  )
}

export function HomeCTA({
  phone,
  email,
  address,
  primaryHref = '/przyczepy',
  secondaryHref = '/rezerwacje',
}: Props) {
  return (
    <section aria-labelledby="home-cta-heading" className="px-2 md:px-2">
      <Card>
        {/* 2 kolumny: lewo CTA, prawo kontakt (na mobile 1 kolumna) */}
        <CardContent className="grid gap-6 p-6 md:grid-cols-[1fr_420px] md:items-center">
          {/* LEWO: CTA */}
          <div className="space-y-3 flex flex-col justify-between h-full">
            <CardHeader className="p-0">
              <CardTitle id="home-cta-heading" className="text-lg">
                Gotowy na wyjazd?
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Sprawdź dostępne przyczepy i zarezerwuj termin. Jeśli wolisz — zadzwoń, napisz albo sprawdź
                lokalizację.
              </p>
            </CardHeader>



            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="min-h-[44px] px-6">
                <Link href={primaryHref}>Zobacz przyczepy</Link>
              </Button>

              <Button asChild variant="outline" className="min-h-[44px] px-6">
                <Link href={secondaryHref}>Przejdź do rezerwacji</Link>
              </Button>
            </div>
          </div>

          {/* PRAWO: kontakt */}
          <div className="grid gap-3 md:justify-self-end md:text-right">
            {phone ? (
              <div className="md:flex">
                <ContactRow icon={<Phone className="h-4 w-4" />} label="Telefon">
                  <a
                    className="underline underline-offset-4"
                    href={`tel:${phone}`}
                    aria-label={`Zadzwoń: ${phone}`}
                  >
                    {phone}
                  </a>
                </ContactRow>
              </div>
            ) : null}

            {email ? (
              <div className="md:flex">
                <ContactRow icon={<Mail className="h-4 w-4" />} label="E-mail">
                  <a
                    className="underline underline-offset-4"
                    href={`mailto:${email}`}
                    aria-label={`Napisz e-mail: ${email}`}
                  >
                    {email}
                  </a>
                </ContactRow>
              </div>
            ) : null}

            {address ? (
              <div className="md:flex">
                <ContactRow icon={<MapPin className="h-4 w-4" />} label="Adres">
                  <a
                    className="underline underline-offset-4"
                    href={toGoogleMapsHref(address)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Otwórz w Mapach Google: ${address}`}
                  >
                    <address className="not-italic leading-relaxed">{address}</address>
                  </a>
                </ContactRow>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
