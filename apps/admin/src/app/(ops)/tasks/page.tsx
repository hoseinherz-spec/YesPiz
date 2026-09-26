"use client";
import { DataList } from "@/components/AdminTable";
import { FormScope, Form, Input, Select } from "@/components/AdminForms";

import { growthClient, type OperationsTask } from "@repo/api";
import { Button } from "@heroui/react";
import { useCallback, useEffect, useState } from "react";
import { requireAdminToken } from "@/lib/auth";
export default function TasksPage() {
  const [rows, setRows] = useState<OperationsTask[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [title, setTitle] = useState("");
  const [area, setArea] = useState("operations");
  const [dueAt, setDueAt] = useState("");
  const [filter, setFilter] = useState("all");
  const load = useCallback(async () => {
    try {
      setRows(await growthClient.tasks({ accessToken: requireAdminToken() }));
      setError("");
      setLoaded(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load tasks.");
    }
  }, []);
  useEffect(() => {
    // Defer initial loading so synchronous auth/storage failures update after the effect.
    void Promise.resolve().then(load);
  }, [load]);
  async function create() {
    setBusy(true);
    setError("");
    try {
      await growthClient.createTask(
        { title, area, dueAt: new Date(dueAt).toISOString() },
        { accessToken: requireAdminToken() },
      );
      setTitle("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to create.");
    } finally {
      setBusy(false);
    }
  }
  async function update(row: OperationsTask, status: OperationsTask["status"]) {
    setBusy(true);
    setError("");
    try {
      await growthClient.updateTask(
        row._id,
        { revision: row.revision, status },
        { accessToken: requireAdminToken() },
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <FormScope>
      {
        <div className="mx-auto max-w-6xl space-y-7">
          <header className="flex flex-wrap justify-between gap-4">
            <div>
              <p className="text-sm text-muted">Team execution</p>
              <h1 className="mt-2 text-3xl font-semibold">
                From the next shift to the next campaign
              </h1>
              <p className="mt-3 text-sm text-muted">
                Owned tasks for operations, quality, finance, marketing and
                partner onboarding.
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
          <Form
            onSubmit={(e) => {
              e.preventDefault();
              void create();
            }}
            className="flex flex-wrap items-end gap-4 rounded-3xl bg-card p-6"
          >
            <Input
              label={<>Task</>}
              wrapperClassName="min-w-64 flex-1 text-sm"
              required
              minLength={5}
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2 w-full rounded-xl bg-field-background p-3"
            />
            <Select
              label={<>Area</>}
              wrapperClassName="text-sm"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="mt-2 block rounded-xl bg-field-background p-3"
            >
              {[
                "operations",
                "quality",
                "finance",
                "marketing",
                "partners",
              ].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </Select>
            <Input
              label={<>Due</>}
              wrapperClassName="text-sm"
              required
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              className="mt-2 block rounded-xl bg-field-background p-3"
            />
            <Button type="submit" isDisabled={busy}>
              Add task
            </Button>
          </Form>
          <Select
            label={<>Filter area</>}
            wrapperClassName="block text-sm"
            className="ml-3 rounded-xl bg-field-background p-3"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {[
              "all",
              "operations",
              "quality",
              "finance",
              "marketing",
              "partners",
            ].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </Select>
          <div className="grid gap-5 lg:grid-cols-3">
            {(["todo", "doing", "done"] as const).map((status) => (
              <section key={status}>
                <h2 className="mb-4 text-lg font-semibold">
                  {status === "todo"
                    ? "To do"
                    : status === "doing"
                      ? "In progress"
                      : "Done"}{" "}
                  <span className="text-muted">
                    {
                      rows.filter(
                        (row) =>
                          row.status === status &&
                          (filter === "all" || row.area === filter),
                      ).length
                    }
                  </span>
                </h2>
                <div className="space-y-3">
                  {
                    <DataList
                      data={rows.filter(
                        (row) =>
                          row.status === status &&
                          (filter === "all" || row.area === filter),
                      )}
                      label={`${status} tasks`}
                      renderItem={(row) => (
                        <article
                          key={row._id}
                          className="rounded-2xl border border-border p-5"
                        >
                          <p className="text-xs text-muted">
                            {row.area} · {row.ownerId ? "Owned" : "Unassigned"}
                          </p>
                          <h3 className="mt-3 break-words font-semibold">
                            {row.title}
                          </h3>
                          <time className="mt-3 block text-xs text-muted">
                            Due {new Date(row.dueAt).toLocaleString()}
                          </time>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {status !== "doing" && (
                              <Button
                                size="sm"
                                variant="secondary"
                                isDisabled={busy}
                                onPress={() => void update(row, "doing")}
                              >
                                {status === "done" ? "Reopen" : "Claim & start"}
                              </Button>
                            )}
                            {status === "doing" && (
                              <Button
                                size="sm"
                                isDisabled={busy}
                                onPress={() => void update(row, "done")}
                              >
                                Complete
                              </Button>
                            )}
                          </div>
                          <details className="mt-4 text-xs text-muted">
                            <summary className="cursor-pointer">
                              History
                            </summary>
                            {row.history.map((event, i) => (
                              <p key={i} className="mt-2">
                                {event.status} ·{" "}
                                {new Date(event.at).toLocaleString()}
                              </p>
                            ))}
                          </details>
                        </article>
                      )}
                    />
                  }
                </div>
              </section>
            ))}
          </div>
          {loaded && !rows.length && (
            <p className="text-muted">
              Add your first shift checklist, quality review or marketing task.
            </p>
          )}
        </div>
      }
    </FormScope>
  );
}
