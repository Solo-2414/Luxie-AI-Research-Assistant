'use client'

import Script from 'next/script'
import { MessageCircle } from 'lucide-react'

export function FeedbackButton() {
  return (
    <>
      <Script src="https://tally.so/widgets/embed.js" strategy="lazyOnload" />
      <button
        type="button"
        data-tally-open="kdLYYR"
        data-tally-layout="modal"
        data-tally-emoji-text="💡"
        aria-label="Share feedback"
        title="Share feedback"
        className="feedback-button group fixed right-3 bottom-[calc(max(1rem,env(safe-area-inset-bottom))+3.5rem)] z-50 inline-flex min-h-12 min-w-12 max-w-[calc(100vw-1.5rem)] items-center justify-center gap-2 rounded-full border border-white/70 bg-white/90 px-2.5 py-2.5 text-sm font-semibold text-slate-700 shadow-[0_10px_30px_rgb(15_23_42/0.14)] backdrop-blur-md transition-[background-color,border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-white hover:text-indigo-700 hover:shadow-[0_14px_34px_rgb(79_70_229/0.2)] focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none active:translate-y-0 active:scale-95 sm:right-5 sm:gap-2.5 sm:px-3.5"
      >
        <span aria-hidden="true" className="feedback-button-icon relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 transition-transform duration-200 group-hover:scale-105 group-hover:bg-indigo-100">
          <MessageCircle className="h-4 w-4" strokeWidth={2.2} />
          <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400 ring-2 ring-indigo-50" />
        </span>
        <span className="hidden pr-0.5 sm:inline">Share feedback</span>
      </button>
    </>
  )
}