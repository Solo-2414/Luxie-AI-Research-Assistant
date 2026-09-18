'use client'

import Script from 'next/script'

export function FeedbackButton() {
  return (
    <>
      <Script src="https://tally.so/widgets/embed.js" strategy="lazyOnload" />
      <button
        type="button"
        data-tally-open="YOUR_FORM_ID"
        data-tally-layout="modal"
        data-tally-emoji-text="💡"
        className="fixed right-4 bottom-4 z-50 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <span aria-hidden="true">💡</span>
        Feedback
      </button>
    </>
  )
}