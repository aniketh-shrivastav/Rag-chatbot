import Link from "next/link";

export default function Page() {
  return (
    <div className="min-h-screen">
      <div className="min-h-screen">
        <header className="border-b border-[rgba(255,255,255,0.06)] bg-[rgb(var(--panel)/0.6)] backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 rounded-2xl bg-[rgb(var(--panel-elevated)/0.9)] shadow-[0_18px_40px_rgba(6,10,20,0.55)]">
                <div className="absolute inset-1 rounded-2xl bg-[radial-gradient(circle_at_top,#22D3EE_0%,#0B0F19_70%)] opacity-80" />
              </div>
              <div>
                <p className="text-xs font-medium text-[rgb(var(--text-secondary))]">
                  Rag chatbot
                </p>
                <h1 className="text-lg font-semibold tracking-tight text-[rgb(var(--text-primary))]">
                  Creator Analytics
                </h1>
              </div>
            </div>
            <nav className="flex items-center gap-3 text-xs">
              <Link
                href="/login"
                className="rounded-2xl border border-[rgba(255,255,255,0.08)] px-4 py-2 text-[rgb(var(--text-secondary))] transition hover:border-[rgba(34,211,238,0.4)] hover:text-[rgb(var(--text-primary))]"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="group relative overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgb(var(--panel-elevated)/0.9)] px-4 py-2 font-semibold text-[rgb(var(--text-primary))] shadow-[0_14px_28px_rgba(5,8,16,0.5)]"
              >
                <span className="relative z-10">Start free</span>
                <span className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[linear-gradient(120deg,rgba(34,211,238,0.9),rgba(139,92,246,0.9))]" />
              </Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-12">
          <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <p className="text-xs uppercase tracking-[0.4em] text-[rgb(var(--text-secondary))]">
                Premium creator insights
              </p>
              <h2 className="text-4xl font-bold tracking-tight text-[rgb(var(--text-primary))] lg:text-5xl">
                Compare two videos, stream the why, and act faster.
              </h2>
              <p className="text-base text-[rgb(var(--text-secondary))]">
                RAG-powered analytics for YouTube and Instagram. Get hook
                breakdowns, engagement deltas, and instant improvement guidance
                in a single workspace.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/signup"
                  className="group relative overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgb(var(--panel-elevated)/0.9)] px-5 py-3 text-xs font-semibold text-[rgb(var(--text-primary))] shadow-[0_16px_32px_rgba(5,8,16,0.55)]"
                >
                  <span className="relative z-10">Launch dashboard</span>
                  <span className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[linear-gradient(120deg,rgba(34,211,238,0.9),rgba(139,92,246,0.9))]" />
                </Link>
                <Link
                  href="/dashboard"
                  className="rounded-2xl border border-[rgba(255,255,255,0.08)] px-5 py-3 text-xs font-semibold text-[rgb(var(--text-secondary))] transition hover:border-[rgba(34,211,238,0.4)] hover:text-[rgb(var(--text-primary))]"
                >
                  View demo
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Avg latency", value: "450ms" },
                  { label: "Hook accuracy", value: "91%" },
                  { label: "Stream uptime", value: "99.9%" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgb(var(--panel)/0.6)] px-4 py-3"
                  >
                    <p className="text-xs text-[rgb(var(--text-secondary))]">
                      {stat.label}
                    </p>
                    <p className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgb(var(--panel)/0.7)] p-6 shadow-[0_24px_50px_rgba(5,8,16,0.6)] backdrop-blur-md">
              <div className="flex items-center justify-between text-xs text-[rgb(var(--text-secondary))]">
                <span>Live comparison preview</span>
                <span className="rounded-2xl border border-[rgba(34,211,238,0.35)] bg-[rgba(34,211,238,0.12)] px-3 py-1 text-[rgb(var(--accent-cyan))]">
                  Streaming
                </span>
              </div>
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(11,15,25,0.6)] p-4">
                  <p className="text-xs text-[rgb(var(--text-secondary))]">
                    Video A
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[rgb(var(--text-primary))]">
                    Hook pacing vs retention curve
                  </p>
                  <div className="mt-3 h-2 rounded-2xl bg-[rgba(255,255,255,0.08)]">
                    <div className="h-2 w-3/4 rounded-2xl bg-[rgb(var(--accent-cyan))]" />
                  </div>
                </div>
                <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(11,15,25,0.6)] p-4">
                  <p className="text-xs text-[rgb(var(--text-secondary))]">
                    Video B
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[rgb(var(--text-primary))]">
                    Engagement delta vs intent
                  </p>
                  <div className="mt-3 h-2 rounded-2xl bg-[rgba(255,255,255,0.08)]">
                    <div className="h-2 w-2/3 rounded-2xl bg-[rgb(var(--accent-purple))]" />
                  </div>
                </div>
                <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(11,15,25,0.6)] p-4 text-xs text-[rgb(var(--text-secondary))]">
                  “Video A maintains curiosity for 6 seconds longer before the
                  CTA appears.”
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            {[
              {
                title: "Dual-source ingestion",
                copy: "Bring YouTube + Instagram into a single inference context.",
              },
              {
                title: "Streaming answers",
                copy: "Watch token-by-token insights with citations you can trust.",
              },
              {
                title: "Actionable deltas",
                copy: "See what to fix first without digging through charts.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgb(var(--panel)/0.6)] p-6"
              >
                <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">
                  {item.copy}
                </p>
              </div>
            ))}
          </section>
        </main>

        <footer className="border-t border-[rgba(255,255,255,0.06)] bg-[rgb(var(--panel)/0.6)]">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 text-xs text-[rgb(var(--text-secondary))]">
            <span>Creator Analytics Dashboard</span>
            <span>Secure by design | Ready for Vercel</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
