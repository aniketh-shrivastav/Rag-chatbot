import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";

export type VideoPlatform = "YouTube" | "Instagram";

export type VideoCard = {
  id: string;
  label: string;
  platform: VideoPlatform;
  title: string;
  url: string;
  notes: string;
  thumbnailUrl: string;
  embedUrl: string;
  creatorName: string;
  followerCount: number;
  views: number;
  likes: number;
  comments: number;
  engagementRate: number;
  uploadDate: string;
  duration: string;
  hashtags: string[];
  transcript: string;
  isLoading: boolean;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  sources?: ChatSource[];
  isStreaming?: boolean;
};

export type ChatSource = {
  id?: string;
  videoId?: string;
  videoLabel?: string;
  chunkIndex?: number;
  timestamp?: string;
  snippet?: string;
  highlight?: string;
  label?: string;
  url?: string;
};

type DashboardState = {
  youtubeUrl: string;
  instagramUrl: string;
  isAnalyzing: boolean;
  analysisStep: number;
  analysisProgress: number;
  analysisStatus: string;
  videos: VideoCard[];
  messages: ChatMessage[];
  input: string;
  isStreaming: boolean;
  status: "idle" | "connected" | "reconnecting";
  setYoutubeUrl: (value: string) => void;
  setInstagramUrl: (value: string) => void;
  setIsAnalyzing: (value: boolean) => void;
  setAnalysisStep: (value: number) => void;
  setAnalysisProgress: (value: number) => void;
  setAnalysisStatus: (value: string) => void;
  setInput: (value: string) => void;
  updateVideo: (id: string, patch: Partial<VideoCard>) => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, patch: Partial<ChatMessage>) => void;
  appendToMessage: (id: string, chunk: string) => void;
  resetChat: () => void;
  setStreaming: (value: boolean) => void;
  setStatus: (value: DashboardState["status"]) => void;
};

const initialVideos: VideoCard[] = [
  {
    id: "video-a",
    label: "Video A",
    platform: "YouTube",
    title: "Retention hooks: first 9 seconds",
    url: "https://youtube.com/watch?v=example",
    notes: "Primary comparison target.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=900&q=80",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    creatorName: "Nova Ellis",
    followerCount: 1240000,
    views: 3200000,
    likes: 184000,
    comments: 9200,
    engagementRate: 0.078,
    uploadDate: "May 10, 2026",
    duration: "0:42",
    hashtags: ["#retention", "#shorts", "#creator"],
    transcript:
      "Hook: Stop scrolling if you want 20% more watch time.\n\nWe broke down the first nine seconds to isolate the strongest moment.\n\nCTA: Save this breakdown and test it today.",
    isLoading: false,
  },
  {
    id: "video-b",
    label: "Video B",
    platform: "Instagram",
    title: "Hook breakdown: 7 seconds to watch time",
    url: "https://instagram.com/reel/example",
    notes: "Secondary comparison target.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80",
    embedUrl: "https://www.youtube.com/embed/ysz5S6PUM-U",
    creatorName: "Jules Carter",
    followerCount: 860000,
    views: 2450000,
    likes: 141000,
    comments: 5100,
    engagementRate: 0.069,
    uploadDate: "May 14, 2026",
    duration: "0:37",
    hashtags: ["#reels", "#growth", "#storyhook"],
    transcript:
      "First shot: show the outcome before the setup.\n\nLayer in captions that mirror the audio beats.\n\nFinish with a single-step challenge.",
    isLoading: false,
  },
];

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      youtubeUrl: "",
      instagramUrl: "",
      isAnalyzing: false,
      analysisStep: -1,
      analysisProgress: 0,
      analysisStatus: "Idle",
      videos: initialVideos,
      messages: [],
      input: "",
      isStreaming: false,
      status: "idle",
      setYoutubeUrl: (youtubeUrl) => set({ youtubeUrl }),
      setInstagramUrl: (instagramUrl) => set({ instagramUrl }),
      setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
      setAnalysisStep: (analysisStep) => set({ analysisStep }),
      setAnalysisProgress: (analysisProgress) => set({ analysisProgress }),
      setAnalysisStatus: (analysisStatus) => set({ analysisStatus }),
      setInput: (input) => set({ input }),
      updateVideo: (id, patch) =>
        set((state) => ({
          videos: state.videos.map((video) =>
            video.id === id ? { ...video, ...patch } : video,
          ),
        })),
      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),
      updateMessage: (id, patch) =>
        set((state) => ({
          messages: state.messages.map((message) =>
            message.id === id ? { ...message, ...patch } : message,
          ),
        })),
      appendToMessage: (id, chunk) =>
        set((state) => ({
          messages: state.messages.map((message) =>
            message.id === id
              ? { ...message, content: `${message.content}${chunk}` }
              : message,
          ),
        })),
      resetChat: () => set({ messages: [], input: "", isStreaming: false }),
      setStreaming: (isStreaming) => set({ isStreaming }),
      setStatus: (status) => set({ status }),
    }),
    {
      name: "rag-chatbot-chat",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : noopStorage,
      ),
      partialize: (state) => ({ messages: state.messages }),
    },
  ),
);
