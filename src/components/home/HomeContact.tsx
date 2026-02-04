'use client'

import * as React from 'react'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { contactSchema, type ContactFormValues } from '@/lib/schemas/contactSchema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Props = {
  siteName?: string
}

export function HomeContact({ siteName = 'Caravans' }: Props) {
  const [status, setStatus] = React.useState<'idle' | 'sending' | 'success' | 'error'>('idle')

  // 👇 lokalne "flash" errory + success, żeby mogły zniknąć po 3s
  const [flashErr, setFlashErr] = React.useState<{
    name?: string
    email?: string
    message?: string
  }>({})
  const [flashSuccess, setFlashSuccess] = React.useState(false)

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', email: '', message: '' },
    mode: 'onBlur',
  })

  const nameErr = form.formState.errors.name?.message
  const emailErr = form.formState.errors.email?.message
  const messageErr = form.formState.errors.message?.message

  // ✅ errory z RHF -> pokazujemy, ale chowamy po 3s (bez layout shift, bo min-h zostaje)
  React.useEffect(() => {
    if (!nameErr && !emailErr && !messageErr) return

    setFlashErr({
      name: nameErr,
      email: emailErr,
      message: messageErr,
    })

    const t = window.setTimeout(() => {
      setFlashErr({})
    }, 3000)

    return () => window.clearTimeout(t)
  }, [nameErr, emailErr, messageErr])

  // ✅ success -> zielony i znika po 3s
  React.useEffect(() => {
    if (status !== 'success') return
    setFlashSuccess(true)

    const t = window.setTimeout(() => {
      setFlashSuccess(false)
      // opcjonalnie wróć do idle żeby "success" nie wracał
      setStatus('idle')
    }, 3000)

    return () => window.clearTimeout(t)
  }, [status])

  async function onSubmit(values: ContactFormValues) {
    try {
      setStatus('sending')
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error('Request failed')
      form.reset()
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  return (
    <section id="kontakt" aria-labelledby="kontakt-heading" className="space-y-4 px-2 md:px-2">
      <h2 id="kontakt-heading" className="hidden text-xl font-semibold">
        Kontakt
      </h2>

      <div className="grid md:grid-cols-2">
        <Card className="border-none shadow-none lg:order-2 p-0 md:mt-10">
          <CardContent className="space-y-3 text-sm">
            <div className="">
              <Image
                src="/images/contact-photo.png"
                alt=""
                aria-hidden="true"
                width={1200}
                height={800}
                sizes="(min-width: 768px) 540px, 100vw"
                className="h-auto w-full"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:order-1">
          <CardHeader>
            <CardTitle className="text-base">Napisz wiadomość</CardTitle>
          </CardHeader>

          <CardContent className="min-h-[420px]">
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
              {/* Name */}
              <div className="">
                <label htmlFor="contact-name" className="sr-only">
                  Imię i nazwisko
                </label>

                <div className="relative">
                  <Input
                    id="contact-name"
                    autoComplete="name"
                    placeholder=" "
                    className="peer h-12 pt-5"
                    aria-invalid={!!nameErr}
                    aria-describedby="contact-name-error"
                    {...form.register('name')}
                  />
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground transition-all peer-focus:top-3 peer-focus:-translate-y-0 peer-focus:text-xs peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:-translate-y-0 peer-[:not(:placeholder-shown)]:text-xs">
                    Imię i nazwisko
                  </span>
                </div>

                <p
                  id="contact-name-error"
                  className="min-h-[16px] text-xs text-red-600"
                  aria-live="polite"
                >
                  {flashErr.name ?? ''}
                </p>
              </div>

              {/* Email */}
              <div className="">
                <label htmlFor="contact-email" className="sr-only">
                  E-mail
                </label>

                <div className="relative">
                  <Input
                    id="contact-email"
                    type="email"
                    autoComplete="email"
                    placeholder=" "
                    className="peer h-12 pt-5"
                    aria-invalid={!!emailErr}
                    aria-describedby="contact-email-error"
                    {...form.register('email')}
                  />
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground transition-all peer-focus:top-3 peer-focus:-translate-y-0 peer-focus:text-xs peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:-translate-y-0 peer-[:not(:placeholder-shown)]:text-xs">
                    E-mail
                  </span>
                </div>

                <p
                  id="contact-email-error"
                  className="min-h-[16px] text-xs text-red-600"
                  aria-live="polite"
                >
                  {flashErr.email ?? ''}
                </p>
              </div>

              {/* Message */}
              <div className="">
                <label htmlFor="contact-message" className="sr-only">
                  Wiadomość
                </label>

                <div className="relative">
                  <Textarea
                    id="contact-message"
                    placeholder=" "
                    className="peer h-[160px] resize-none overflow-y-auto pt-6"
                    aria-invalid={!!messageErr}
                    aria-describedby="contact-message-error"
                    {...form.register('message')}
                  />
                  <span className="pointer-events-none absolute left-3 top-6 text-sm text-muted-foreground transition-all peer-focus:top-3 peer-focus:text-xs peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-xs">
                    Wiadomość
                  </span>
                </div>

                <p
                  id="contact-message-error"
                  className="min-h-[16px] text-xs text-red-600"
                  aria-live="polite"
                >
                  {flashErr.message ?? ''}
                </p>
              </div>

              <Button
                type="submit"
                disabled={status === 'sending'}
                className="min-h-[44px] px-10 cursor-pointer"
              >
                {status === 'sending' ? 'Wysyłam…' : 'Wyślij'}
              </Button>

              <div aria-live="polite" role="status" className="min-h-[20px] text-sm">
                {flashSuccess ? (
                  <span className="text-emerald-700">Wiadomość wysłana. Dzięki!</span>
                ) : null}

                {status === 'error' ? (
                  <span className="text-red-600">Nie udało się wysłać. Spróbuj ponownie.</span>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
