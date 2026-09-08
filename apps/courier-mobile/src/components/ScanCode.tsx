"use client";
import { useState } from "react";
export function ScanCode({ onScan }: { onScan: (code: string) => void }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function scan() {
    setBusy(true);
    setError("");
    try {
      const { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHint } =
        await import("@capacitor/barcode-scanner");
      const result = await CapacitorBarcodeScanner.scanBarcode({
        hint: CapacitorBarcodeScannerTypeHint.QR_CODE,
        scanInstructions: "Scan the dispatch or kitchen code",
      });
      if (result.ScanResult.trim()) onScan(result.ScanResult.trim());
    } catch {
      setError(
        "Unable to scan. Allow camera access or enter the code manually.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <button
        type="button"
        disabled={busy}
        className="rounded-xl border px-4 py-2"
        onClick={() => void scan()}
      >
        Scan QR code
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
