"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { type ComponentProps, type MouseEvent, useTransition } from "react"

type TransitionLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string
}

export function TransitionLink({ children, href, onClick, ...props }: TransitionLinkProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event)
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return
    }

    event.preventDefault()
    startTransition(() => router.push(href))
  }

  return (
    <Link
      href={href}
      {...props}
      onClick={handleClick}
      aria-busy={isPending || undefined}
      style={{ ...props.style, opacity: isPending ? 0.6 : props.style?.opacity }}
    >
      {children}
      {isPending ? (
        <span className="ml-2 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
      ) : null}
    </Link>
  )
}