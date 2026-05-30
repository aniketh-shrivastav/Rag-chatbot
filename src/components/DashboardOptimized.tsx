"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { shallow } from "zustand/shallow";
import {
  useDashboardStore,
  type ChatMessage,
  type ChatSource,
} from "@/stores/dashboardStore";
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

type ToastTone = "info" | "success" | "warning" | "error";

type ToastItem = {
  id: string;
  tone: ToastTone;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

type MobileTab = "videos" | "chat";

const isLikelyYouTubeUrl = (value: string) => {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    return (
      host === "youtu.be" ||
      host === "youtube.com" ||
      host.endsWith(".youtube.com")
    );
  } catch {
    return false;
  }
};

const isLikelyInstagramUrl = (value: string) => {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    return host === "instagram.com" || host.endsWith(".instagram.com");
  } catch {
    return false;
  }
};

const normalizeServerError = (message: string) => {
  const lower = message.toLowerCase();

  if (lower.includes("timeout")) {
    return "The request timed out. Try again or shorten the input.";
  }

  if (lower.includes("transcript")) {
    return "Transcript unavailable for one of the videos.";
  }

  if (lower.includes("empty embeddings") || lower.includes("no embeddings")) {
    return "No embeddings were returned. Retry analysis after the source is processed.";
  }

  if (lower.includes("instagram")) {
    return "Instagram scraping failed. Check the Reel URL and try again.";
  }

  if (lower.includes("llm") || lower.includes("model")) {
    return "The model failed to generate a response. Retry generation.";
  }

  return message;
};

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

const getCitationTitle = (source: ChatSource) => {
  const videoLabel = source.videoLabel ?? source.label ?? "Video";
  const chunkLabel =
    typeof source.chunkIndex === "number"
      ? `Chunk ${source.chunkIndex}`
      : "Chunk";
  const timestamp = source.timestamp ? ` - ${source.timestamp}` : "";
  return `${videoLabel} - ${chunkLabel}${timestamp}`;
};

const renderSnippet = (source: ChatSource) => {
  const snippet = source.snippet ?? source.label ?? "";
  if (!snippet) return null;

  const highlight = source.highlight?.trim();
  if (!highlight) {
    return (
      <span className="rounded-lg bg-[rgba(34,211,238,0.16)] px-1">
        {snippet}
      </span>
    );
  }

  const lowerSnippet = snippet.toLowerCase();
  const lowerHighlight = highlight.toLowerCase();
  const matchIndex = lowerSnippet.indexOf(lowerHighlight);

  if (matchIndex < 0) {
    return (
      <span className="rounded-lg bg-[rgba(34,211,238,0.16)] px-1">
        {snippet}
      </span>
    );
  }

  const before = snippet.slice(0, matchIndex);
  const match = snippet.slice(matchIndex, matchIndex + highlight.length);
  const after = snippet.slice(matchIndex + highlight.length);

  return (
    <>
      {before}
      <span className="rounded-lg bg-[rgba(34,211,238,0.26)] px-1 text-[rgb(var(--text-primary))]">
        {match}
      </span>
      {after}
    </>
  );
};

