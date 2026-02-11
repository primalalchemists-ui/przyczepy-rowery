'use client'

import * as React from 'react'
import Image from 'next/image'
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion'
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

function CamperVisual() {
  const reduce = useReducedMotion()

  const mx = useMotionValue(0)
  const my = useMotionValue(0)

  const rotX = useSpring(my, { stiffness: 120, damping: 18 })
  const rotY = useSpring(mx, { stiffness: 120, damping: 18 })

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reduce) return
    const r = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    const dx = (px - 0.5) * 2
    const dy = (py - 0.5) * 2
    mx.set(dx * 4)
    my.set(-dy * 4)
  }

  function onLeave() {
    mx.set(0)
    my.set(0)
  }

  return (
    <div className="relative w-full">
      <motion.div
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={reduce ? undefined : { rotateX: rotX, rotateY: rotY, transformStyle: 'preserve-3d' }}
        className={[
          'relative',
          'min-h-[420px]',
          'flex items-end justify-center', // ✅ “ziemia” na dole
          'overflow-hidden -mt-10 h-full lg:mt-0 -space-x-4', // tylko po to żeby glow nie wyciekał
        ].join(' ')}
      >
        {/* glow jak w hero, ale bez ramki */}
        <div aria-hidden="true" className="absolute inset-0 md:hidden">
          <div className="absolute -top-24 left-1/2 h-64 w-[40rem] -translate-x-1/2 rounded-full bg-[oklch(95%_0.03_152deg)] blur-3xl opacity-55" />
          <div className="absolute -bottom-28 left-10 h-64 w-64 rounded-full bg-[oklch(96.5%_0.006_250deg)] blur-3xl opacity-55" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/0 to-white/0" />
        </div>

        {/* Camper – stoi na dole, faluje minimalnie */}
        <motion.div
          style={reduce ? undefined : { transform: 'translateZ(22px)' }}
          animate={reduce ? undefined : { y: [0, -6, 0] }}
          transition={reduce ? undefined : { duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
          className={[
            'pointer-events-none select-none',
            'w-[92%] max-w-[680px]',
            'pb-2 lg:mt-10', // ✅ “koła” nie dotykają klifu
          ].join(' ')}
        >
          <Image
            src="/images/contact-photo.png"
            alt=""
            aria-hidden="true"
            width={1400}
            height={800}
            className="h-auto w-full"
            priority={false}
          />
        </motion.div>
      </motion.div>
    </div>
  )
}

export function HomeContact({ siteName = 'Caravans' }: Props) {
  const [status, setStatus] = React.useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [flashErr, setFlashErr] = React.useState<{ name?: string; email?: string; message?: string }>({})
  const [flashSuccess, setFlashSuccess] = React.useState(false)

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', email: '', message: '' },
    mode: 'onBlur',
  })

  const nameErr = form.formState.errors.name?.message
  const emailErr = form.formState.errors.email?.message
  const messageErr = form.formState.errors.message?.message

  React.useEffect(() => {
    if (!nameErr && !emailErr && !messageErr) return
    setFlashErr({ name: nameErr, email: emailErr, message: messageErr })
    const t = window.setTimeout(() => setFlashErr({}), 3000)
    return () => window.clearTimeout(t)
  }, [nameErr, emailErr, messageErr])

  React.useEffect(() => {
    if (status !== 'success') return
    setFlashSuccess(true)
    const t = window.setTimeout(() => {
      setFlashSuccess(false)
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

      <div className="grid gap-6 md:grid-cols-2 md:items-stretch">
        {/* prawa strona: camper */}
        <Card className="border-none shadow-none md:order-2 p-0 bg-transparent">
          <CardContent className="p-0">
            <CamperVisual />
          </CardContent>
        </Card>

        {/* lewa strona: formularz */}
        <Card className="md:order-1">
          <CardHeader>
            <CardTitle className="text-base">Napisz wiadomość</CardTitle>
          </CardHeader>

          <CardContent className="min-h-[420px]">
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
              {/* Name */}
              <div>
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

                <p id="contact-name-error" className="min-h-[16px] text-xs text-red-600" aria-live="polite">
                  {flashErr.name ?? ''}
                </p>
              </div>

              {/* Email */}
              <div>
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

                <p id="contact-email-error" className="min-h-[16px] text-xs text-red-600" aria-live="polite">
                  {flashErr.email ?? ''}
                </p>
              </div>

              {/* Message */}
              <div>
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

                <p id="contact-message-error" className="min-h-[16px] text-xs text-red-600" aria-live="polite">
                  {flashErr.message ?? ''}
                </p>
              </div>

              <Button type="submit" disabled={status === 'sending'} className="min-h-[44px] px-10 cursor-pointer">
                {status === 'sending' ? 'Wysyłam…' : 'Wyślij'}
              </Button>

              <div aria-live="polite" role="status" className="min-h-[20px] text-sm">
                {flashSuccess ? <span className="text-emerald-700">Wiadomość wysłana. Dzięki!</span> : null}
                {status === 'error' ? <span className="text-red-600">Nie udało się wysłać. Spróbuj ponownie.</span> : null}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
