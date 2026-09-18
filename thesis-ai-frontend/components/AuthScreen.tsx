"use client"

import { type FormEvent, type ReactNode, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Eye, EyeOff, Loader2, Search, Sparkles } from "lucide-react"
import { TransitionLink } from "@/components/TransitionLink"
import { useAuth } from "@/context/AuthContext"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

type AuthMode = "login" | "signup"

function GoogleMark() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true"><path fill="#4285F4" d="M21.35 12.27c0-.74-.07-1.45-.2-2.13H12v4.03h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.29Z" /><path fill="#34A853" d="M12 21.88c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.88Z" /><path fill="#FBBC05" d="M6.54 13.96A5.86 5.86 0 0 1 6.23 12c0-.68.12-1.34.31-1.96V7.51H3.3A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.05 4.49l3.24-2.53Z" /><path fill="#EA4335" d="M12 6.01c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.84 3.1 14.63 2.12 12 2.12a9.74 9.74 0 0 0-8.7 5.39l3.24 2.53C7.31 7.73 9.46 6.01 12 6.01Z" /></svg>
}

function GithubMark() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true"><path d="M12 .3a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.25c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.74.08-.74 1.2.08 1.84 1.23 1.84 1.23 1.07 1.83 2.8 1.3 3.48.99.11-.77.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.23-3.22-.12-.3-.53-1.52.12-3.17 0 0 1-.32 3.3 1.23a11.48 11.48 0 0 1 6 0c2.3-1.55 3.3-1.23 3.3-1.23.65 1.65.24 2.87.12 3.17.77.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.62-5.49 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.57A12 12 0 0 0 12 .3Z" /></svg>
}

interface AuthScreenProps {
  mode: AuthMode
}

interface FloatingFieldProps {
  id: string
  label: string
  type: string
  value: string
  autoComplete: string
  onChange: (value: string) => void
  required?: boolean
  minLength?: number
  trailing?: ReactNode
}

function FloatingField({ id, label, type, value, autoComplete, onChange, required, minLength, trailing }: FloatingFieldProps) {
  const [focused, setFocused] = useState(false)

  return (
    <div className="relative">
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required={required}
        minLength={minLength}
        aria-label={label}
        className={`w-full rounded-xl border bg-white px-3.5 pb-2.5 pt-6 text-sm text-slate-900 outline-none transition duration-200 ${trailing ? "pr-12" : ""} ${focused ? "border-indigo-500 ring-2 ring-indigo-500/30" : "border-slate-200"}`}
      />
      <label htmlFor={id} className={`pointer-events-none absolute left-3.5 top-2.5 text-[0.7rem] leading-4 text-slate-400 transition-colors duration-200 ${focused ? "text-indigo-600" : ""}`}>
        {label}
      </label>
      {trailing}
    </div>
  )
}

export function AuthScreen({ mode }: AuthScreenProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()
  const { login } = useAuth()
  const isSignup = mode === "signup"

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage(null)
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/${isSignup ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(isSignup ? { email, password, full_name: name } : { email, password }),
      })
      const body = (await response.json().catch(() => null)) as { detail?: string } | null
      if (!response.ok) throw new Error(typeof body?.detail === "string" ? body.detail : "Unable to authenticate")
      await login()
      router.push("/research")
    } catch (requestError) {
      setMessage(requestError instanceof TypeError ? `Unable to reach the API at ${API_BASE_URL}.` : requestError instanceof Error ? requestError.message : "Unable to authenticate")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-screen bg-slate-50 text-slate-900 md:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-10 text-white md:flex md:flex-col md:justify-between lg:p-14">
        <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(148,163,184,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.16)_1px,transparent_1px)] [background-size:48px_48px]" aria-hidden="true" />
        <div className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-indigo-500/25 blur-3xl" aria-hidden="true" />
        <div className="relative">
          <TransitionLink href="/landing" className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-950"><Sparkles className="h-4 w-4" aria-hidden="true" /></span>Luxcie AI</TransitionLink>
        </div>
        <div className="relative max-w-lg py-16">
          <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-indigo-200"><Search className="h-5 w-5" aria-hidden="true" /></div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">Your research, accelerated</p>
          <blockquote className="mt-5 text-3xl font-medium leading-tight tracking-[-0.03em] text-white lg:text-4xl">“The fastest route from a research question to a defensible first draft.”</blockquote>
          <p className="mt-6 max-w-sm text-sm leading-6 text-slate-300">Search broadly, synthesize with source-grounded AI, and keep every citation within reach.</p>
        </div>
        <div className="relative flex items-center gap-2 text-xs text-slate-400"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" aria-hidden="true" /> Built for careful researchers</div>
      </aside>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-14">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-between md:hidden"><TransitionLink href="/landing" className="flex items-center gap-2 text-sm font-semibold"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white"><Sparkles className="h-4 w-4" aria-hidden="true" /></span>Luxcie AI</TransitionLink><TransitionLink href="/landing" className="text-xs font-medium text-slate-500">Back home</TransitionLink></div>
          <div className="mb-8"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">{isSignup ? "Begin your research practice" : "Welcome back"}</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950">{isSignup ? "Create your account" : "Sign in to Luxcie AI"}</h1><p className="mt-2 text-sm leading-6 text-slate-500">{isSignup ? "Build better literature reviews with evidence you can verify." : "Pick up your research workflow where you left off."}</p></div>

          <div className="grid grid-cols-2 gap-3"><button type="button" onClick={() => setMessage("Google sign in is not configured yet. Use email to continue.")} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"><GoogleMark /> Google</button><button type="button" onClick={() => setMessage("GitHub sign in is not configured yet. Use email to continue.")} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"><GithubMark /> GitHub</button></div>
          <div className="my-7 flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200" />Or continue with email<span className="h-px flex-1 bg-slate-200" /></div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup ? <FloatingField id="name" label="Full name" type="text" autoComplete="name" value={name} onChange={setName} required /> : null}
            <FloatingField id="email" label="Email address" type="email" autoComplete="email" value={email} onChange={setEmail} required />
            <FloatingField
              id="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              autoComplete={isSignup ? "new-password" : "current-password"}
              value={password}
              onChange={setPassword}
              required
              minLength={8}
              trailing={<button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">{showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}</button>}
            />
            {message ? <p role="status" className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2.5 text-xs leading-5 text-indigo-700">{message}</p> : null}
            <button type="submit" disabled={submitting} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">{submitting ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />{isSignup ? "Creating account..." : "Signing in..."}</> : isSignup ? "Create account" : "Sign in"}</button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-500">{isSignup ? "Already have an account?" : "New to Luxcie AI?"} <TransitionLink href={isSignup ? "/login" : "/signup"} className="font-semibold text-indigo-600 hover:text-indigo-700">{isSignup ? "Sign in" : "Create an account"}</TransitionLink></p>
          <TransitionLink href="/landing" className="mt-8 flex items-center justify-center gap-1.5 text-xs font-medium text-slate-400 transition hover:text-slate-700"><ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Back to home</TransitionLink>
        </div>
      </section>
    </main>
  )
}
