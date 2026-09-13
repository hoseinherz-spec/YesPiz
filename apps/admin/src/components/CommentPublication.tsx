"use client";
import { FormAction, FormScope, Select, TextArea, Input } from "@repo/ui/forms";

import { useState } from "react";

import { careClient, type FeedbackMetrics } from "@repo/api";
import { requireAdminToken } from "@/lib/auth";
type Review = FeedbackMetrics["recent"][number];
export function CommentPublication({
  row,
  onChange,
}: {
  row: Review;
  onChange: () => Promise<void>;
}) {
  const [pizza, setPizza] = useState(
    row.publishedPizzaId || row.pizzaItems?.[0]?.id || "",
  );
  const [text, setText] = useState(row.publishedText || row.comment);
  const [reviewed, setReviewed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function save(published: boolean) {
    setBusy(true);
    setError("");
    try {
      await careClient.moderate(
        row._id,
        {
          revision: row.moderationRevision ?? 0,
          published,
          pizzaId: pizza,
          text,
        },
        { accessToken: requireAdminToken() },
      );
      setReviewed(false);
      await onChange();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to update publication.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (!row.allowPublication)
    return (
      <p className="mt-4 text-sm text-muted">
        Internal only · customer has not permitted publication.
      </p>
    );
  if (!row.comment.trim()) return null;
  return (
    <FormScope>
      {
        <FormScope>
          <div className="mt-5 space-y-3 border-t border-border pt-4">
            <p className="text-sm font-semibold">
              {row.published ? "Published anonymously" : "Not published"}
            </p>
            <Select
              searchable
              label={<>Pizza for this comment</>}
              wrapperClassName="block text-sm"
              className="mt-2 block w-full rounded-xl bg-field-background p-3"
              value={pizza}
              onChange={(e) => {
                setPizza(e.target.value);
                setReviewed(false);
              }}
            >
              {row.pizzaItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
            <TextArea
              label={<>Public text — exact comment or excerpt</>}
              wrapperClassName="block text-sm"
              className="mt-2 block min-h-24 w-full rounded-xl bg-field-background p-3"
              value={text}
              maxLength={2000}
              onChange={(e) => {
                setText(e.target.value);
                setReviewed(false);
              }}
            />
            <Input
              label={
                <>
                  I checked that this excerpt describes the selected pizza,
                  preserves the original meaning and contains no restaurant
                  identity, addresses or personal information.
                </>
              }
              wrapperClassName="flex items-start gap-3 text-sm"
              type="checkbox"
              checked={reviewed}
              onChange={(e) => setReviewed(e.target.checked)}
            />
            {error && (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <FormAction
                isDisabled={busy || !reviewed || !text.trim() || !pizza}
                onPress={() => void save(true)}
              >
                {row.published
                  ? "Update approved comment"
                  : "Approve & publish"}
              </FormAction>
              {row.published && (
                <FormAction
                  variant="secondary"
                  isDisabled={busy}
                  onPress={() => void save(false)}
                >
                  Unpublish comment
                </FormAction>
              )}
            </div>
          </div>
        </FormScope>
      }
    </FormScope>
  );
}
