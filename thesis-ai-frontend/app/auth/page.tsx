"use client"

import { TransitionLink } from "@/components/TransitionLink"
import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Eye, EyeOff, Sparkles } from "lucide-react"
import { useAuth } from "@/context/AuthContext"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export default function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage(null)
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/${mode === "signin" ? "login" : "register"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "signin" ? { email, password } : { email, password, full_name: name }),
      })
      const body = (await response.json().catch(() => null)) as { access_token?: string; detail?: string } | null
      if (!response.ok || !body?.access_token) {
        throw new Error(typeof body?.detail === "string" ? body.detail : "Unable to authenticate")
      }
      await login(body.access_token)
      router.push("/research")
    } catch (requestError) {
      setMessage(
        requestError instanceof TypeError
          ? `Unable to reach the API at ${API_BASE_URL}. Make sure the backend is running.`
          : requestError instanceof Error
            ? requestError.message
            : "Unable to authenticate",
      )
    } finally {
      setSubmitting(false)
    }
  }

  function switchMode(nextMode: "signin" | "signup") {
    setMode(nextMode)
    setMessage(null)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 sm:py-12">
      <div className="luxcie-fade-up w-full max-w-md">
        <TransitionLink href="/landing" className="mb-8 flex items-center justify-center gap-2 text-sm font-semibold tracking-tight text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </span>
          Luxcie AI
        </TransitionLink>

        <section className="luxcie-pop rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {mode === "signin" ? "Welcome back" : "Create an account"}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {mode === "signin" ? "Sign in to continue your research." : "Start building better literature reviews."}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 rounded-xl bg-slate-50 p-1">
            <button type="button" onClick={() => switchMode("signin")} className={`min-h-11 rounded-lg px-3 py-2 text-sm font-medium transition ${mode === "signin" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}>
              Sign In
            </button>
            <button type="button" onClick={() => switchMode("signup")} className={`min-h-11 rounded-lg px-3 py-2 text-sm font-medium transition ${mode === "signup" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}>
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "signup" ? (
              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-600">Name</label>
                <input id="name" name="name" type="text" autoComplete="name" placeholder="Your name" value={name} onChange={(event) => setName(event.target.value)} required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
              </div>
            ) : null}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-600">Email</label>
              <input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-600">Password</label>
              <div className="relative">
                <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete={mode === "signin" ? "current-password" : "new-password"} placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 pr-11 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 flex min-h-10 min-w-10 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:text-slate-600">
                  {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={submitting} className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
            </button>
          </form>

          {message ? <p role="status" className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2.5 text-center text-xs leading-5 text-indigo-700">{message}</p> : null}

          <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            or continue with
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <button type="button" onClick={() => setMessage("Google sign in is ready to connect to your account service.")} className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
            <span className="font-bold text-slate-900" aria-hidden="true">G</span>
            Continue with Google
          </button>
        </section>

        <TransitionLink href="/landing" className="mt-6 flex items-center justify-center gap-1.5 text-sm text-slate-500 transition hover:text-indigo-600">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to home
        </TransitionLink>
      </div>
    </main>
  )
}
