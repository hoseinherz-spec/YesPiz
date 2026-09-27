"use client";
import { io } from "socket.io-client";
import { realtimeUrl } from "../domains/realtime/realtime.helper";
import { ChatAttachment } from "./chat-attachment";
import { Form, TextArea } from "@repo/ui/forms";
import { Button as FormButton } from "@heroui/react";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest, withAuth } from "../core";
export function OrderChat({
  orderId,
  accessToken,
  channel = "delivery",
}: {
  orderId: string;
  accessToken: string;
  channel?: "delivery" | "kitchen";
}) {
  const [messages, setMessages] = useState<
    Array<{
      id: string;
      text: string;
      mine: boolean;
      senderRole: string;
      attachment?: { id: string; contentType: string };
    }>
  >([]);
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const recorder = useRef<MediaRecorder | null>(null),
    stream = useRef<MediaStream | null>(null),
    recordTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [recording, setRecording] = useState(false);
  useEffect(
    () => () => {
      if (recordTimer.current) clearTimeout(recordTimer.current);
      if (recorder.current) {
        recorder.current.onstop = null;
        if (recorder.current.state !== "inactive") recorder.current.stop();
      }
      stream.current?.getTracks().forEach((t) => t.stop());
    },
    [],
  );
  async function upload(file?: File) {
    if (!file || busy) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Choose a file up to 5 MB.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1]!);
        reader.onerror = () => reject(new Error("Unable to read file."));
        reader.readAsDataURL(file);
      });
      const result = await apiRequest<{ id: string }>(
        "/api/v1/media",
        withAuth({
          accessToken,
          method: "POST",
          body: {
            orderId,
            purpose: "chat",
            contentType: file.type.split(";")[0],
            base64: data,
          },
        }),
      );
      setAttachment({ id: result.id, name: file.name });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Please retry.");
    } finally {
      setBusy(false);
    }
  }
  async function record() {
    if (recording) {
      recorder.current?.stop();
      return;
    }
    try {
      if (
        !navigator.mediaDevices?.getUserMedia ||
        typeof MediaRecorder === "undefined"
      )
        throw new Error(
          "Voice recording is unavailable in this browser. Attach an audio file instead.",
        );
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = media;
      const mime = ["audio/webm", "audio/mp4", "audio/ogg"].find((type) =>
        MediaRecorder.isTypeSupported(type),
      );
      if (!mime) {
        media.getTracks().forEach((t) => t.stop());
        throw new Error("This browser's audio format is unsupported.");
      }
      const rec = new MediaRecorder(media, { mimeType: mime });
      recorder.current = rec;
      const chunks: BlobPart[] = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      rec.onstop = () => {
        if (recordTimer.current) clearTimeout(recordTimer.current);
        media.getTracks().forEach((t) => t.stop());
        setRecording(false);
        void upload(new File(chunks, "Voice message", { type: mime }));
      };
      rec.onerror = () => {
        rec.onstop = null;
        if (recordTimer.current) clearTimeout(recordTimer.current);
        media.getTracks().forEach((t) => t.stop());
        setRecording(false);
        setError("Recording failed. Please retry.");
      };
      rec.start();
      setRecording(true);
      recordTimer.current = setTimeout(() => {
        if (rec.state !== "inactive") rec.stop();
      }, 60000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Microphone unavailable.");
    }
  }

  const attempt = useRef<{ text: string; mediaId?: string; id: string } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const base = `/api/v1/communications/orders/${encodeURIComponent(orderId)}`;
  const load = useCallback(
    async () =>
      setMessages(
        await apiRequest<typeof messages>(
          `${base}/${channel === "kitchen" ? "kitchen-messages" : "messages"}`,
          withAuth({ accessToken }),
        ),
      ),
    [base, accessToken, channel],
  );
  useEffect(() => {
    void load().catch(() =>
      setError("Chat is available once a courier is assigned."),
    );
    const timer = setInterval(() => {
      if (document.visibilityState === "visible")
        void load().catch(() => undefined);
    }, 5000);
    const socket = io(realtimeUrl(process.env.NEXT_PUBLIC_API_URL), { auth: { token: accessToken } });
    const refresh = () => { if (!document.hidden) void load().catch(() => undefined); };
    socket.on("connect", refresh);
    socket.on("messages.updated", (event: { orderId?: string; channel?: string }) => {
      if (event.orderId === orderId && event.channel === channel) refresh();
    });
    document.addEventListener("visibilitychange", refresh);
    return () => { clearInterval(timer); socket.disconnect(); document.removeEventListener("visibilitychange", refresh); };
  }, [load, accessToken, orderId, channel]);
  async function send() {
    if (busy || recording || (!text.trim() && !attachment)) return;
    setBusy(true);
    setError("");
    if (
      attempt.current?.text !== text.trim() ||
      attempt.current?.mediaId !== attachment?.id
    )
      attempt.current = {
        text: text.trim(),
        mediaId: attachment?.id,
        id: crypto.randomUUID(),
      };
    try {
      await apiRequest(
        `${base}/${channel === "kitchen" ? "kitchen-messages" : "messages"}`,
        withAuth({
          accessToken,
          method: "POST",
          body: {
            text: attempt.current.text,
            mediaId: attempt.current.mediaId,
            clientId: attempt.current.id,
          },
        }),
      );
      setText("");
      setAttachment(null);
      attempt.current = null;
      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Message was not confirmed. Retry to send.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-3 rounded-[28px] border border-border bg-card p-4">
      <h2 className="font-semibold">
        {channel === "kitchen" ? "Kitchen ↔ courier" : "Delivery chat"}
      </h2>
      {channel === "kitchen" && (
        <p className="text-sm text-muted">
          Private pickup coordination. Customers cannot see these messages.
          Verify the seal and pickup code before handoff.
        </p>
      )}
      <div className="max-h-80 overflow-auto space-y-2" aria-live="polite">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[90%] rounded-2xl p-3 ${message.mine ? "ml-auto bg-accent text-accent-foreground" : "bg-surface-secondary text-foreground"}`}
          >
            <span className="text-xs opacity-60">
              {message.mine ? "You" : message.senderRole}
            </span>
            <br />
            <p className="whitespace-pre-wrap break-words">{message.text}</p>
            {message.attachment && (
              <ChatAttachment
                {...message.attachment}
                accessToken={accessToken}
              />
            )}
          </div>
        ))}
      </div>
      {channel !== "kitchen" && (
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex min-h-11 cursor-pointer items-center rounded-full bg-surface-secondary px-4 text-xs">
            Attach file
            <input
              type="file"
              className="sr-only"
              disabled={busy || recording}
              accept="image/jpeg,image/png,application/pdf,audio/webm,audio/ogg,audio/mp4,video/mp4,video/webm"
              onChange={(e) => {
                void upload(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          <button
            type="button"
            disabled={busy}
            onClick={() => void record()}
            className="min-h-11 rounded-full bg-surface-secondary px-4 text-xs"
          >
            {recording ? "Stop recording (max 60s)" : "Record voice"}
          </button>
        </div>
      )}
      {attachment && (
        <div role="status" className="flex items-center gap-2 text-sm">
          <span>{attachment.name} ready to send</span>
          <button
            type="button"
            onClick={() => setAttachment(null)}
            disabled={busy}
          >
            Remove
          </button>
        </div>
      )}
      <Form
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
        className="space-y-2"
      >
        <TextArea
          label={<>Message</>}
          className="block w-full rounded-2xl border border-border bg-field-background p-3"
          disabled={busy}
          value={text}
          maxLength={1000}
          onChange={(event) => setText(event.target.value)}
        />
        <FormButton
          variant="ghost"
          type="submit"
          isDisabled={busy || recording || (!text.trim() && !attachment)}
          className="min-h-11 rounded-full border border-border bg-card px-4 py-2 disabled:opacity-50"
        >
          Send message
        </FormButton>
      </Form>
      <FormButton
        variant="ghost"
        type="button"
        isDisabled={busy}
        className="min-h-11 rounded-full border border-border bg-card px-4 py-2 disabled:opacity-50"
        onPress={() => {
          setBusy(true);
          setError("");
          void apiRequest<{ message: string }>(
            `${base}/call`,
            withAuth({ accessToken, method: "POST" }),
          )
            .then((result) => setStatus(result.message))
            .catch((err) =>
              setError(
                err instanceof Error ? err.message : "Call unavailable.",
              ),
            )
            .finally(() => setBusy(false));
        }}
      >
        Connect by phone
      </FormButton>
      {error && <p role="alert">{error}</p>}
      {status && <p role="status">{status}</p>}
    </section>
  );
}
