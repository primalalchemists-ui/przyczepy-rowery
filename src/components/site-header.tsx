'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

type Props = { siteName: string }

const navItems = [
  { href: '/', label: 'Start' },
  { href: '/oferta', label: 'Oferta' },
  { href: '/rezerwacje', label: 'Rezerwacje', highlight: true },
  { href: '/#kontakt', label: 'Kontakt' },
] as const

export function SiteHeader({ siteName }: Props) {
  return (
    <header className="border-b bg-background/80 backdrop-blur" style={{ ['--header-h' as any]: '72px' }}>
      <nav className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          aria-label={`Przejdź do strony głównej: ${siteName}`}
          className="inline-flex items-center gap-1.5 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Image src="/logo/logo.png" alt={`${siteName} – logo`} width={44} height={44} priority className="h-10 w-10" />
          <span className="text-base font-semibold tracking-tight hover:text-primary">{siteName}</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const highlighted = 'highlight' in item && item.highlight
            return (
              <Button
                key={item.href}
                asChild
                variant="ghost"
                className={
                  highlighted
                    ? 'h-9 px-4 bg-accent text-accent-foreground hover:opacity-80 transition'
                    : 'h-9 px-4 hover:bg-accent transition'
                }
              >
                <Link href={item.href}>{item.label}</Link>
              </Button>
            )
          })}
        </div>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Otwórz menu">
                <Menu aria-hidden="true" />
              </Button>
            </SheetTrigger>

            <SheetContent
              side="right"
              onOpenAutoFocus={(e) => e.preventDefault()}
              className="p-0"
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <div className="flex items-center justify-between border-b px-4 py-3">
                <SheetHeader className="space-y-0">
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>

                <SheetClose asChild>
                  <Button variant="outline" size="sm">Zamknij</Button>
                </SheetClose>
              </div>

              <div className="flex flex-col gap-2 px-4 py-4">
                {navItems.map((item) => {
                  const highlighted = 'highlight' in item && item.highlight
                  return (
                    <SheetClose key={item.href} asChild>
                      <Button
                        asChild
                        variant="ghost"
                        className={
                          highlighted
                            ? 'h-12 w-full justify-start px-4 text-base bg-accent text-accent-foreground hover:opacity-80 transition'
                            : 'h-12 w-full justify-start px-4 text-base hover:bg-accent transition'
                        }
                      >
                        <Link href={item.href}>{item.label}</Link>
                      </Button>
                    </SheetClose>
                  )
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  )
}
