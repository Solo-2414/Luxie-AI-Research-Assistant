"use client"

import Link from "next/link"
import { LogIn, Sparkles, X } from "lucide-react"

interface AuthModalProps {
  open: boolean
  message?: string
  onClose: () => void
}

export function AuthModal({ open, message, onClose }: AuthModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
      <div className="luxcie-pop relative max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <button type="button" onClick={onClose} aria-label="Close dialog" className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </div>
        <h2 id="auth-modal-title" className="mt-4 text-lg font-semibold text-slate-900">Keep researching with Luxcie AI</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{message ?? "Sign in or create a free account to unlock unlimited research and exports."}</p>
        <div className="mt-5 flex gap-3">
          <Link href="/auth" className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700">
            <LogIn className="h-4 w-4" aria-hidden="true" /> Log In
          </Link>
          <Link href="/auth?mode=signup" className="flex flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  )
}
