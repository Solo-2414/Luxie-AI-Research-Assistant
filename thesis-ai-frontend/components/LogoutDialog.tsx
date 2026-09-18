"use client"

import { Loader2, LogOut, X } from "lucide-react"

interface LogoutDialogProps {
  open: boolean
  loading: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function LogoutDialog({ open, loading, onCancel, onConfirm }: LogoutDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="logout-dialog-title">
      <div className="luxcie-pop relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <button type="button" onClick={onCancel} disabled={loading} aria-label="Close logout confirmation" className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600"><LogOut className="h-5 w-5" aria-hidden="true" /></div>
        <h2 id="logout-dialog-title" className="mt-5 text-lg font-semibold text-slate-950">Log out of Luxcie AI?</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">Are you sure you want to log out?</p>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onCancel} disabled={loading} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">Cancel</button>
          <button type="button" onClick={onConfirm} disabled={loading} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Logging out...</> : "Logout"}
          </button>
        </div>
      </div>
    </div>
  )
}
