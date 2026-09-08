"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest, withAuth } from "../core";
export function OrderChat({
  orderId,
  accessToken,
}: {
  orderId: string;
  accessToken: string;
}) {
  const [messages, setMessages] = useState<
    Array<{ id: string; text: string; mine: boolean; senderRole: string }>
  >([]);
  const [text, setText] = useState("");
  const attempt = useRef<{ text: string; id: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const base = `/api/v1/communications/orders/${encodeURIComponent(orderId)}`;
  const load = useCallback(
    async () =>
      setMessages(
        await apiRequest<typeof messages>(
          `${base}/messages`,
          withAuth({ accessToken }),
        ),
      ),
    [base, accessToken],
  );
  useEffect(() => {
    void load().catch(() =>
      setError("Chat is available once a courier is assigned."),
    );
    const timer = setInterval(() => void load().catch(() => undefined), 5000);
    return () => clearInterval(timer);
  }, [load]);
  async function send() {
    if (!text.trim()) return;
    setBusy(true);
    setError("");
    if (attempt.current?.text !== text.trim())
      attempt.current = { text: text.trim(), id: crypto.randomUUID() };
    try {
      await apiRequest(
        `${base}/messages`,
        withAuth({
          accessToken,
          method: "POST",
          body: { text: attempt.current.text, clientId: attempt.current.id },
        }),
      );
      setText("");
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
      <h2 className="font-semibold">Delivery chat</h2>
      <div className="max-h-80 overflow-auto space-y-2" aria-live="polite">
        {messages.map((message) => (
          <p
            key={message.id}
            className={message.mine ? "text-right" : "text-left"}
          >
            <span className="text-xs opacity-60">
              {message.mine ? "You" : message.senderRole}
            </span>
            <br />
            {message.text}
          </p>
        ))}
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
        className="space-y-2"
      >
        <label>
          Message
          <textarea
            className="block w-full rounded-2xl border border-border bg-field-background p-3"
            value={text}
            maxLength={1000}
            onChange={(event) => setText(event.target.value)}
          />
        </label>
        <button
          disabled={busy || !text.trim()}
          className="min-h-11 rounded-full border border-border bg-card px-4 py-2 disabled:opacity-50"
        >
          Send message
        </button>
      </form>
      <button
        disabled={busy}
        className="min-h-11 rounded-full border border-border bg-card px-4 py-2 disabled:opacity-50"
        onClick={() => {
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
      </button>
      {error && <p role="alert">{error}</p>}
      {status && <p role="status">{status}</p>}
    </section>
  );
}
