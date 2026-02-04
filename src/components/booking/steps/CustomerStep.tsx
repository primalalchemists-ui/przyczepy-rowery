'use client'

import { useEffect } from 'react'
import { UseFormReturn } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'

import type { BookingFormValues } from '@/lib/schemas/bookingSchema'
import { calcPayableNow } from '@/lib/booking/payable'

function FieldError(props: { id?: string; msg?: string }) {
  return (
    <div id={props.id} className="min-h-[18px] text-xs text-destructive" aria-live="polite">
      {props.msg ?? ''}
    </div>
  )
}

function FloatingInput(props: {
  id: string
  label: string
  type?: string
  error?: string
  inputProps: any
  autoComplete?: string
}) {
  const errorId = `${props.id}-error`

  return (
    <div className="space-y-1">
      <label htmlFor={props.id} className="sr-only">
        {props.label}
      </label>

      <div className="relative">
        <Input
          id={props.id}
          type={props.type ?? 'text'}
          autoComplete={props.autoComplete}
          placeholder=" "
          className="peer h-12 pt-5 text-base"
          aria-invalid={!!props.error}
          aria-describedby={props.error ? errorId : undefined}
          {...props.inputProps}
        />

        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground transition-all peer-focus:top-3 peer-focus:text-xs peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-xs"
        >
          {props.label}
        </span>
      </div>

      <FieldError id={errorId} msg={props.error} />
    </div>
  )
}

function FloatingTextarea(props: { id: string; label: string; error?: string; textareaProps: any }) {
  const errorId = `${props.id}-error`

  return (
    <div className="space-y-1">
      <label htmlFor={props.id} className="sr-only">
        {props.label}
      </label>

      <div className="relative">
        <Textarea
          id={props.id}
          placeholder=" "
          className="peer min-h-[160px] pt-6 text-base"
          aria-invalid={!!props.error}
          aria-describedby={props.error ? errorId : undefined}
          {...props.textareaProps}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-6 text-sm text-muted-foreground transition-all peer-focus:top-3 peer-focus:text-xs peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-xs"
        >
          {props.label}
        </span>
      </div>

      <FieldError id={errorId} msg={props.error} />
    </div>
  )
}

function PdfLink(props: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={props.href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      onClick={(e) => {
        // ✅ ważne: link jest w <label>, więc bez tego klik może przełączać checkbox
        e.stopPropagation()
      }}
    >
      {props.children}
    </a>
  )
}

