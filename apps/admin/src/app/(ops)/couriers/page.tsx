"use client";
import { QrCode } from "@repo/api/components/qr-code";
import { useCallback, useEffect, useState } from "react";
import { couriersClient } from "@repo/api";
import { requireAdminToken } from "@/lib/auth";
export default function CourierShiftsPage() {
  const [rows, setRows] = useState<
    Awaited<ReturnType<typeof couriersClient.operations>>
  >([]);
  const [issued, setIssued] = useState<{
    code: string;
    expiresAt: string;
    name: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    setRows(
      await couriersClient.operations({ accessToken: requireAdminToken() }),
    );
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load().catch(() => setError("Unable to load couriers."));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  async function issue(userId: string, name: string, action: "start" | "end") {
    setBusy(true);
    setError("");
    setIssued(null);
    try {
      const result = await couriersClient.issueCode(userId, action, {
        accessToken: requireAdminToken(),
      });
      setIssued({ ...result, name });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to issue code.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-5">
      <h1 className="text-2xl font-bold">Courier shifts</h1>
      <p>
        Issue a single-use code to the courier. Codes expire after ten minutes.
        Finish or reassign deliveries before ending a shift.
      </p>
      {error && <p role="alert">{error}</p>}
      {issued && (
        <div role="status" className="rounded-xl border p-4">
          <p>
            {issued.name} · Expires{" "}
            {new Date(issued.expiresAt).toLocaleTimeString()}
          </p>
          <QrCode value={issued.code} />
          <code className="break-all select-all">{issued.code}</code>
        </div>
      )}
      <button
        className="rounded-lg border px-4 py-2"
        onClick={() => void load().catch(() => setError("Refresh failed."))}
      >
        Refresh
      </button>
      <div className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.userId}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
          >
            <div>
              <strong>{row.name}</strong>
              <p>{row.session ? "On duty" : "Off duty"}</p>
            </div>
            <button
              disabled={busy}
              className="rounded-lg border px-4 py-2 disabled:opacity-50"
              onClick={() =>
                void issue(row.userId, row.name, row.session ? "end" : "start")
              }
            >
              Issue {row.session ? "end" : "start"} code
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
