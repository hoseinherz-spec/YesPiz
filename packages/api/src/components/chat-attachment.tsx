"use client";
import { useEffect, useState } from "react";
export function ChatAttachment({
  id,
  contentType,
  accessToken,
}: {
  id: string;
  contentType: string;
  accessToken: string;
}) {
  const [url, setUrl] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(
    () => () => {
      if (url.startsWith("blob:")) URL.revokeObjectURL(url);
    },
    [url],
  );
  async function open() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8058"}/api/v1/media/${id}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: AbortSignal.timeout(20000),
        },
      );
      if (!response.ok) throw new Error("Unable to load attachment.");
      if (response.headers.get("content-type")?.includes("application/json"))
        setUrl((await response.json()).url);
      else setUrl(URL.createObjectURL(await response.blob()));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Attachment unavailable.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mt-2">
      {!url && (
        <button
          type="button"
          disabled={busy}
          className="min-h-11 rounded-full border border-current px-4 text-xs"
          onClick={() => void open()}
        >
          {busy ? "Loading…" : "Open attachment"}
        </button>
      )}
      {url &&
        (contentType.startsWith("image/") ? (
          <img
            src={url}
            alt="Order chat attachment"
            className="max-h-64 max-w-full rounded-xl"
          />
        ) : contentType.startsWith("audio/") ? (
          <audio controls preload="metadata" src={url} className="max-w-full" />
        ) : contentType.startsWith("video/") ? (
          <video
            controls
            playsInline
            preload="metadata"
            src={url}
            className="max-h-64 max-w-full rounded-xl"
          />
        ) : (
          <a
            href={url}
            download="order-attachment.pdf"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            Download PDF
          </a>
        ))}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
