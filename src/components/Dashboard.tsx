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
        <header className="border-b border-slate-200/70 bg-white/70 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-teal-500 via-cyan-500 to-sky-500 shadow-lg shadow-teal-200/60" />
              <div>
                <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">
                  Creator Analytics
                </p>
                <h1 className="text-lg font-semibold text-slate-900">
                  Video Comparison Dashboard
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex h-2 w-2 rounded-full bg-teal-500 shadow-[0_0_0_4px_rgba(20,184,166,0.15)]" />
              <span className="uppercase tracking-[0.25em]">
                {statusLabels[status]}
              </span>
            </div>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-6 lg:grid lg:grid-cols-[1.15fr_0.85fr]">
          <section className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Video Comparison Panel
                </h2>
                <p className="text-sm text-slate-500">
                  Align inputs for the model before streaming insights.
                </p>
              </div>
              <div className="rounded-full border border-slate-200/80 bg-white/70 px-4 py-1 text-xs uppercase tracking-[0.3em] text-slate-500">
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
                  className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-slate-900">
                      {video.label}
                    </h3>
                    <span className="rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-teal-700">
                      {video.platform}
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div>
                      <label
                        htmlFor={`${video.id}-title`}
                        className="text-[11px] uppercase tracking-[0.28em] text-slate-400"
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
                        className="mt-2 w-full rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`${video.id}-platform`}
                        className="text-[11px] uppercase tracking-[0.28em] text-slate-400"
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
                        className="mt-2 w-full rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
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
                        className="text-[11px] uppercase tracking-[0.28em] text-slate-400"
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
                        className="mt-2 w-full rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`${video.id}-notes`}
                        className="text-[11px] uppercase tracking-[0.28em] text-slate-400"
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
                        className="mt-2 w-full resize-none rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          <aside className="self-start lg:sticky lg:top-24 lg:h-[calc(100vh-10rem)]">
            <div className="flex h-full flex-col rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur">
              <div className="flex items-center justify-between border-b border-slate-200/70 px-5 py-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.32em] text-slate-400">
                    AI Chat
                  </p>
                  <h3 className="text-base font-semibold text-slate-900">
                    Streaming Insights
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isStreaming ? "bg-teal-500" : "bg-slate-300"
                    }`}
                  />
                  <span className="uppercase tracking-[0.2em]">
                    {isStreaming ? "Streaming" : "Idle"}
                  </span>
                </div>
              </div>

              <div className="flex-1 space-y-4 overflow-auto px-5 py-4">
                {messages.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-white/70 p-4 text-sm text-slate-500">
                    Start a comparison to stream insights here.
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`rounded-2xl border px-4 py-3 text-sm shadow-sm ${
                        message.role === "assistant"
                          ? "border-slate-200/70 bg-white"
                          : "border-teal-200/70 bg-teal-600 text-white"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.3em] opacity-70">
                        <span>{message.role}</span>
                        <span>{message.timestamp}</span>
                      </div>
                      <ReactMarkdown className="leading-relaxed">
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ))
                )}
              </div>

              <form
                onSubmit={handleSubmit}
                className="border-t border-slate-200/70 px-5 py-4"
              >
                <label
                  htmlFor="chat-input"
                  className="text-[11px] uppercase tracking-[0.3em] text-slate-400"
                >
                  Prompt
                </label>
                <textarea
                  id="chat-input"
                  rows={3}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask for a hook-by-hook comparison..."
                  className="mt-2 w-full resize-none rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
                />
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>Shift + Enter for a new line</span>
                  <button
                    type="submit"
                    className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-sm transition hover:bg-slate-800"
                  >
                    Send
                  </button>
                </div>
              </form>
            </div>
          </aside>
        </main>

        <footer className="border-t border-slate-200/70 bg-white/70">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3 text-xs text-slate-500">
            <span>Transport ready for SSE or WebSocket streams.</span>
            <span>Status: {statusLabels[status]}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
