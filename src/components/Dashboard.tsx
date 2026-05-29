"use client";

import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  useDashboardStore,
  type VideoPlatform
} from "@/stores/dashboardStore";

const platformOptions: VideoPlatform[] = ["YouTube", "Instagram"];

const statusLabels = {
  idle: "Idle",
  connected: "Connected",
  reconnecting: "Reconnecting"
} as const;

export default function Dashboard() {
  const {
    videos,
    messages,
    input,
    isStreaming,
    status,
    setInput,
    updateVideo,
    addMessage
  } = useDashboardStore();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    addMessage({
      id: `msg-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      })
    });
    setInput("");
  };

  return (
    <div className="min-h-screen">
      <div className="min-h-screen flex flex-col">
        <header className="border-b border-[rgba(255,255,255,0.06)] bg-[rgb(var(--panel)/0.6)] backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="relative h-12 w-12 rounded-2xl bg-[rgb(var(--panel-elevated)/0.9)] shadow-[0_18px_40px_rgba(6,10,20,0.55)]">
                <div className="absolute inset-1 rounded-2xl bg-[radial-gradient(circle_at_top,#22D3EE_0%,#0B0F19_70%)] opacity-80" />
              </div>
              <div>
                <p className="text-xs font-medium text-[rgb(var(--text-secondary))]">
                  Creator Analytics
                </p>
                <h1 className="text-3xl font-bold tracking-tight text-[rgb(var(--text-primary))]">
                  Video Comparison Dashboard
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-[rgb(var(--text-secondary))]">
              <span className="flex h-2 w-2 rounded-2xl bg-[rgb(var(--accent-cyan))] shadow-[0_0_0_6px_rgba(34,211,238,0.18)]" />
              <span>{statusLabels[status]}</span>
            </div>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-6 lg:grid lg:grid-cols-[1.15fr_0.85fr]">
          <section className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-[rgb(var(--text-primary))]">
                  Video Comparison Panel
                </h2>
                <p className="text-sm text-[rgb(var(--text-secondary))]">
                  Align inputs for the model before streaming insights.
                </p>
              </div>
              <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgb(var(--panel)/0.6)] px-4 py-2 text-xs text-[rgb(var(--text-secondary))]">
                {videos.length} inputs
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {videos.map((video, index) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.08 }}
                  className="group relative rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgb(var(--panel-elevated)/0.7)] p-6 shadow-[0_18px_40px_rgba(5,8,16,0.5)] backdrop-blur-md transition-shadow hover:shadow-[0_28px_60px_rgba(5,10,18,0.6)]"
                >
                  <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,rgba(34,211,238,0),rgba(34,211,238,0.8),rgba(139,92,246,0.8),rgba(34,211,238,0))] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold tracking-tight text-[rgb(var(--text-primary))]">
                      {video.label}
                    </h3>
                    <span className="rounded-2xl border border-[rgba(34,211,238,0.35)] bg-[rgba(34,211,238,0.12)] px-3 py-1 text-xs font-semibold text-[rgb(var(--accent-cyan))]">
                      {video.platform}
                    </span>
                  </div>

                  <div className="mt-4 space-y-4">
                    <div>
                      <label
                        htmlFor={`${video.id}-title`}
                        className="text-xs font-medium text-[rgb(var(--text-secondary))]"
                      >
                        Title
                      </label>
                      <input
                        id={`${video.id}-title`}
                        value={video.title}
                        onChange={(event) =>
                          updateVideo(video.id, {
                            title: event.target.value
                          })
                        }
                        className="mt-2 w-full rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgb(var(--panel)/0.65)] px-4 py-2 text-sm text-[rgb(var(--text-primary))] shadow-[0_12px_30px_rgba(5,8,16,0.45)] focus:border-[rgba(34,211,238,0.4)] focus:outline-none focus:ring-2 focus:ring-[rgba(34,211,238,0.2)]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`${video.id}-platform`}
                        className="text-xs font-medium text-[rgb(var(--text-secondary))]"
                      >
                        Platform
                      </label>
                      <select
                        id={`${video.id}-platform`}
                        value={video.platform}
                        onChange={(event) =>
                          updateVideo(video.id, {
                            platform: event.target.value as VideoPlatform
                          })
                        }
                        className="mt-2 w-full rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgb(var(--panel)/0.65)] px-4 py-2 text-sm text-[rgb(var(--text-primary))] shadow-[0_12px_30px_rgba(5,8,16,0.45)] focus:border-[rgba(34,211,238,0.4)] focus:outline-none focus:ring-2 focus:ring-[rgba(34,211,238,0.2)]"
                      >
                        {platformOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor={`${video.id}-url`}
                        className="text-xs font-medium text-[rgb(var(--text-secondary))]"
                      >
                        Video URL
                      </label>
                      <input
                        id={`${video.id}-url`}
                        value={video.url}
                        onChange={(event) =>
                          updateVideo(video.id, {
                            url: event.target.value
                          })
                        }
                        className="mt-2 w-full rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgb(var(--panel)/0.65)] px-4 py-2 text-sm text-[rgb(var(--text-primary))] shadow-[0_12px_30px_rgba(5,8,16,0.45)] focus:border-[rgba(34,211,238,0.4)] focus:outline-none focus:ring-2 focus:ring-[rgba(34,211,238,0.2)]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`${video.id}-notes`}
                        className="text-xs font-medium text-[rgb(var(--text-secondary))]"
                      >
                        Notes
                      </label>
                      <textarea
                        id={`${video.id}-notes`}
                        value={video.notes}
                        onChange={(event) =>
                          updateVideo(video.id, {
                            notes: event.target.value
                          })
                        }
                        rows={3}
                        className="mt-2 w-full resize-none rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgb(var(--panel)/0.65)] px-4 py-2 text-sm text-[rgb(var(--text-primary))] shadow-[0_12px_30px_rgba(5,8,16,0.45)] focus:border-[rgba(34,211,238,0.4)] focus:outline-none focus:ring-2 focus:ring-[rgba(34,211,238,0.2)]"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          <aside className="self-start lg:sticky lg:top-24 lg:h-[calc(100vh-10rem)]">
            <div className="flex h-full flex-col rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgb(var(--panel)/0.7)] shadow-[0_22px_48px_rgba(5,8,16,0.55)] backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] px-6 py-4">
                <div>
                  <p className="text-xs font-medium text-[rgb(var(--text-secondary))]">
                    AI Chat
                  </p>
                  <h3 className="text-lg font-semibold tracking-tight text-[rgb(var(--text-primary))]">
                    Streaming Insights
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-[rgb(var(--text-secondary))]">
                  <span
                    className={`h-2 w-2 rounded-2xl ${
                      isStreaming
                        ? "bg-[rgb(var(--accent-cyan))]"
                        : "bg-[rgba(248,250,252,0.2)]"
                    }`}
                  />
                  <span>{isStreaming ? "Streaming" : "Idle"}</span>
                </div>
              </div>

              <div className="flex-1 space-y-4 overflow-auto px-6 py-4">
                {messages.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[rgba(255,255,255,0.08)] bg-[rgb(var(--panel-elevated)/0.4)] p-4 text-sm text-[rgb(var(--text-secondary))]">
                    Start a comparison to stream insights here.
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`rounded-2xl border px-4 py-3 text-sm shadow-[0_14px_28px_rgba(5,8,16,0.45)] ${
                        message.role === "assistant"
                          ? "border-[rgba(255,255,255,0.06)] bg-[rgb(var(--panel-elevated)/0.6)] text-[rgb(var(--text-primary))]"
                          : "border-[rgba(34,211,238,0.4)] bg-[rgba(34,211,238,0.14)] text-[rgb(var(--text-primary))]"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between text-[11px] text-[rgb(var(--text-secondary))] opacity-80">
                        <span>{message.role}</span>
                        <span>{message.timestamp}</span>
                      </div>
                      <ReactMarkdown className="text-sm leading-relaxed">
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ))
                )}
              </div>

              <form
                onSubmit={handleSubmit}
                className="border-t border-[rgba(255,255,255,0.06)] px-6 py-4"
              >
                <label
                  htmlFor="chat-input"
                  className="text-xs font-medium text-[rgb(var(--text-secondary))]"
                >
                  Prompt
                </label>
                <textarea
                  id="chat-input"
                  rows={3}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask for a hook-by-hook comparison..."
                  className="mt-2 w-full resize-none rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgb(var(--panel)/0.65)] px-4 py-2 text-sm text-[rgb(var(--text-primary))] shadow-[0_12px_30px_rgba(5,8,16,0.45)] focus:border-[rgba(34,211,238,0.4)] focus:outline-none focus:ring-2 focus:ring-[rgba(34,211,238,0.2)]"
                />
                <div className="mt-4 flex items-center justify-between text-xs text-[rgb(var(--text-secondary))]">
                  <span>Shift + Enter for a new line</span>
                  <button
                    type="submit"
                    className="group relative overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgb(var(--panel-elevated)/0.9)] px-4 py-2 text-xs font-semibold text-[rgb(var(--text-primary))] shadow-[0_14px_28px_rgba(5,8,16,0.5)] transition"
                  >
                    <span className="relative z-10">Send</span>
                    <span className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[linear-gradient(120deg,rgba(34,211,238,0.9),rgba(139,92,246,0.9))]" />
                  </button>
                </div>
              </form>
            </div>
          </aside>
        </main>

        <footer className="border-t border-[rgba(255,255,255,0.06)] bg-[rgb(var(--panel)/0.6)]">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 text-xs text-[rgb(var(--text-secondary))]">
            <span>Transport ready for SSE or WebSocket streams.</span>
            <span>Status: {statusLabels[status]}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