export function CustomerStep(props: {
  form: UseFormReturn<BookingFormValues>
  onSubmit: (values: BookingFormValues) => void
  isPending: boolean
  scrollRef: React.RefObject<HTMLDivElement | null>

  regulaminHref?: string
  politykaHref?: string

  total: number
  paymentMode?: 'full' | 'deposit'
  depositType?: 'percent' | 'fixed'
  depositValue?: number
}) {
  useEffect(() => {
    props.scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [props.scrollRef])

  const errors = props.form.formState.errors

  const payableNow = calcPayableNow(props.total, {
    paymentMode: props.paymentMode,
    depositType: props.depositType,
    depositValue: props.depositValue,
  })

  const wantsInvoice = props.form.watch('wantsInvoice')

  useEffect(() => {
    if (!wantsInvoice) {
      props.form.setValue('nip', '', { shouldValidate: true, shouldDirty: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantsInvoice])

  const acceptRegErrId = 'acceptRegulamin-error'
  const acceptPolErrId = 'acceptPolityka-error'

  const regulaminHref = props.regulaminHref ?? '/api/download/regulamin'
  const politykaHref = props.politykaHref ?? '/api/download/polityka'

  return (
    <div ref={props.scrollRef}>
      <Card>
        <CardHeader>
          <CardTitle>Dane klienta</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={props.form.handleSubmit(props.onSubmit)} className="grid gap-4" noValidate>
            <FloatingInput
              id="fullName"
              label="Imię i nazwisko"
              error={errors.fullName?.message}
              inputProps={props.form.register('fullName')}
              autoComplete="name"
            />

            <FloatingInput
              id="email"
              label="E-mail"
              type="email"
              error={errors.email?.message}
              inputProps={props.form.register('email')}
              autoComplete="email"
            />

            <FloatingInput
              id="phone"
              label="Telefon"
              error={errors.phone?.message}
              inputProps={props.form.register('phone')}
              autoComplete="tel"
            />

            <FloatingTextarea
              id="notes"
              label="Uwagi (opcjonalnie)"
              error={errors.notes?.message as any}
              textareaProps={props.form.register('notes')}
            />

            {/* Disability */}
            <div className="flex items-center justify-between gap-3 rounded-md border p-3">
              <p className="text-sm font-medium" id="disability-label">
                Osoby z niepełnosprawnościami
              </p>
              <Switch
                aria-labelledby="disability-label"
                checked={props.form.watch('disability')}
                onCheckedChange={(v) => props.form.setValue('disability', Boolean(v), { shouldDirty: true })}
              />
            </div>

            {/* ✅ Faktura + NIP */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-3 rounded-md border p-3">
                <p className="text-sm font-medium" id="invoice-label">
                  Chcę fakturę
                </p>
                <Switch
                  aria-labelledby="invoice-label"
                  checked={wantsInvoice}
                  onCheckedChange={(v) =>
                    props.form.setValue('wantsInvoice', Boolean(v), { shouldValidate: true, shouldDirty: true })
                  }
                />
              </div>

              {wantsInvoice ? (
                <FloatingInput
                  id="nip"
                  label="NIP (wymagany do faktury)"
                  error={errors.nip?.message as any}
                  inputProps={props.form.register('nip')}
                  autoComplete="off"
                />
              ) : null}
            </div>

            {/* ✅ Regulamin + Polityka */}
            <div className="grid gap-2">
              {/* Regulamin */}
              <div className="flex items-start gap-3 rounded-md border p-3">
                <Checkbox
                  id="acceptRegulamin"
                  checked={props.form.watch('acceptRegulamin')}
                  aria-invalid={!!errors.acceptRegulamin?.message}
                  aria-describedby={errors.acceptRegulamin?.message ? acceptRegErrId : undefined}
                  onCheckedChange={(v) =>
                    props.form.setValue('acceptRegulamin', Boolean(v), { shouldValidate: true, shouldDirty: true })
                  }
                />

                <div className="grid gap-1">
                  <label htmlFor="acceptRegulamin" className="text-sm leading-relaxed cursor-pointer">
                    Akceptuję <PdfLink href={regulaminHref}>regulamin (PDF)</PdfLink>.
                  </label>

                  <FieldError id={acceptRegErrId} msg={errors.acceptRegulamin?.message as any} />
                </div>
              </div>

              {/* Polityka */}
              <div className="flex items-start gap-3 rounded-md border p-3">
                <Checkbox
                  id="acceptPolityka"
                  checked={props.form.watch('acceptPolityka')}
                  aria-invalid={!!errors.acceptPolityka?.message}
                  aria-describedby={errors.acceptPolityka?.message ? acceptPolErrId : undefined}
                  onCheckedChange={(v) =>
                    props.form.setValue('acceptPolityka', Boolean(v), { shouldValidate: true, shouldDirty: true })
                  }
                />

                <div className="grid gap-1">
                  <label htmlFor="acceptPolityka" className="text-sm leading-relaxed cursor-pointer">
                    Akceptuję <PdfLink href={politykaHref}>politykę prywatności (PDF)</PdfLink>.
                  </label>

                  <FieldError id={acceptPolErrId} msg={errors.acceptPolityka?.message as any} />
                </div>
              </div>
            </div>

            <Button type="submit" className="h-11" disabled={props.isPending}>
              {props.isPending ? 'Zapisywanie…' : `Rezerwuję i płacę (${payableNow.toFixed(2)} zł)`}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
