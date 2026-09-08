"use client";
import { useEffect, useState } from "react";
export function MediaPreview({
  reference,
  accessToken,
}: {
  reference: string;
  accessToken: string;
}) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(
    () => () => {
      if (url.startsWith("blob:")) URL.revokeObjectURL(url);
    },
    [url],
  );
  async function preview() {
    setBusy(true);
    setError("");
    try {
      const id = /^media:([a-f0-9]{24})$/.exec(reference)?.[1];
      if (!id) throw new Error("This proof does not have a managed upload.");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8058"}/api/v1/media/${id}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!response.ok) throw new Error("Proof could not be loaded.");
      if (response.headers.get("content-type")?.includes("application/json"))
        setUrl((await response.json()).url);
      else setUrl(URL.createObjectURL(await response.blob()));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="my-2 space-y-2">
      <button
        disabled={busy}
        type="button"
        className="rounded border px-3 py-2"
        onClick={() => void preview()}
      >
        View uploaded proof
      </button>
      {url && (
        <img
          src={url}
          alt="Uploaded order proof"
          className="max-h-80 max-w-full rounded-xl"
        />
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
