"use client";

import { memo, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { VideoCard as VideoCardData } from "@/stores/dashboardStore";

const formatCount = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};

const formatRate = (value: number) => `${(value * 100).toFixed(1)}%`;

type VideoCardProps = {
  video: VideoCardData;
  index?: number;
};

const PlatformIcon = ({
  platform,
}: {
  platform: VideoCardData["platform"];
}) => {
  if (platform === "YouTube") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M23.2 7.2a3.1 3.1 0 0 0-2.2-2.2C19.1 4.5 12 4.5 12 4.5s-7.1 0-9 0.5A3.1 3.1 0 0 0 0.8 7.2 32.7 32.7 0 0 0 0.3 12c0 1.7 0.2 3.5 0.5 4.8a3.1 3.1 0 0 0 2.2 2.2c1.9 0.5 9 0.5 9 0.5s7.1 0 9-0.5a3.1 3.1 0 0 0 2.2-2.2c0.3-1.3 0.5-3.1 0.5-4.8s-0.2-3.5-0.5-4.8zm-13 8.1V8.7l6 3.3-6 3.3z" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M7 3.5h10A3.5 3.5 0 0 1 20.5 7v10A3.5 3.5 0 0 1 17 20.5H7A3.5 3.5 0 0 1 3.5 17V7A3.5 3.5 0 0 1 7 3.5zm0 1.8A1.7 1.7 0 0 0 5.3 7v10A1.7 1.7 0 0 0 7 18.7h10A1.7 1.7 0 0 0 18.7 17V7A1.7 1.7 0 0 0 17 5.3H7zm10 1.7a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm-5 1.3a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm0 1.8a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4z" />
    </svg>
  );
};

const SkeletonBlock = ({ className }: { className: string }) => (
  <div
    className={`animate-pulse rounded-2xl bg-[rgba(255,255,255,0.06)] ${className}`}
  />
);

function VideoCard({ video, index = 0 }: VideoCardProps) {
  const [copied, setCopied] = useState(false);
  const metrics = useMemo(
    () => [
      { label: "Followers", value: formatCount(video.followerCount) },
      { label: "Views", value: formatCount(video.views) },
      { label: "Likes", value: formatCount(video.likes) },
      { label: "Comments", value: formatCount(video.comments) },
      { label: "Engagement", value: formatRate(video.engagementRate) },
      { label: "Duration", value: video.duration },
      { label: "Upload", value: video.uploadDate },
    ],
    [
      video.comments,
      video.duration,
      video.engagementRate,
      video.followerCount,
      video.likes,
      video.uploadDate,
      video.views,
    ],
  );

  const handleCopyTranscript = async () => {
    if (!video.transcript) return;
    try {
      await navigator.clipboard.writeText(video.transcript);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08 }}
      className="group relative rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgb(var(--panel-elevated)/0.7)] p-6 shadow-[0_18px_40px_rgba(5,8,16,0.5)] backdrop-blur-md transition-shadow hover:shadow-[0_28px_60px_rgba(5,10,18,0.6)]"
    >
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,rgba(34,211,238,0),rgba(34,211,238,0.8),rgba(139,92,246,0.8),rgba(34,211,238,0))] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgb(var(--panel)/0.6)]">
          {video.isLoading ? (
            <SkeletonBlock className="h-40 w-full" />
          ) : (
            <img
              src={video.thumbnailUrl}
              alt={`${video.title} thumbnail`}
              className="h-40 w-full object-cover"
              loading="lazy"
            />
          )}
          <div className="absolute left-3 top-3 flex items-center gap-2 rounded-2xl border border-[rgba(34,211,238,0.35)] bg-[rgba(11,15,25,0.7)] px-3 py-1 text-xs font-semibold text-[rgb(var(--accent-cyan))]">
            <PlatformIcon platform={video.platform} />
            <span>{video.platform}</span>
          </div>
          <div className="absolute bottom-3 left-3 rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(11,15,25,0.6)] px-3 py-1 text-xs text-[rgb(var(--text-secondary))]">
            {video.label}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgb(var(--panel)/0.6)]">
          {video.isLoading ? (
            <SkeletonBlock className="h-40 w-full" />
          ) : video.embedUrl ? (
            <iframe
              src={video.embedUrl}
              title={`${video.title} preview`}
              className="h-40 w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="flex h-40 items-center justify-center text-xs text-[rgb(var(--text-secondary))]">
              Preview unavailable
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-1">
        {video.isLoading ? (
          <SkeletonBlock className="h-5 w-3/4" />
        ) : (
          <h3 className="text-lg font-semibold tracking-tight text-[rgb(var(--text-primary))]">
            {video.title}
          </h3>
        )}
        {video.isLoading ? (
          <SkeletonBlock className="h-4 w-1/3" />
        ) : (
          <p className="text-xs text-[rgb(var(--text-secondary))]">
            by {video.creatorName}
          </p>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(11,15,25,0.55)] px-3 py-2"
          >
            <p className="text-[11px] text-[rgb(var(--text-secondary))]">
              {metric.label}
            </p>
            {video.isLoading ? (
              <SkeletonBlock className="mt-2 h-4 w-20" />
            ) : (
              <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                {metric.value}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {video.isLoading
          ? Array.from({ length: 3 }).map((_, indexValue) => (
              <SkeletonBlock key={indexValue} className="h-6 w-20" />
            ))
          : video.hashtags.map((tag) => (
              <span
                key={tag}
                className="rounded-2xl border border-[rgba(139,92,246,0.35)] bg-[rgba(139,92,246,0.12)] px-3 py-1 text-xs text-[rgb(var(--accent-purple))]"
              >
                {tag}
              </span>
            ))}
      </div>

      <div className="mt-4 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(11,15,25,0.5)] p-4">
        <div className="flex items-center justify-between text-xs text-[rgb(var(--text-secondary))]">
          <span>Transcript preview</span>
          <button
            type="button"
            onClick={handleCopyTranscript}
            disabled={!video.transcript}
            className="rounded-2xl border border-[rgba(255,255,255,0.08)] px-3 py-1 text-xs text-[rgb(var(--text-primary))] transition disabled:opacity-50"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        {video.isLoading ? (
          <div className="mt-3 space-y-2">
            <SkeletonBlock className="h-3 w-full" />
            <SkeletonBlock className="h-3 w-5/6" />
            <SkeletonBlock className="h-3 w-2/3" />
          </div>
        ) : (
          <div className="mt-3 max-h-28 overflow-y-auto text-sm text-[rgb(var(--text-primary))]">
            {video.transcript ? (
              <p className="whitespace-pre-line leading-relaxed">
                {video.transcript}
              </p>
            ) : (
              <p className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-xs text-rose-200">
                Transcript unavailable for this source. Retry analysis after the
                video finishes processing.
              </p>
            )}
          </div>
        )}
      </div>
    </motion.article>
  );
}

export default memo(VideoCard);
