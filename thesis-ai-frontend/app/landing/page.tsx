"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { TransitionLink } from "@/components/TransitionLink"
import { useAuth } from "@/context/AuthContext"
import { LogoutDialog } from "@/components/LogoutDialog"
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleDashed,
  Database,
  Download,
  FileCheck2,
  Search,
  Sparkles,
  Waypoints,
} from "lucide-react"

const sampleQueries = ["Climate Anxiety", "Gen Z Mental Health", "Urban Heat Islands"]

const features = [
  { icon: Database, number: "01", title: "Multi-source search", description: "One query across OpenAlex, arXiv, and Semantic Scholar, deduplicated into one evidence base.", className: "md:col-span-2", accent: "bg-amber-100 text-amber-800" },
  { icon: Sparkles, number: "02", title: "AI literature review", description: "Grounded synthesis with every claim connected to a source paper.", className: "md:col-span-1", accent: "bg-cyan-100 text-cyan-800" },
  { icon: Waypoints, number: "03", title: "Citation explorer", description: "Follow forward and backward citations to understand how a field moves.", className: "md:col-span-1", accent: "bg-rose-100 text-rose-800" },
  { icon: Download, number: "04", title: "One-click export", description: "Copy APA, MLA, or BibTeX citations when your notes are ready to become a draft.", className: "md:col-span-2", accent: "bg-lime-100 text-lime-800" },
]

