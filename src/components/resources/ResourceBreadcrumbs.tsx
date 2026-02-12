// src/components/resources/ResourceBreadcrumbs.tsx
import Link from 'next/link'

export function ResourceBreadcrumbs(props: { resourceName: string }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-2 text-sm">
        <li>
          <Link href="/" className="underline underline-offset-4">
            Strona główna
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li>
          <Link href="/oferta" className="underline underline-offset-4">
            Oferta
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li aria-current="page" className="font-medium">
          {props.resourceName}
        </li>
      </ol>
    </nav>
  )
}
