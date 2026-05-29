import { create } from "zustand";

export type VideoPlatform = "YouTube" | "Instagram";

export type VideoCard = {
  id: string;
  label: string;
  platform: VideoPlatform;
  title: string;
  url: string;
  notes: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

type DashboardState = {
  videos: VideoCard[];
  messages: ChatMessage[];
  input: string;
  isStreaming: boolean;
  status: "idle" | "connected" | "reconnecting";
  setInput: (value: string) => void;
  updateVideo: (id: string, patch: Partial<VideoCard>) => void;
  addMessage: (message: ChatMessage) => void;
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
    notes: "Primary comparison target."
  },
  {
    id: "video-b",
    label: "Video B",
    platform: "Instagram",
    title: "Hook breakdown: 7 seconds to watch time",
    url: "https://instagram.com/reel/example",
    notes: "Secondary comparison target."
  }
];

export const useDashboardStore = create<DashboardState>((set) => ({
  videos: initialVideos,
  messages: [],
  input: "",
  isStreaming: false,
  status: "idle",
  setInput: (input) => set({ input }),
  updateVideo: (id, patch) =>
    set((state) => ({
      videos: state.videos.map((video) =>
        video.id === id ? { ...video, ...patch } : video
      )
    })),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setStreaming: (isStreaming) => set({ isStreaming }),
  setStatus: (status) => set({ status })
}));
