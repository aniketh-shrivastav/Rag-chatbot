import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen">
      <div className="min-h-screen">
        <header className="border-b border-[rgba(255,255,255,0.06)] bg-[rgb(var(--panel)/0.6)] backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
            <Link
              href="/"
              className="text-sm text-[rgb(var(--text-secondary))]"
            >
              Back to home
            </Link>
            <Link
              href="/signup"
              className="rounded-2xl border border-[rgba(255,255,255,0.08)] px-4 py-2 text-xs text-[rgb(var(--text-secondary))] transition hover:border-[rgba(34,211,238,0.4)] hover:text-[rgb(var(--text-primary))]"
            >
              Create account
            </Link>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-16">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[rgb(var(--text-primary))]">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">
              Log in to continue your creator comparisons.
            </p>
          </div>

          <form className="space-y-4 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgb(var(--panel)/0.7)] p-6 shadow-[0_20px_46px_rgba(5,8,16,0.55)] backdrop-blur-md">
            <div>
              <label
                htmlFor="email"
                className="text-xs font-medium text-[rgb(var(--text-secondary))]"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@studio.com"
                className="mt-2 w-full rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgb(var(--panel)/0.65)] px-4 py-2 text-sm text-[rgb(var(--text-primary))] shadow-[0_12px_30px_rgba(5,8,16,0.45)] focus:border-[rgba(34,211,238,0.4)] focus:outline-none focus:ring-2 focus:ring-[rgba(34,211,238,0.2)]"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="text-xs font-medium text-[rgb(var(--text-secondary))]"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                className="mt-2 w-full rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgb(var(--panel)/0.65)] px-4 py-2 text-sm text-[rgb(var(--text-primary))] shadow-[0_12px_30px_rgba(5,8,16,0.45)] focus:border-[rgba(34,211,238,0.4)] focus:outline-none focus:ring-2 focus:ring-[rgba(34,211,238,0.2)]"
              />
            </div>
            <button
              type="submit"
              className="group relative w-full overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgb(var(--panel-elevated)/0.9)] px-4 py-3 text-xs font-semibold text-[rgb(var(--text-primary))] shadow-[0_16px_32px_rgba(5,8,16,0.55)]"
            >
              <span className="relative z-10">Log in</span>
              <span className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[linear-gradient(120deg,rgba(34,211,238,0.9),rgba(139,92,246,0.9))]" />
            </button>
          </form>

          <p className="text-xs text-[rgb(var(--text-secondary))]">
            New here?{" "}
            <Link href="/signup" className="text-[rgb(var(--accent-cyan))]">
              Create an account
            </Link>
            .
          </p>
        </main>
      </div>
    </div>
  );
}