export default function LandingPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [selectedQuery, setSelectedQuery] = useState<string | null>(null)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  function confirmLogout() {
    setLoggingOut(true)
    logout()
    setLogoutOpen(false)
    setToast("Successfully logged out")
    window.setTimeout(() => router.push("/login"), 700)
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f5f0] text-[#14211f]">
      <nav className="border-b border-[#14211f]/10 bg-[#f5f5f0]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
          <TransitionLink href="/" className="flex items-center gap-2.5 text-sm font-bold tracking-tight text-[#14211f]"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#14211f] text-[#f5f5f0]"><Sparkles className="h-4 w-4" aria-hidden="true" /></span>Luxcie AI</TransitionLink>
          <div className="flex items-center gap-1.5 sm:gap-4">
            <a href="#features" className="hidden text-sm font-medium text-[#14211f]/60 transition hover:text-[#14211f] sm:inline">Capabilities</a>
            {user ? <><TransitionLink href="/research" className="rounded-full bg-[#14211f] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#263c38] sm:text-sm">Open workspace</TransitionLink><button type="button" onClick={() => setLogoutOpen(true)} className="hidden px-2 py-2 text-sm font-medium text-[#14211f]/60 transition hover:text-[#14211f] sm:inline">Logout</button></> : <><TransitionLink href="/login" className="px-2 py-2 text-xs font-medium text-[#14211f]/60 transition hover:text-[#14211f] sm:text-sm">Sign in</TransitionLink><TransitionLink href="/signup" className="rounded-full bg-[#14211f] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#263c38] sm:text-sm">Get started</TransitionLink></>}
          </div>
        </div>
      </nav>

      <section className="relative mx-auto max-w-7xl px-5 pb-20 pt-16 sm:px-8 sm:pt-24 lg:px-10 lg:pb-28 lg:pt-32">
        <div className="pointer-events-none absolute -right-40 top-10 h-96 w-96 rounded-full bg-[#dbe9e4] blur-3xl" aria-hidden="true" />
        <div className="relative grid items-end gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          <div className="luxcie-fade-up">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#14211f]/15 bg-white/60 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#14211f]/65"><CircleDashed className="h-3.5 w-3.5 text-[#d7794a]" aria-hidden="true" />Research, with receipts</div>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[0.98] tracking-[-0.045em] text-[#14211f] sm:text-7xl lg:text-[5.8rem]">Literature Reviews, <span className="text-[#4d7770]">Synthesized</span> in Seconds.</h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-[#14211f]/65 sm:text-lg">Search 200M+ academic papers across OpenAlex, arXiv, and Semantic Scholar with 0% hallucinated citations.</p>
            <div className="mt-9 flex flex-wrap items-center gap-4"><TransitionLink href="/research" className="inline-flex items-center gap-2 rounded-full bg-[#d7794a] px-5 py-3.5 text-sm font-bold text-white shadow-[0_8px_24px_rgb(215_121_74/0.22)] transition hover:-translate-y-0.5 hover:bg-[#c8663a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7794a] focus-visible:ring-offset-2">Get Started for Free<ArrowRight className="h-4 w-4" aria-hidden="true" /></TransitionLink><span className="text-xs font-medium text-[#14211f]/45">No credit card required</span></div>
          </div>

          <div className="luxcie-fade-up lg:pb-2" style={{ animationDelay: "120ms" }}>
            <div className="overflow-hidden rounded-2xl border border-[#14211f]/15 bg-[#14211f] p-3 shadow-[0_24px_70px_rgb(20_33_31/0.18)] sm:p-4">
              <div className="flex items-center gap-2 border-b border-white/10 px-2 pb-3 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white/45"><Search className="h-3.5 w-3.5" aria-hidden="true" />Start a research thread</div>
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-white px-3 py-2"><Search className="h-4 w-4 shrink-0 text-[#4d7770]" aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="What are you investigating?" className="min-w-0 flex-1 bg-transparent text-sm text-[#14211f] outline-none placeholder:text-[#14211f]/35" aria-label="Research topic preview" /><TransitionLink href="/research" className="rounded-lg bg-[#d7794a] p-2 text-white transition hover:bg-[#c8663a]" aria-label="Open research workspace"><ArrowRight className="h-4 w-4" aria-hidden="true" /></TransitionLink></div>
              <div className="mt-3 flex flex-wrap gap-2">{sampleQueries.map((sample) => <button key={sample} type="button" onClick={() => { setQuery(sample); setSelectedQuery(sample) }} className={`rounded-full border px-3 py-1.5 text-xs transition ${selectedQuery === sample ? "border-[#d7794a] bg-[#d7794a]/15 text-[#ffd2bd]" : "border-white/15 text-white/60 hover:border-white/35 hover:text-white"}`}>{sample}</button>)}</div>
              <div className="mt-7 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-white/45"><span className="flex items-center gap-1.5"><FileCheck2 className="h-3.5 w-3.5 text-[#9ac7b9]" aria-hidden="true" />Source-grounded results</span><span>~12 sec average</span></div>
            </div>
            <p className="mt-3 text-center text-xs text-[#14211f]/40">Try a topic above, then refine it inside your workspace.</p>
          </div>
        </div>
      </section>

      <section className="border-y border-[#14211f]/10 bg-white/45" aria-label="Luxcie AI statistics"><div className="mx-auto grid max-w-7xl divide-y divide-[#14211f]/10 px-5 py-7 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-8 lg:px-10">{[{ value: "200M+", label: "Papers indexed" }, { value: "3", label: "Top databases" }, { value: "100%", label: "Verifiable citations" }].map((stat) => <div key={stat.label} className="flex items-baseline justify-between gap-4 px-2 py-3 first:pt-0 last:pb-0 sm:block sm:px-8 sm:py-2 sm:first:pl-0 sm:last:pr-0"><span className="text-3xl font-semibold tracking-[-0.04em] text-[#14211f]">{stat.value}</span><span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#14211f]/45">{stat.label}</span></div>)}</div></section>

      <section id="features" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28"><div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d7794a]">Built for the literature review</p><h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-[-0.035em] text-[#14211f] sm:text-4xl">A research workflow that keeps the evidence visible.</h2></div><p className="max-w-xs text-sm leading-6 text-[#14211f]/55">Move from a blank page to a defensible research map without losing the thread.</p></div><div className="grid gap-4 md:grid-cols-3">{features.map(({ icon: Icon, number, title, description, className, accent }, index) => <article key={title} style={{ animationDelay: `${index * 80}ms` }} className={`luxcie-fade-up group relative min-h-56 overflow-hidden rounded-2xl border border-[#14211f]/12 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-[#4d7770]/45 hover:shadow-[0_18px_38px_rgb(20_33_31/0.08)] ${className}`}><div className="flex items-start justify-between"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}><Icon className="h-5 w-5" aria-hidden="true" /></span><span className="font-mono text-xs text-[#14211f]/30">{number}</span></div><h3 className="mt-10 text-xl font-semibold tracking-[-0.02em] text-[#14211f]">{title}</h3><p className="mt-2 max-w-md text-sm leading-6 text-[#14211f]/55">{description}</p><ChevronRight className="absolute bottom-6 right-6 h-4 w-4 text-[#14211f]/25 transition group-hover:translate-x-1 group-hover:text-[#d7794a]" aria-hidden="true" /></article>)}</div></section>

      <footer className="bg-[#14211f] text-white"><div className="mx-auto flex max-w-7xl flex-col gap-12 px-5 py-12 sm:px-8 lg:px-10 lg:py-16"><div className="flex flex-col justify-between gap-8 sm:flex-row"><div className="max-w-xs"><TransitionLink href="/" className="flex items-center gap-2 text-sm font-bold"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#14211f]"><Sparkles className="h-4 w-4" aria-hidden="true" /></span>Luxcie AI</TransitionLink><p className="mt-4 text-sm leading-6 text-white/50">A clearer way to search, synthesize, and cite academic research.</p></div><div className="grid grid-cols-2 gap-x-16 gap-y-3 text-sm text-white/60"><TransitionLink href="/research" className="transition hover:text-white">Workspace</TransitionLink><a href="#features" className="transition hover:text-white">Capabilities</a><TransitionLink href="/login" className="transition hover:text-white">Sign in</TransitionLink><TransitionLink href="/signup" className="transition hover:text-white">Get started</TransitionLink></div></div><div className="flex flex-col justify-between gap-3 border-t border-white/10 pt-5 text-xs text-white/35 sm:flex-row"><span>© {new Date().getFullYear()} Luxcie AI</span><span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#9ac7b9]" aria-hidden="true" />Built for careful researchers - if you see this, wala lang</span></div></div></footer>
      {toast ? <div role="status" className="fixed bottom-5 left-1/2 z-[70] -translate-x-1/2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-xl">{toast}</div> : null}
      <LogoutDialog open={logoutOpen} loading={loggingOut} onCancel={() => setLogoutOpen(false)} onConfirm={confirmLogout} />
    </main>
  )
}
