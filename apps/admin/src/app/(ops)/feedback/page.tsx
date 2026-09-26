"use client";
import { DataList } from "@/components/AdminTable";
import { AdminTable } from "@/components/AdminTable";
import { FormScope, Select } from "@/components/AdminForms";

import { CommentPublication } from "@/components/CommentPublication";
import { careClient, type FeedbackMetrics } from "@repo/api";
import { Button } from "@heroui/react";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { requireAdminToken } from "@/lib/auth";
export default function FeedbackPage() {
  const [data, setData] = useState<FeedbackMetrics | null>(null);
  const [error, setError] = useState("");
  const [provider, setProvider] = useState("");
  const load = useCallback(async () => {
    try {
      setData(await careClient.metrics({ accessToken: requireAdminToken() }));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load feedback.");
    }
  }, []);
  useEffect(() => {
    // Defer initial loading so synchronous auth/storage failures update after the effect.
    void Promise.resolve().then(load);
  }, [load]);
  const total =
    data?.providers.reduce((sum, row) => sum + row.responses, 0) ?? 0;
  return (
    <FormScope>
      {
        <div className="mx-auto max-w-6xl space-y-8">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted">
                Quality control · private to admins
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                The voice behind every pizza
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
                Verified post-delivery surveys from the last 90 days. Scores
                stay internal. Only permitted, administrator-approved comment
                excerpts appear on the selected pizza page.
              </p>
            </div>
            <Button variant="secondary" onPress={() => void load()}>
              Refresh
            </Button>
          </header>
          {error && (
            <p role="alert" className="text-danger">
              {error}
            </p>
          )}
          {!data && !error && <p role="status">Loading feedback…</p>}
          {data && (
            <>
              <div className="flex flex-wrap gap-8 rounded-3xl bg-card p-6">
                <div>
                  <p className="text-4xl font-semibold tabular-nums">{total}</p>
                  <p className="mt-2 text-sm text-muted">Verified responses</p>
                </div>
                <div>
                  <p className="text-4xl font-semibold tabular-nums">
                    {data.providers.length}
                  </p>
                  <p className="mt-2 text-sm text-muted">
                    Kitchens with feedback
                  </p>
                </div>
                <p className="max-w-md text-sm leading-6 text-muted">
                  Quality score = average taste, temperature and packaging × 20.
                  Delivery is tracked separately. Small samples are labelled;
                  surveys do not automatically penalize a kitchen.
                </p>
              </div>
              {!total ? (
                <section className="rounded-3xl border border-border p-8">
                  <h2 className="text-xl font-semibold">
                    Waiting for the first delivered pizza
                  </h2>
                  <p className="mt-3 text-muted">
                    Customers can send a private survey from their order
                    history. Verified responses will appear here.
                  </p>
                </section>
              ) : (
                <section className="overflow-x-auto">
                  <AdminTable
                    aria-label="Kitchen feedback"
                    className="w-full text-left text-sm"
                  >
                    <caption className="sr-only">
                      Internal kitchen quality by verified surveys
                    </caption>
                    <thead className="text-muted">
                      <tr>
                        {[
                          "Kitchen",
                          "Quality / 100",
                          "Responses",
                          "Taste",
                          "Temperature",
                          "Packaging",
                          "Delivery",
                          "Would reorder",
                        ].map((label) => (
                          <th
                            key={label}
                            className="whitespace-nowrap border-b border-border px-3 py-4 font-medium"
                          >
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.providers.map((row) => (
                        <tr key={row.providerId}>
                          <td className="border-b border-border px-3 py-5">
                            <Link
                              className="font-semibold underline"
                              href={`/quality/${row.providerId}`}
                            >
                              {row.name || row.providerId.slice(-6)}
                            </Link>
                          </td>
                          <td className="border-b border-border px-3 py-5 text-lg font-semibold tabular-nums">
                            {row.score.toFixed(1)}
                          </td>
                          <td className="border-b border-border px-3 py-5">
                            {row.responses}
                            {row.responses < 5 && (
                              <span className="block text-xs text-muted">
                                Small sample
                              </span>
                            )}
                          </td>
                          {[
                            row.taste,
                            row.temperature,
                            row.packaging,
                            row.delivery,
                          ].map((value, i) => (
                            <td
                              key={i}
                              className="border-b border-border px-3 py-5 tabular-nums"
                            >
                              {value.toFixed(1)} / 5
                            </td>
                          ))}
                          <td className="border-b border-border px-3 py-5">
                            {Math.round(row.repeatIntent * 100)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </AdminTable>
                </section>
              )}
              <section>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h2 className="text-xl font-semibold">
                    Comments & survey details
                  </h2>
                  <Select
                    aria-label="Filter feedback by kitchen"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="rounded-xl bg-field-background p-3"
                  >
                    <option value="">All kitchens</option>
                    {data.providers.map((row) => (
                      <option key={row.providerId} value={row.providerId}>
                        {row.name || row.providerId}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="mt-5 space-y-3">
                  {
                    <DataList
                      data={data.recent.filter(
                        (row) => !provider || row.providerId === provider,
                      )}
                      label="feedback"
                      renderItem={(row) => (
                        <article
                          key={row._id}
                          className="rounded-2xl bg-card p-5"
                        >
                          <div className="flex flex-wrap justify-between gap-3 text-sm text-muted">
                            <span>
                              Order #{row.orderId.slice(-6)} ·{" "}
                              {data.providers.find(
                                (p) => p.providerId === row.providerId,
                              )?.name || row.providerId.slice(-6)}
                            </span>
                            <time>
                              {new Date(row.createdAt).toLocaleString()}
                            </time>
                          </div>
                          <p className="mt-3 whitespace-pre-wrap break-words">
                            {row.comment ||
                              "Survey submitted without a comment."}
                          </p>
                          <p className="mt-3 text-sm text-muted">
                            Taste {row.taste} · Temperature {row.temperature} ·
                            Packaging {row.packaging} · Delivery {row.delivery}{" "}
                            · Order again: {row.wouldOrderAgain ? "Yes" : "No"}
                          </p>
                          <CommentPublication
                            key={`${row._id}:${row.moderationRevision ?? 0}`}
                            row={row}
                            onChange={load}
                          />
                        </article>
                      )}
                    />
                  }
                </div>
              </section>
            </>
          )}
        </div>
      }
    </FormScope>
  );
}
