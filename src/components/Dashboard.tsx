"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { useDashboardStore } from "@/stores/dashboardStore";
import VideoCard from "@/components/VideoCard";

const statusLabels = {
  idle: "Idle",
  connected: "Connected",
  reconnecting: "Reconnecting",
} as const;

const analysisSteps = [
  { key: "transcript", label: "Fetching transcript..." },
  { key: "metadata", label: "Fetching metadata..." },
  { key: "embeddings", label: "Generating embeddings..." },
  { key: "vector", label: "Storing in vector DB..." },
  { key: "ready", label: "Ready for chat" },
];

const promptSuggestions = [
  "Why did Video A outperform Video B?",
  "Compare hooks.",
  "Suggest improvements.",
  "Compare engagement rates.",
];

const markdownComponents: Components = {
  code({
    inline,
    className,
    children,
  }: {
    inline?: boolean;
    className?: string;
    children?: ReactNode;
  }) {
    if (inline) {
      return (
        <code className="rounded-2xl bg-[rgba(255,255,255,0.08)] px-2 py-1 text-[0.85em] text-[rgb(var(--text-primary))]">
          {children ?? ""}
        </code>
      );
    }

    return (
      <pre className="mt-3 overflow-x-auto rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(11,15,25,0.65)] p-3 text-xs text-[rgb(var(--text-primary))]">
        <code className={className}>{children ?? ""}</code>
      </pre>
    );
  },
  a({ href, children }: { href?: string; children?: ReactNode }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="text-[rgb(var(--accent-cyan))] underline decoration-transparent transition hover:decoration-[rgb(var(--accent-cyan))]"
      >
        {children ?? href}
      </a>
    );
  },
};

