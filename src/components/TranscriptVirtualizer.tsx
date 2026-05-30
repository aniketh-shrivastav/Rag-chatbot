"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";

type TranscriptVirtualizerProps = {
  transcript: string;
  className?: string;
  lineHeight?: number;
  overscan?: number;
};

function TranscriptVirtualizer({
  transcript,
  className,
  lineHeight = 22,
  overscan = 4,
}: TranscriptVirtualizerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [viewport, setViewport] = useState({ start: 0, end: 0 });

  const lines = useMemo(() => {
    const normalized = transcript.trim();
    if (!normalized) return [];
    return normalized.split(/\r?\n/);
  }, [transcript]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateWindow = () => {
      const visibleLines = Math.max(1, Math.ceil(element.clientHeight / lineHeight));
      const start = Math.max(0, Math.floor(element.scrollTop / lineHeight) - overscan);
      const end = Math.min(lines.length, start + visibleLines + overscan * 2);
      setViewport((current) =>
        current.start === start && current.end === end ? current : { start, end },
      );
    };

    updateWindow();

    const resizeObserver = new ResizeObserver(updateWindow);
    resizeObserver.observe(element);
    element.addEventListener("scroll", updateWindow, { passive: true });

    return () => {
      element.removeEventListener("scroll", updateWindow);
      resizeObserver.disconnect();
    };
  }, [lineHeight, lines.length, overscan]);

  if (!lines.length) {
    return null;
  }

  const start = viewport.start;
  const end = viewport.end || Math.min(lines.length, 12);
  const topPadding = start * lineHeight;
  const bottomPadding = Math.max(0, (lines.length - end) * lineHeight);
  const visibleLines = lines.slice(start, end);

  return (
    <div ref={containerRef} className={`max-h-36 overflow-y-auto ${className ?? ""}`}>
      <div style={{ paddingTop: topPadding, paddingBottom: bottomPadding }}>
        {visibleLines.map((line, index) => (
          <p
            key={`${start + index}-${line}`}
            className="whitespace-pre-line leading-relaxed"
            style={{ minHeight: lineHeight }}
          >
            {line || " "}
          </p>
        ))}
      </div>
    </div>
  );
}

export default memo(TranscriptVirtualizer);
