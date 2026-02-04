// src/components/trailers/TrailerBreadcrumbs.tsx
import Link from 'next/link'

export function TrailerBreadcrumbs(props: { trailerName: string }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-2 text-sm">
        <li>
          <Link href="/" className="underline underline-offset-4">
            Home
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li>
          <Link href="/przyczepy" className="underline underline-offset-4">
            Przyczepy
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li aria-current="page" className="font-medium">
          {props.trailerName}
        </li>
      </ol>
    </nav>
  )
}