export default function Dashboard() {
  const {
    youtubeUrl,
    instagramUrl,
    isAnalyzing,
    analysisStep,
    analysisProgress,
    analysisStatus,
    videos,
    messages,
    input,
    isStreaming,
    status,
    setYoutubeUrl,
    setInstagramUrl,
    setIsAnalyzing,
    setAnalysisStep,
    setAnalysisProgress,
    setAnalysisStatus,
    setInput,
    addMessage,
    updateMessage,
    appendToMessage,
    setStreaming,
  } = useDashboardStore();

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const chatInputRef = useRef<HTMLTextAreaElement | null>(null);

  const progressFromStep =
    analysisStep >= 0
      ? Math.round(((analysisStep + 1) / analysisSteps.length) * 100)
      : 0;
  const progressValue = Math.max(analysisProgress, progressFromStep);
  const isAnalyzeDisabled =
    isAnalyzing || !youtubeUrl.trim() || !instagramUrl.trim();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const applyProgressUpdate = (payload: {
    step?: string;
    stage?: string;
    status?: string;
    progress?: number;
    message?: string;
  }) => {
    if (typeof payload.progress === "number") {
      const clamped = Math.max(0, Math.min(100, payload.progress));
      setAnalysisProgress(clamped);
    }

    const candidate =
      payload.step ?? payload.stage ?? payload.status ?? payload.message;
    if (typeof candidate === "string") {
      const normalized = candidate.trim().toLowerCase();
      const stepIndex = analysisSteps.findIndex(
        (step) =>
          step.key === normalized ||
          step.label.toLowerCase().includes(normalized),
      );

      if (stepIndex >= 0) {
        setAnalysisStep(stepIndex);
        const derivedProgress = Math.round(
          ((stepIndex + 1) / analysisSteps.length) * 100,
        );
        if (derivedProgress > analysisProgress) {
          setAnalysisProgress(derivedProgress);
        }
        setAnalysisStatus(analysisSteps[stepIndex].label);
        return;
      }

      setAnalysisStatus(candidate);
    }
  };

  const handleAnalyze = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isAnalyzeDisabled) return;

    setIsAnalyzing(true);
    setAnalysisStep(0);
    setAnalysisProgress(8);
    setAnalysisStatus(analysisSteps[0].label);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          youtubeUrl,
          instagramUrl,
        }),
      });

      if (!response.ok) {
        throw new Error("Analyze request failed");
      }

      if (!response.body) {
        setAnalysisStatus("Processing analysis...");
        setAnalysisProgress(60);
      } else {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            const payloadText = trimmed.startsWith("data:")
              ? trimmed.slice(5).trim()
              : trimmed;

            try {
              const payload = JSON.parse(payloadText) as {
                step?: string;
                stage?: string;
                status?: string;
                progress?: number;
                message?: string;
              };
              applyProgressUpdate(payload);
            } catch {
              applyProgressUpdate({ message: payloadText });
            }
          }
        }
      }

      setAnalysisStep(analysisSteps.length - 1);
      setAnalysisProgress(100);
      setAnalysisStatus(analysisSteps[analysisSteps.length - 1].label);
    } catch {
      setAnalysisStatus("Analysis failed. Try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleChatSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const userMessage = {
      id: `msg-${Date.now()}`,
      role: "user" as const,
      content: trimmed,
      timestamp,
    };
    const assistantId = `msg-${Date.now()}-assistant`;

    addMessage(userMessage);
    addMessage({
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp,
      isStreaming: true,
    });
    setInput("");
    setStreaming(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: trimmed,
          messages: [...messages, userMessage].map((message) => ({
            role: message.role,
            content: message.content,
          })),
          videos,
        }),
      });

      if (!response.ok) {
        throw new Error("Chat request failed");
      }

      if (!response.body) {
        updateMessage(assistantId, {
          content: "Response received.",
          isStreaming: false,
        });
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || trimmedLine.startsWith("event:")) continue;
          const payloadText = trimmedLine.startsWith("data:")
            ? trimmedLine.slice(5).trim()
            : trimmedLine;

          if (!payloadText) continue;

          try {
            const payload = JSON.parse(payloadText) as {
              token?: string;
              content?: string;
              text?: string;
              sources?: { label: string; url?: string }[];
            };
            if (payload.token || payload.content || payload.text) {
              appendToMessage(
                assistantId,
                payload.token ?? payload.content ?? payload.text ?? "",
              );
            }
            if (payload.sources) {
              updateMessage(assistantId, { sources: payload.sources });
            }
          } catch {
            appendToMessage(assistantId, payloadText);
          }
        }
      }

      if (buffer.trim()) {
        appendToMessage(assistantId, buffer.trim());
      }
    } catch {
      updateMessage(assistantId, {
        content: "Unable to reach the AI service. Try again.",
        isStreaming: false,
      });
    } finally {
      updateMessage(assistantId, { isStreaming: false });
      setStreaming(false);
    }
  };

  const handleSuggestionClick = (prompt: string) => {
    setInput(prompt);
    chatInputRef.current?.focus();
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
          <section className="lg:col-span-2">
            <form
              onSubmit={handleAnalyze}
              className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgb(var(--panel)/0.7)] p-6 shadow-[0_20px_46px_rgba(5,8,16,0.55)] backdrop-blur-md"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-[rgb(var(--text-primary))]">
                    Analyze Videos
                  </h2>
                  <p className="text-sm text-[rgb(var(--text-secondary))]">
                    Compare sources before starting the live chat stream.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={isAnalyzeDisabled}
                  className="group relative overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgb(var(--panel-elevated)/0.9)] px-5 py-2 text-xs font-semibold text-[rgb(var(--text-primary))] shadow-[0_16px_32px_rgba(5,8,16,0.55)] transition disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="relative z-10">
                    {isAnalyzing ? "Analyzing..." : "Analyze Videos"}
                  </span>
                  <span className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[linear-gradient(120deg,rgba(34,211,238,0.9),rgba(139,92,246,0.9))]" />
                </button>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div>
                  <label
                    htmlFor="youtube-url"
                    className="text-xs font-medium text-[rgb(var(--text-secondary))]"
                  >
                    YouTube URL
                  </label>
                  <input
                    id="youtube-url"
                    value={youtubeUrl}
                    onChange={(event) => setYoutubeUrl(event.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    disabled={isAnalyzing}
                    className="mt-2 w-full rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgb(var(--panel)/0.65)] px-4 py-2 text-sm text-[rgb(var(--text-primary))] shadow-[0_12px_30px_rgba(5,8,16,0.45)] focus:border-[rgba(34,211,238,0.4)] focus:outline-none focus:ring-2 focus:ring-[rgba(34,211,238,0.2)] disabled:opacity-60"
                  />
                </div>
                <div>
                  <label
                    htmlFor="instagram-url"
                    className="text-xs font-medium text-[rgb(var(--text-secondary))]"
                  >
                    Instagram Reel URL
                  </label>
                  <input
                    id="instagram-url"
                    value={instagramUrl}
                    onChange={(event) => setInstagramUrl(event.target.value)}
                    placeholder="https://instagram.com/reel/..."
                    disabled={isAnalyzing}
                    className="mt-2 w-full rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgb(var(--panel)/0.65)] px-4 py-2 text-sm text-[rgb(var(--text-primary))] shadow-[0_12px_30px_rgba(5,8,16,0.45)] focus:border-[rgba(34,211,238,0.4)] focus:outline-none focus:ring-2 focus:ring-[rgba(34,211,238,0.2)] disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-[rgb(var(--text-secondary))]">
                  <span>{analysisStatus}</span>
                  <span>{progressValue}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-2xl bg-[rgba(255,255,255,0.06)]">
                  <motion.div
                    className="h-full rounded-2xl bg-[rgb(var(--accent-cyan))]"
                    animate={{ width: `${progressValue}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {analysisSteps.map((step, index) => {
                    const isActive = analysisStep === index;
                    const isComplete = analysisStep > index;
                    const pillStyles = isComplete
                      ? "border-[rgba(34,211,238,0.4)] bg-[rgba(34,211,238,0.14)] text-[rgb(var(--accent-cyan))]"
                      : isActive
                        ? "border-[rgba(34,211,238,0.6)] bg-[rgba(34,211,238,0.18)] text-[rgb(var(--accent-cyan))] animate-pulse"
                        : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-[rgb(var(--text-secondary))]";

                    return (
                      <span
                        key={step.key}
                        className={`rounded-2xl border px-3 py-1 text-xs ${pillStyles}`}
                      >
                        {step.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            </form>
          </section>

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
                <VideoCard key={video.id} video={video} index={index} />
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
                <div className="flex flex-wrap gap-2">
                  {promptSuggestions.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => handleSuggestionClick(prompt)}
                      className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-3 py-1 text-xs text-[rgb(var(--text-secondary))] transition hover:border-[rgba(34,211,238,0.4)] hover:text-[rgb(var(--text-primary))]"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
                {messages.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[rgba(255,255,255,0.08)] bg-[rgb(var(--panel-elevated)/0.4)] p-4 text-sm text-[rgb(var(--text-secondary))]">
                    Start a comparison to stream insights here.
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl border px-4 py-3 text-sm shadow-[0_14px_28px_rgba(5,8,16,0.45)] ${
                          message.role === "assistant"
                            ? "border-[rgba(255,255,255,0.06)] bg-[rgb(var(--panel-elevated)/0.6)] text-[rgb(var(--text-primary))]"
                            : "border-[rgba(34,211,238,0.4)] bg-[rgba(34,211,238,0.14)] text-[rgb(var(--text-primary))]"
                        }`}
                      >
                        <div className="mb-2 flex items-center justify-between text-[11px] text-[rgb(var(--text-secondary))] opacity-80">
                          <span>{message.role}</span>
                          <span>{message.timestamp}</span>
                        </div>
                        <ReactMarkdown
                          className="text-sm leading-relaxed"
                          components={markdownComponents}
                        >
                          {message.content || " "}
                        </ReactMarkdown>
                        {message.sources && message.sources.length > 0 ? (
                          <div className="mt-3">
                            <p className="text-[11px] text-[rgb(var(--text-secondary))]">
                              Sources
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {message.sources.map((source) =>
                                source.url ? (
                                  <a
                                    key={source.url}
                                    href={source.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-2xl border border-[rgba(255,255,255,0.12)] px-2 py-1 text-[11px] text-[rgb(var(--accent-cyan))]"
                                  >
                                    {source.label}
                                  </a>
                                ) : (
                                  <span
                                    key={source.label}
                                    className="rounded-2xl border border-[rgba(255,255,255,0.12)] px-2 py-1 text-[11px] text-[rgb(var(--text-secondary))]"
                                  >
                                    {source.label}
                                  </span>
                                ),
                              )}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))
                )}
                {isStreaming ? (
                  <div className="flex items-center gap-2 text-xs text-[rgb(var(--text-secondary))]">
                    <div className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-2xl bg-[rgb(var(--accent-cyan))] animate-bounce" />
                      <span className="h-2 w-2 rounded-2xl bg-[rgb(var(--accent-cyan))] animate-bounce" style={{ animationDelay: "0.1s" }} />
                      <span className="h-2 w-2 rounded-2xl bg-[rgb(var(--accent-cyan))] animate-bounce" style={{ animationDelay: "0.2s" }} />
                    </div>
                    <span>Assistant is typing...</span>
                  </div>
                ) : null}
                <div ref={chatEndRef} />
              </div>

              <form
                onSubmit={handleChatSubmit}
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
                  ref={chatInputRef}
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
