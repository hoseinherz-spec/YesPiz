"use client";
import { Input, FormScope, FormValue, FormAction, z } from "@repo/ui/forms";
import { Button as FormButton } from "@heroui/react";

import { MediaPreview } from "./media-preview";
import { useRef, useState } from "react";
import { apiRequest, withAuth } from "../core";

type Props = {
  orderId: string;
  accessToken: string;
  purpose: "ready" | "dropoff" | "signature" | "incident";
  onUploaded: (reference: string) => void;
};
export function ProofUpload({
  orderId,
  accessToken,
  purpose,
  onUploaded,
}: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function upload(dataUrl: string) {
    setBusy(true);
    setMessage("");
    try {
      const result = await apiRequest<{ reference: string }>(
        "/api/v1/media",
        withAuth({
          accessToken,
          method: "POST",
          body: {
            orderId,
            purpose,
            contentType: dataUrl.startsWith("data:image/png")
              ? "image/png"
              : "image/jpeg",
            base64: dataUrl.split(",")[1],
          },
        }),
      );
      setReference(result.reference);
      onUploaded(result.reference);
      setMessage("Proof uploaded.");
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Upload failed. Please retry.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function photo(file?: File) {
    if (!file) return;
    if (
      !["image/jpeg", "image/png"].includes(file.type) ||
      file.size > 20 * 1024 * 1024
    ) {
      setMessage("Choose a JPEG or PNG up to 20 MB.");
      return;
    }
    setBusy(true);
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
      const output = document.createElement("canvas");
      output.width = Math.max(1, Math.round(img.width * scale));
      output.height = Math.max(1, Math.round(img.height * scale));
      output
        .getContext("2d")!
        .drawImage(img, 0, 0, output.width, output.height);
      await upload(output.toDataURL("image/jpeg", 0.85));
    } catch {
      setMessage("Unable to read this image. Try another photo.");
    } finally {
      URL.revokeObjectURL(url);
      setBusy(false);
    }
  }
  return (
    <FormScope>
      <div className="space-y-2">
        {purpose === "signature" ? (
          <>
            <FormValue
              name="signature"
              value={hasSignature}
              schema={z.literal(true, { error: "Add your signature first." })}
            />
            <p>Sign inside the box</p>
            <canvas
              ref={canvas}
              width={600}
              height={240}
              aria-label="Customer signature"
              className="w-full touch-none rounded-xl border bg-white"
              onPointerDown={(event) => {
                if (busy) return;
                drawing.current = true;
                event.currentTarget.setPointerCapture(event.pointerId);
                const rect = event.currentTarget.getBoundingClientRect();
                const ctx = event.currentTarget.getContext("2d")!;
                ctx.beginPath();
                ctx.moveTo(
                  ((event.clientX - rect.left) * 600) / rect.width,
                  ((event.clientY - rect.top) * 240) / rect.height,
                );
              }}
              onPointerMove={(event) => {
                if (!drawing.current) return;
                const rect = event.currentTarget.getBoundingClientRect();
                const ctx = event.currentTarget.getContext("2d")!;
                ctx.lineWidth = 3;
                ctx.lineCap = "round";
                ctx.lineTo(
                  ((event.clientX - rect.left) * 600) / rect.width,
                  ((event.clientY - rect.top) * 240) / rect.height,
                );
                ctx.stroke();
                setHasSignature(true);
              }}
              onPointerUp={() => {
                drawing.current = false;
              }}
              onPointerCancel={() => {
                drawing.current = false;
              }}
            />
            <FormButton
              variant="ghost"
              type="button"
              isDisabled={busy}
              className="min-h-11 rounded-full border border-border bg-card px-4 py-2"
              onPress={() => {
                canvas.current?.getContext("2d")?.clearRect(0, 0, 600, 240);
                setHasSignature(false);
              }}
            >
              Clear signature
            </FormButton>
            <FormAction
              variant="ghost"
              type="button"
              isDisabled={busy || !hasSignature}
              className="min-h-11 rounded-full border border-border bg-card px-4 py-2 disabled:opacity-50"
              onPress={() => {
                if (canvas.current)
                  void upload(canvas.current.toDataURL("image/png"));
              }}
            >
              Upload signature
            </FormAction>
          </>
        ) : (
          <Input
            label={
              <>
                {purpose === "ready"
                  ? "Ready photo"
                  : purpose === "incident"
                    ? "Incident photo"
                    : "Delivery photo"}
              </>
            }
            className="block w-full py-2"
            type="file"
            accept="image/jpeg,image/png"
            capture="environment"
            disabled={busy}
            onChange={(e) => void photo(e.target.files?.[0])}
          />
        )}
        {reference && (
          <MediaPreview reference={reference} accessToken={accessToken} />
        )}
        {busy && <p role="status">Uploading…</p>}
        {message && <p role="status">{message}</p>}
      </div>
    </FormScope>
  );
}
