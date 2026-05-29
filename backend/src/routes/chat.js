const express = require("express");
const crypto = require("crypto");

const router = express.Router();
const activeStreams = new Map();

const safeParseJson = (value, fallback) => {
  try {
    if (!value) return fallback;
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const sendSse = (res, event, payload) => {
  if (event) {
    res.write(`event: ${event}\n`);
  }
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
};

router.get("/stream", (req, res) => {
  const prompt = (req.query.prompt || "").toString().trim();
  const streamId =
    (req.query.streamId && req.query.streamId.toString()) ||
    crypto.randomUUID();

  const messages = safeParseJson(req.query.messages, []);
  const videos = safeParseJson(req.query.videos, []);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  // Encourage clients to retry quickly if the connection drops.
  res.write("retry: 2000\n\n");

  const contextSize = Array.isArray(messages) ? messages.length : 0;
  const tokens = [
    "Analyzing both videos... ",
    "Video A holds attention earlier in the opening sequence. ",
    "Video B has a cleaner CTA but slower hook velocity. ",
    `Prompt considered: ${prompt || "Compare the two videos"}. `,
    `Conversation context messages: ${contextSize}. `,
    "Recommendation: lead with the strongest visual proof in second 1.",
  ];

  const firstVideo = Array.isArray(videos) ? videos[0] : null;
  const secondVideo = Array.isArray(videos) ? videos[1] : null;

  sendSse(res, "start", { streamId });

  let index = 0;
  const intervalId = setInterval(() => {
    if (res.writableEnded) {
      clearInterval(intervalId);
      activeStreams.delete(streamId);
      return;
    }

    if (index < tokens.length) {
      sendSse(res, "token", { token: tokens[index] });
      index += 1;
      return;
    }

    const sources = [
      {
        id: `${streamId}-source-1`,
        videoId: firstVideo?.id || "video-a",
        videoLabel: firstVideo?.label || "Video A",
        chunkIndex: 12,
        timestamp: "0:14",
        snippet:
          "This hook creates curiosity and makes viewers wait for the payoff.",
        highlight: "creates curiosity",
      },
      {
        id: `${streamId}-source-2`,
        videoId: secondVideo?.id || "video-b",
        videoLabel: secondVideo?.label || "Video B",
        chunkIndex: 9,
        timestamp: "0:11",
        snippet:
          "The CTA appears too early, reducing sustained watch behavior.",
        highlight: "CTA appears too early",
      },
    ];

    sendSse(res, "sources", { sources });
    sendSse(res, "done", { streamId });

    clearInterval(intervalId);
    activeStreams.delete(streamId);
    res.end();
  }, 260);

  activeStreams.set(streamId, {
    intervalId,
    response: res,
  });

  req.on("close", () => {
    const stream = activeStreams.get(streamId);
    if (stream) {
      clearInterval(stream.intervalId);
      activeStreams.delete(streamId);
    }
  });
});

router.post("/abort/:streamId", (req, res) => {
  const { streamId } = req.params;
  const stream = activeStreams.get(streamId);

  if (!stream) {
    return res.json({ ok: true, message: "No active stream" });
  }

  clearInterval(stream.intervalId);
  sendSse(stream.response, "aborted", { streamId });
  stream.response.end();
  activeStreams.delete(streamId);

  return res.json({ ok: true, streamId });
});

module.exports = router;
