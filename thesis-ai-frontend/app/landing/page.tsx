"use client"

import Link from "next/link"
import { useAuth } from "@/context/AuthContext"
import { ArrowRight, BookOpen, Database, Download, Filter, Sparkles } from "lucide-react"

const features = [
  {
    icon: Database,
    title: "Dual-Database Search",
    description: "Search OpenAlex and arXiv together to build a broader, more reliable evidence base.",
  },
  {
    icon: Filter,
    title: "5-Year Recency Filter",
    description: "Prioritize current research while automatically surfacing foundational studies when needed.",
  },
  {
    icon: Download,
    title: "1-Click Export",
    description: "Copy citations, download Markdown, or print your review as a polished PDF.",
  },
]

export default function LandingPage() {
  const { user, logout } = useAuth()

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="luxcie-fade-in border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight text-slate-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </span>
            Luxcie AI
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link href="/research" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700">
                  Go to Workspace
                </Link>
                <button type="button" onClick={logout} className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-600">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/auth" className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-600">
                  Sign In
                </Link>
                <Link href="/auth" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-6 pb-20 pt-24 text-center lg:px-8 lg:pb-28 lg:pt-32">
        <div className="luxcie-fade-up mx-auto flex max-w-3xl flex-col items-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600">
            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" /> Research with clarity
          </div>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl sm:leading-[1.08]">
            Your AI-Powered Thesis Assistant
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Accelerate literature reviews with focused synthesis from dual-sourced open-access databases, built for the way researchers actually work.
          </p>
          <Link href="/auth" className="mt-9 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
            Start researching
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {features.map(({ icon: Icon, title, description }, index) => (
            <article key={title} style={{ animationDelay: `${index * 100}ms` }} className="luxcie-fade-up rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 className="mt-5 text-base font-semibold text-slate-900">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="luxcie-fade-in border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 py-8 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            Luxcie AI
          </Link>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
            <Link href="/auth" className="transition hover:text-indigo-600">Sign in</Link>
            <Link href="/auth" className="transition hover:text-indigo-600">Get started</Link>
            <span className="text-slate-300" aria-hidden="true">|</span>
            <span>© {new Date().getFullYear()} Luxcie AI</span>
          </div>
        </div>
      </footer>
    </main>
  )
}