const ChatMessageBubble = memo(function ChatMessageBubble({
  message,
  expandedCitations,
  onToggleCitation,
}: {
  message: ChatMessage;
  expandedCitations: Record<string, boolean>;
  onToggleCitation: (key: string) => void;
}) {
  return (
    <div
      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
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
        {message.role === "assistant" ? (
          <div className="mt-3 space-y-2">
            <p className="text-[11px] text-[rgb(var(--text-secondary))]">
              Citations
            </p>
            {message.sources && message.sources.length > 0 ? (
              message.sources.map((source, indexValue) => {
                const citationKey = `${message.id}-${indexValue}`;
                const isExpanded = !!expandedCitations[citationKey];
                const snippetPreview = source.snippet ?? source.label ?? "";

                return (
                  <div key={citationKey}>
                    <button
                      type="button"
                      onClick={() => onToggleCitation(citationKey)}
                      aria-expanded={isExpanded}
                      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(11,15,25,0.55)] px-3 py-2 text-left text-xs text-[rgb(var(--text-secondary))] transition hover:border-[rgba(34,211,238,0.4)]"
                    >
                      <span className="text-[rgb(var(--text-primary))]">
                        {getCitationTitle(source)}
                      </span>
                      <span className="text-[rgb(var(--accent-cyan))]">
                        {isExpanded ? "Hide" : "View"}
                      </span>
                    </button>
                    {snippetPreview ? (
                      <p className="mt-2 text-xs text-[rgb(var(--text-secondary))]">
                        "{snippetPreview}"
                      </p>
                    ) : null}
                    {isExpanded ? (
                      <div className="mt-2 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(11,15,25,0.6)] p-3 text-xs text-[rgb(var(--text-primary))]">
                        <p className="leading-relaxed">
                          {renderSnippet(source) ??
                            "Transcript snippet unavailable."}
                        </p>
                      </div>
                    ) : null}
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-[rgba(255,255,255,0.12)] bg-[rgba(11,15,25,0.45)] px-3 py-2 text-xs text-[rgb(var(--text-secondary))]">
                Citations pending.
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
});

export default function Dashboard() {
  const {
    isAnalyzing,
    analysisStep,
    analysisProgress,
    analysisStatus,
    videos,
    messages,
    input,
    isStreaming,
    status,
  } = useDashboardStore(
    (state) => ({
      isAnalyzing: state.isAnalyzing,
      analysisStep: state.analysisStep,
      analysisProgress: state.analysisProgress,
      analysisStatus: state.analysisStatus,
      videos: state.videos,
      messages: state.messages,
      input: state.input,
      isStreaming: state.isStreaming,
      status: state.status,
    }),
    shallow,
  );

  const {
    setIsAnalyzing,
    setAnalysisStep,
    setAnalysisProgress,
    setAnalysisStatus,
    addMessage,
    updateMessage,
    appendToMessage,
    setStreaming,
    setStatus,
    resetChat,
    setInput,
  } = useDashboardStore(
    (state) => ({
      setIsAnalyzing: state.setIsAnalyzing,
      setAnalysisStep: state.setAnalysisStep,
      setAnalysisProgress: state.setAnalysisProgress,
      setAnalysisStatus: state.setAnalysisStatus,
      addMessage: state.addMessage,
      updateMessage: state.updateMessage,
      appendToMessage: state.appendToMessage,
      setStreaming: state.setStreaming,
      setStatus: state.setStatus,
      resetChat: state.resetChat,
      setInput: state.setInput,
    }),
    shallow,
  );

  const [youtubeDraft, setYoutubeDraft] = useState("");
  const [instagramDraft, setInstagramDraft] = useState("");
  const [chatDraft, setChatDraft] = useState(input);
  const [expandedCitations, setExpandedCitations] = useState<
    Record<string, boolean>
  >({});
  const [analysisInlineError, setAnalysisInlineError] = useState<string | null>(
    null,
  );
  const [chatInlineError, setChatInlineError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mobileTab, setMobileTab] = useState<MobileTab>("videos");

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const chatInputRef = useRef<HTMLTextAreaElement | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const activeStreamIdRef = useRef<string | null>(null);
  const activeAssistantIdRef = useRef<string | null>(null);
  const lastAnalyzeRequestRef = useRef<{
    youtubeUrl: string;
    instagramUrl: string;
  } | null>(null);
  const lastChatPromptRef = useRef<string>("");
  const chatTimeoutRef = useRef<number | null>(null);
  const analyzeTimeoutRef = useRef<number | null>(null);
  const tokenBufferRef = useRef("");
  const tokenTargetRef = useRef<string | null>(null);
  const tokenFlushFrameRef = useRef<number | null>(null);
  const toastTimersRef = useRef<Record<string, number>>({});
  const retryContextRef = useRef<{
    assistantId?: string;
    prompt?: string;
  } | null>(null);

  const progressFromStep =
    analysisStep >= 0
      ? Math.round(((analysisStep + 1) / analysisSteps.length) * 100)
      : 0;
  const progressValue = Math.max(analysisProgress, progressFromStep);
  const isAnalyzeDisabled =
    isAnalyzing || !youtubeDraft.trim() || !instagramDraft.trim();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setInput(chatDraft);
    }, 220);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [chatDraft, setInput]);

  useEffect(() => {
    setChatDraft(input);
  }, [input]);

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
      if (chatTimeoutRef.current) window.clearTimeout(chatTimeoutRef.current);
      if (analyzeTimeoutRef.current)
        window.clearTimeout(analyzeTimeoutRef.current);
      if (tokenFlushFrameRef.current !== null) {
        window.cancelAnimationFrame(tokenFlushFrameRef.current);
      }
      Object.values(toastTimersRef.current).forEach((timerId) =>
        window.clearTimeout(timerId),
      );
    };
  }, []);

  const toggleCitation = useCallback((key: string) => {
    setExpandedCitations((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const flushTokenBuffer = () => {
    if (!tokenBufferRef.current || !tokenTargetRef.current) return;
    appendToMessage(tokenTargetRef.current, tokenBufferRef.current);
    tokenBufferRef.current = "";
  };

  const scheduleTokenFlush = () => {
    if (tokenFlushFrameRef.current !== null) return;
    tokenFlushFrameRef.current = window.requestAnimationFrame(() => {
      tokenFlushFrameRef.current = null;
      flushTokenBuffer();
    });
  };

  const queueTokenDelta = (assistantId: string, delta: string) => {
    if (tokenTargetRef.current && tokenTargetRef.current !== assistantId) {
      flushTokenBuffer();
    }

    tokenTargetRef.current = assistantId;
    tokenBufferRef.current = `${tokenBufferRef.current}${delta}`;
    scheduleTokenFlush();
  };

  const clearTokenBuffer = () => {
    if (tokenFlushFrameRef.current !== null) {
      window.cancelAnimationFrame(tokenFlushFrameRef.current);
      tokenFlushFrameRef.current = null;
    }
    flushTokenBuffer();
    tokenTargetRef.current = null;
  };

  const dismissToast = (id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timerId = toastTimersRef.current[id];
    if (timerId) {
      window.clearTimeout(timerId);
      delete toastTimersRef.current[id];
    }
  };

  const pushToast = (toast: Omit<ToastItem, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((current) => [...current, { ...toast, id }]);
    toastTimersRef.current[id] = window.setTimeout(() => {
      dismissToast(id);
    }, 5500);
  };

  const makeRequestTimeout = (onTimeout: () => void, timeoutMs = 20000) =>
    window.setTimeout(onTimeout, timeoutMs);

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

  const clearChatTimeout = () => {
    if (chatTimeoutRef.current) {
      window.clearTimeout(chatTimeoutRef.current);
      chatTimeoutRef.current = null;
    }
  };

  const clearAnalyzeTimeout = () => {
    if (analyzeTimeoutRef.current) {
      window.clearTimeout(analyzeTimeoutRef.current);
      analyzeTimeoutRef.current = null;
    }
  };

  const finalizeAnalysisFailure = (error: unknown) => {
    const message =
      error instanceof Error ? error.message : "Analysis failed. Try again.";
    const normalized = normalizeServerError(message);
    setAnalysisStep(analysisSteps.length - 1);
    setAnalysisProgress(100);
    setAnalysisStatus("Analysis failed");
    setAnalysisInlineError(normalized);
    pushToast({
      tone: "error",
      title: "Analysis failed",
      message: normalized,
      actionLabel: "Retry analysis",
      onAction: () => {
        const lastRequest = lastAnalyzeRequestRef.current;
        if (!lastRequest) return;
        setYoutubeDraft(lastRequest.youtubeUrl);
        setInstagramDraft(lastRequest.instagramUrl);
        void runAnalyze(lastRequest.youtubeUrl, lastRequest.instagramUrl);
      },
    });
  };

  const finalizeChatFailure = (
    assistantId: string,
    message: string,
    tone: ToastTone = "error",
  ) => {
    updateMessage(assistantId, { isStreaming: false });
    clearTokenBuffer();
    appendToMessage(
      assistantId,
      `\n\n${normalizeServerError(message)}${
        message.toLowerCase().includes("retry")
          ? ""
          : "\nRetry the prompt to continue."
      }`,
    );
    clearChatTimeout();
    setStreaming(false);
    setStatus("idle");
    setChatInlineError(normalizeServerError(message));
    eventSourceRef.current = null;
    activeStreamIdRef.current = null;
    activeAssistantIdRef.current = null;
    pushToast({
      tone,
      title: "Chat interrupted",
      message: normalizeServerError(message),
      actionLabel: "Retry prompt",
      onAction: () => {
        const prompt = lastChatPromptRef.current;
        if (!prompt) return;
        void runChatStream(prompt, { addUserMessage: false });
      },
    });
  };

  const runAnalyze = async (youtube: string, instagram: string) => {
    setAnalysisInlineError(null);
    setIsAnalyzing(true);
    setAnalysisStep(0);
    setAnalysisProgress(8);
    setAnalysisStatus(analysisSteps[0].label);

    const controller = new AbortController();
    clearAnalyzeTimeout();
    analyzeTimeoutRef.current = makeRequestTimeout(() => {
      controller.abort();
    }, 25000);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ youtubeUrl: youtube, instagramUrl: instagram }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let details = "";
        try {
          details = (await response.text()).trim();
        } catch {
          details = "";
        }
        throw new Error(
          details || `Analyze request failed (${response.status})`,
        );
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
                error?: string;
                code?: string;
              };

              if (payload.error) throw new Error(payload.error);
              if (payload.code === "missing_transcript") {
                throw new Error(
                  "Transcript unavailable for one of the videos.",
                );
              }
              if (payload.code === "instagram_scrape_failed") {
                throw new Error(
                  "Instagram scraping failed. Check the Reel URL and try again.",
                );
              }
              if (payload.code === "empty_embeddings") {
                throw new Error(
                  "No embeddings were returned. Retry analysis after the source is processed.",
                );
              }

              applyProgressUpdate(payload);
            } catch (parseError) {
              if (parseError instanceof Error && parseError.message) {
                throw parseError;
              }
              applyProgressUpdate({ message: payloadText });
            }
          }
        }
      }

      setAnalysisStep(analysisSteps.length - 1);
      setAnalysisProgress(100);
      setAnalysisStatus(analysisSteps[analysisSteps.length - 1].label);
    } catch (error) {
      finalizeAnalysisFailure(error);
    } finally {
      clearAnalyzeTimeout();
      setIsAnalyzing(false);
    }
  };

  const handleAnalyze = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isAnalyzeDisabled) return;

    const nextYoutube = youtubeDraft.trim();
    const nextInstagram = instagramDraft.trim();

    if (
      !isLikelyYouTubeUrl(nextYoutube) ||
      !isLikelyInstagramUrl(nextInstagram)
    ) {
      const invalidMessage =
        !isLikelyYouTubeUrl(nextYoutube) && !isLikelyInstagramUrl(nextInstagram)
          ? "Please enter a valid YouTube URL and Instagram Reel URL."
          : !isLikelyYouTubeUrl(nextYoutube)
            ? "Please enter a valid YouTube URL."
            : "Please enter a valid Instagram Reel URL.";
      setAnalysisInlineError(invalidMessage);
      setAnalysisStatus("Fix the video URLs and try again.");
      pushToast({
        tone: "warning",
        title: "Invalid video URL",
        message: invalidMessage,
      });
      return;
    }

    lastAnalyzeRequestRef.current = {
      youtubeUrl: nextYoutube,
      instagramUrl: nextInstagram,
    };

    void runAnalyze(nextYoutube, nextInstagram);
  };

  const handleAbortGeneration = async () => {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    clearChatTimeout();
    clearTokenBuffer();

    const assistantId = activeAssistantIdRef.current;
    if (assistantId) {
      appendToMessage(assistantId, "\n\nGeneration aborted by user.");
      updateMessage(assistantId, { isStreaming: false });
    }

    const streamId = activeStreamIdRef.current;
    if (streamId) {
      const apiBase =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
      await fetch(`${apiBase}/chat/abort/${streamId}`, {
        method: "POST",
      }).catch(() => {
        // Ignore abort request failures.
      });
      activeStreamIdRef.current = null;
    }

    setStreaming(false);
    setStatus("idle");
    activeAssistantIdRef.current = null;
  };

  const runChatStream = async (
    prompt: string,
    options: { addUserMessage?: boolean } = {},
  ) => {
    const trimmed = prompt.trim();
    if (!trimmed || isStreaming) return;

    setChatInlineError(null);
    lastChatPromptRef.current = trimmed;

    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const addUserMessage = options.addUserMessage ?? true;
    const previousAssistantId = retryContextRef.current?.assistantId;
    const userMessage = {
      id: `msg-${Date.now()}`,
      role: "user" as const,
      content: trimmed,
      timestamp,
    };
    const assistantId = `msg-${Date.now()}-assistant`;

    if (addUserMessage) {
      addMessage(userMessage);
    }
    addMessage({
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp,
      isStreaming: true,
    });

    retryContextRef.current = {
      assistantId,
      prompt: trimmed,
    };

    activeAssistantIdRef.current = assistantId;
    setChatDraft("");
    setInput("");
    setStreaming(true);
    setStatus("connected");

    eventSourceRef.current?.close();
    clearChatTimeout();

    const apiBase =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
    const streamId = `stream-${Date.now()}`;
    activeStreamIdRef.current = streamId;

    const conversationMessages = (
      addUserMessage ? [...messages, userMessage] : messages
    ).filter((message) => message.id !== previousAssistantId);

    const params = new URLSearchParams({
      prompt: trimmed,
      streamId,
      messages: JSON.stringify(
        conversationMessages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      ),
      videos: JSON.stringify(videos),
    });

    const es = new EventSource(`${apiBase}/chat/stream?${params.toString()}`);
    eventSourceRef.current = es;

    const armChatTimeout = () => {
      clearChatTimeout();
      chatTimeoutRef.current = makeRequestTimeout(() => {
        finalizeChatFailure(
          assistantId,
          "The model timed out before finishing the response.",
        );
        es.close();
      }, 18000);
    };

    let reconnectNoted = false;

    es.addEventListener("start", () => {
      reconnectNoted = false;
      setStatus("connected");
      armChatTimeout();
    });

    es.onopen = () => {
      setStatus("connected");
      armChatTimeout();
      if (reconnectNoted && activeAssistantIdRef.current) {
        appendToMessage(activeAssistantIdRef.current, "\nConnection restored.");
        reconnectNoted = false;
      }
    };

    es.addEventListener("token", (event) => {
      const payload = JSON.parse((event as MessageEvent<string>).data) as {
        token?: string;
      };
      if (payload.token) {
        queueTokenDelta(assistantId, payload.token);
        armChatTimeout();
      }
    });

    es.addEventListener("sources", (event) => {
      const payload = JSON.parse((event as MessageEvent<string>).data) as {
        sources?: ChatSource[];
      };
      if (payload.sources) {
        updateMessage(assistantId, { sources: payload.sources });
      }
    });

    es.addEventListener("done", () => {
      clearTokenBuffer();
      updateMessage(assistantId, { isStreaming: false });
      clearChatTimeout();
      setStreaming(false);
      setStatus("idle");
      es.close();
      eventSourceRef.current = null;
      activeStreamIdRef.current = null;
      activeAssistantIdRef.current = null;
    });

    es.addEventListener("aborted", () => {
      clearTokenBuffer();
      updateMessage(assistantId, { isStreaming: false });
      clearChatTimeout();
      setStreaming(false);
      setStatus("idle");
      es.close();
      eventSourceRef.current = null;
      activeStreamIdRef.current = null;
      activeAssistantIdRef.current = null;
    });

    es.addEventListener("error", (event) => {
      const payload = JSON.parse(
        (event as MessageEvent<string>).data || "{}",
      ) as {
        message?: string;
        error?: string;
        code?: string;
      };
      if (payload.error || payload.message || payload.code) {
        const codeMessage =
          payload.code === "llm_failure"
            ? "The model failed to generate a response. Retry generation."
            : payload.code === "missing_transcript"
              ? "Transcript unavailable for one of the videos."
              : payload.code === "empty_embeddings"
                ? "No embeddings were returned. Retry analysis after the source is processed."
                : payload.code === "instagram_scrape_failed"
                  ? "Instagram scraping failed. Check the Reel URL and try again."
                  : payload.error ||
                    payload.message ||
                    "The chat stream failed.";
        finalizeChatFailure(assistantId, codeMessage);
        es.close();
        return;
      }

      setStatus("reconnecting");
      if (!reconnectNoted) {
        reconnectNoted = true;
        queueTokenDelta(assistantId, "\n\nReconnecting stream...");
        pushToast({
          tone: "warning",
          title: "Connection interrupted",
          message: "The chat stream is reconnecting in the background.",
        });
      }

      if (es.readyState === EventSource.CLOSED) {
        finalizeChatFailure(
          assistantId,
          "Unable to continue stream. Please retry your prompt.",
        );
        es.close();
      }
    });
  };

  const handleChatSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = chatDraft.trim();
    if (!trimmed || isStreaming) return;

    void runChatStream(trimmed);
  };

  const handleSuggestionClick = (prompt: string) => {
    setMobileTab("chat");
    setChatDraft(prompt);
    setChatInlineError(null);
    chatInputRef.current?.focus();
  };

  const handleNewChat = () => {
    resetChat();
    setExpandedCitations({});
    setChatInlineError(null);
    setChatDraft("");
    chatInputRef.current?.focus();
  };

  return (
    <div className="min-h-screen">
      <div className="min-h-screen flex flex-col">
        <header className="border-b border-[rgba(255,255,255,0.06)] bg-[rgb(var(--panel)/0.6)] backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex items-center gap-4">
              <div className="relative h-10 w-10 rounded-2xl bg-[rgb(var(--panel-elevated)/0.9)] shadow-[0_18px_40px_rgba(6,10,20,0.55)] sm:h-12 sm:w-12">
                <div className="absolute inset-1 rounded-2xl bg-[radial-gradient(circle_at_top,#22D3EE_0%,#0B0F19_70%)] opacity-80" />
              </div>
              <div>
                <p className="text-xs font-medium text-[rgb(var(--text-secondary))]">
                  Creator Analytics
                </p>
                <h1 className="text-2xl font-bold tracking-tight text-[rgb(var(--text-primary))] sm:text-3xl">
                  Video Comparison Dashboard
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-[rgb(var(--text-secondary))]">
              <span className="flex h-2 w-2 rounded-2xl bg-[rgb(var(--accent-cyan))] shadow-[0_0_0_6px_rgba(34,211,238,0.18)]" />
              <span className="hidden sm:inline">{statusLabels[status]}</span>
            </div>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:grid lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <section className="lg:col-span-2">
            <form
              onSubmit={handleAnalyze}
              className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgb(var(--panel)/0.7)] p-4 shadow-[0_20px_46px_rgba(5,8,16,0.55)] backdrop-blur-md sm:p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-[rgb(var(--text-primary))] sm:text-2xl">
                    Analyze Videos
                  </h2>
                  <p className="text-sm text-[rgb(var(--text-secondary))]">
                    Compare sources before starting the live chat stream.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={isAnalyzeDisabled}
                  className="group relative min-h-[44px] overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgb(var(--panel-elevated)/0.9)] px-5 py-2 text-sm font-semibold text-[rgb(var(--text-primary))] shadow-[0_16px_32px_rgba(5,8,16,0.55)] transition disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="relative z-10">
                    {isAnalyzing ? "Analyzing..." : "Analyze Videos"}
                  </span>
                  <span className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[linear-gradient(120deg,rgba(34,211,238,0.9),rgba(139,92,246,0.9))]" />
                </button>
              </div>

              {analysisInlineError ? (
                <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                  {analysisInlineError}
                </div>
              ) : null}

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
                    value={youtubeDraft}
                    onChange={(event) => {
                      setYoutubeDraft(event.target.value);
                      setAnalysisInlineError(null);
                    }}
                    placeholder="https://youtube.com/watch?v=..."
                    disabled={isAnalyzing}
                    aria-invalid={Boolean(analysisInlineError)}
                    className="mt-2 w-full rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgb(var(--panel)/0.65)] px-4 py-3 text-base text-[rgb(var(--text-primary))] shadow-[0_12px_30px_rgba(5,8,16,0.45)] focus:border-[rgba(34,211,238,0.4)] focus:outline-none focus:ring-2 focus:ring-[rgba(34,211,238,0.2)] disabled:opacity-60 aria-[invalid=true]:border-rose-400/60 md:text-sm"
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
                    value={instagramDraft}
                    onChange={(event) => {
                      setInstagramDraft(event.target.value);
                      setAnalysisInlineError(null);
                    }}
                    placeholder="https://instagram.com/reel/..."
                    disabled={isAnalyzing}
                    aria-invalid={Boolean(analysisInlineError)}
                    className="mt-2 w-full rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgb(var(--panel)/0.65)] px-4 py-3 text-base text-[rgb(var(--text-primary))] shadow-[0_12px_30px_rgba(5,8,16,0.45)] focus:border-[rgba(34,211,238,0.4)] focus:outline-none focus:ring-2 focus:ring-[rgba(34,211,238,0.2)] disabled:opacity-60 aria-[invalid=true]:border-rose-400/60 md:text-sm"
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

          <div className="sticky top-[72px] z-20 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgb(var(--panel)/0.85)] p-1 backdrop-blur-md md:hidden">
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => setMobileTab("videos")}
                aria-pressed={mobileTab === "videos"}
                className={`min-h-[44px] rounded-xl text-sm font-semibold transition ${
                  mobileTab === "videos"
                    ? "bg-[rgba(34,211,238,0.16)] text-[rgb(var(--text-primary))]"
                    : "text-[rgb(var(--text-secondary))]"
                }`}
              >
                Videos
              </button>
              <button
                type="button"
                onClick={() => setMobileTab("chat")}
                aria-pressed={mobileTab === "chat"}
                className={`min-h-[44px] rounded-xl text-sm font-semibold transition ${
                  mobileTab === "chat"
                    ? "bg-[rgba(34,211,238,0.16)] text-[rgb(var(--text-primary))]"
                    : "text-[rgb(var(--text-secondary))]"
                }`}
              >
                Chat
              </button>
            </div>
          </div>

          <section
            className={`space-y-6 ${mobileTab === "chat" ? "hidden md:block" : "block"}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-[rgb(var(--text-primary))] sm:text-2xl">
                  Video Comparison Panel
                </h2>
                <p className="text-sm text-[rgb(var(--text-secondary))]">
                  Align inputs for the model before streaming insights.
                </p>
              </div>
              <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgb(var(--panel)/0.6)] px-3 py-2 text-[11px] text-[rgb(var(--text-secondary))] sm:px-4 sm:text-xs">
                {videos.length} inputs
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {videos.map((video, index) => (
                <VideoCard key={video.id} video={video} index={index} />
              ))}
            </div>
          </section>

          <aside
            className={`self-start md:sticky md:top-16 md:h-[calc(100dvh-6.5rem)] lg:top-24 lg:h-[calc(100dvh-10rem)] ${
              mobileTab === "videos" ? "hidden md:block" : "block"
            }`}
          >
            <div className="flex min-h-[58vh] h-full flex-col rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgb(var(--panel)/0.7)] shadow-[0_22px_48px_rgba(5,8,16,0.55)] backdrop-blur-md md:min-h-0">
              <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] px-4 py-3 sm:px-6 sm:py-4">
                <div>
                  <p className="text-xs font-medium text-[rgb(var(--text-secondary))]">
                    AI Chat
                  </p>
                  <h3 className="text-lg font-semibold tracking-tight text-[rgb(var(--text-primary))]">
                    Streaming Insights
                  </h3>
                </div>
                <div className="flex items-center gap-3 text-xs text-[rgb(var(--text-secondary))]">
                  <button
                    type="button"
                    onClick={handleNewChat}
                    disabled={isStreaming || messages.length === 0}
                    className="min-h-[36px] rounded-2xl border border-[rgba(255,255,255,0.08)] px-3 py-1 text-[11px] text-[rgb(var(--text-primary))] transition hover:border-[rgba(34,211,238,0.4)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    New Chat
                  </button>
                  <div className="flex items-center gap-2">
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
              </div>

              <div className="flex-1 space-y-4 overflow-auto px-4 py-3 sm:px-6 sm:py-4">
                <div className="flex flex-wrap gap-2">
                  {promptSuggestions.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => handleSuggestionClick(prompt)}
                      className="min-h-[36px] rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-2.5 py-1 text-[11px] text-[rgb(var(--text-secondary))] transition hover:border-[rgba(34,211,238,0.4)] hover:text-[rgb(var(--text-primary))] sm:px-3 sm:text-xs"
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
                    <ChatMessageBubble
                      key={message.id}
                      message={message}
                      expandedCitations={expandedCitations}
                      onToggleCitation={toggleCitation}
                    />
                  ))
                )}

                {isStreaming ? (
                  <div className="flex items-center gap-2 text-xs text-[rgb(var(--text-secondary))]">
                    <div className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-2xl bg-[rgb(var(--accent-cyan))] animate-bounce" />
                      <span
                        className="h-2 w-2 rounded-2xl bg-[rgb(var(--accent-cyan))] animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <span
                        className="h-2 w-2 rounded-2xl bg-[rgb(var(--accent-cyan))] animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                    <span>Assistant is typing...</span>
                  </div>
                ) : null}
                <div ref={chatEndRef} />
              </div>

              <form
                onSubmit={handleChatSubmit}
                className="border-t border-[rgba(255,255,255,0.06)] px-4 py-3 sm:px-6 sm:py-4"
              >
                {chatInlineError ? (
                  <div className="mb-4 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-xs text-rose-200">
                    {chatInlineError}
                  </div>
                ) : null}
                <label
                  htmlFor="chat-input"
                  className="text-xs font-medium text-[rgb(var(--text-secondary))]"
                >
                  Prompt
                </label>
                <textarea
                  id="chat-input"
                  rows={3}
                  value={chatDraft}
                  onChange={(event) => {
                    setChatDraft(event.target.value);
                    setChatInlineError(null);
                  }}
                  placeholder="Ask for a hook-by-hook comparison..."
                  ref={chatInputRef}
                  aria-invalid={Boolean(chatInlineError)}
                  className="mt-2 w-full resize-none rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgb(var(--panel)/0.65)] px-4 py-3 text-base text-[rgb(var(--text-primary))] shadow-[0_12px_30px_rgba(5,8,16,0.45)] focus:border-[rgba(34,211,238,0.4)] focus:outline-none focus:ring-2 focus:ring-[rgba(34,211,238,0.2)] aria-[invalid=true]:border-rose-400/60 md:text-sm"
                />
                <div className="mt-4 flex items-center justify-between text-xs text-[rgb(var(--text-secondary))]">
                  <span>Shift + Enter for a new line</span>
                  <div className="flex items-center gap-2">
                    {isStreaming ? (
                      <button
                        type="button"
                        onClick={handleAbortGeneration}
                        className="min-h-[40px] rounded-2xl border border-rose-400/60 bg-rose-400/10 px-4 py-2 text-xs font-semibold text-rose-300"
                      >
                        Abort
                      </button>
                    ) : null}
                    <button
                      type="submit"
                      disabled={isStreaming}
                      className="group relative min-h-[40px] overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgb(var(--panel-elevated)/0.9)] px-4 py-2 text-xs font-semibold text-[rgb(var(--text-primary))] shadow-[0_14px_28px_rgba(5,8,16,0.5)] transition disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="relative z-10">Send</span>
                      <span className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[linear-gradient(120deg,rgba(34,211,238,0.9),rgba(139,92,246,0.9))]" />
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </aside>
        </main>

        <footer className="border-t border-[rgba(255,255,255,0.06)] bg-[rgb(var(--panel)/0.6)]">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs text-[rgb(var(--text-secondary))] sm:px-6 sm:py-4">
            <span>Transport ready for SSE or WebSocket streams.</span>
            <span>Status: {statusLabels[status]}</span>
          </div>
        </footer>
      </div>

      <div className="pointer-events-none fixed inset-x-2 top-3 z-50 flex w-auto flex-col gap-3 sm:inset-x-auto sm:right-4 sm:top-4 sm:w-[min(24rem,calc(100vw-2rem))]">
        {toasts.map((toast) => {
          const toneStyles =
            toast.tone === "success"
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
              : toast.tone === "warning"
                ? "border-amber-400/30 bg-amber-400/10 text-amber-100"
                : toast.tone === "info"
                  ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-100"
                  : "border-rose-400/30 bg-rose-400/10 text-rose-100";

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto rounded-2xl border p-4 shadow-[0_20px_40px_rgba(5,8,16,0.6)] backdrop-blur-md ${toneStyles}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{toast.title}</p>
                  <p className="mt-1 text-xs leading-relaxed opacity-90">
                    {toast.message}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="text-xs opacity-70 transition hover:opacity-100"
                >
                  Dismiss
                </button>
              </div>
              {toast.actionLabel && toast.onAction ? (
                <button
                  type="button"
                  onClick={() => {
                    toast.onAction?.();
                    dismissToast(toast.id);
                  }}
                  className="mt-3 rounded-2xl border border-current/20 px-3 py-1.5 text-xs font-semibold transition hover:bg-[rgba(255,255,255,0.08)]"
                >
                  {toast.actionLabel}
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
