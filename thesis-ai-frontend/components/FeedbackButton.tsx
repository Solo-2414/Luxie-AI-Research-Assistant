'use client'

import Script from 'next/script'

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
        className="feedback-button group fixed right-3 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 inline-flex min-h-11 min-w-11 max-w-[calc(100vw-1.5rem)] items-center justify-center gap-2 rounded-full bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-950/20 transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-950/25 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none active:translate-y-0 active:scale-95 sm:right-5 sm:px-4"
      >
        <span aria-hidden="true" className="text-base leading-none transition-transform duration-200 group-hover:rotate-[-8deg] group-hover:scale-110">
          💡
        </span>
        <span className="hidden sm:inline">Feedback</span>
      </button>
    </>
  )
}