"use client";
import { DataList } from "@/components/AdminTable";
import { Input } from "@/components/AdminForms";
import { useCallback, useState } from "react";
import { Button } from "@heroui/react";
import { apiRequest, withAuth } from "@repo/api";
import { requireAdminToken } from "@/lib/auth";
import { useLoadOnMount } from "@/lib/load-on-mount";
type TeamUser = {
  _id: string;
  firstName: string;
  lastName: string;
  adminPermissions?: string[];
  adminPermissionsRevision?: number;
};
type Team = {
  permissions: string[];
  users: TeamUser[];
  events: {
    _id: string;
    actorId: string;
    targetId: string;
    fullAccess: boolean;
    createdAt: string;
  }[];
};
export default function TeamAccessPage() {
  const [data, setData] = useState<Team | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    try {
      setData(
        await apiRequest<Team>(
          "/api/v1/team-access",
          withAuth({ accessToken: requireAdminToken(), method: "GET" }),
        ),
      );
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load team access.");
    }
  }, []);
  useLoadOnMount(load);
  async function save(user: TeamUser) {
    setBusy(true);
    setNotice("");
    try {
      await apiRequest(
        `/api/v1/team-access/${user._id}`,
        withAuth({
          accessToken: requireAdminToken(),
          method: "POST",
          body: {
            revision: user.adminPermissionsRevision ?? 0,
            fullAccess: user.adminPermissions === undefined,
            permissions: user.adminPermissions ?? [],
          },
        }),
      );
      await load();
      setNotice(
        "Access saved. Changes apply on the next request, including existing sessions.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save access.");
    } finally {
      setBusy(false);
    }
  }
  function update(user: TeamUser, permissions: string[] | undefined) {
    setData((prev) =>
      prev
        ? {
            ...prev,
            users: prev.users.map((u) =>
              u._id === user._id ? { ...u, adminPermissions: permissions } : u,
            ),
          }
        : prev,
    );
  }
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Team access</h1>
        <p className="mt-2 text-sm text-muted">
          Limit each administrator to the work they need. Full administrators
          manage access. You cannot change your own full access here.
        </p>
      </header>
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-success">
          {notice}
        </p>
      )}
      <Button variant="secondary" onPress={() => void load()}>
        Reload team
      </Button>
      <DataList
        data={data?.users}
        label="team members"
        renderItem={(user) => (
          <section
            key={user._id}
            className="space-y-4 rounded-3xl border border-border bg-card p-5"
          >
            <h2 className="text-lg font-semibold">
              {user.firstName} {user.lastName}
            </h2>
            <p className="break-all text-xs text-muted">{user._id}</p>
            <div className="flex min-h-11 items-center gap-3 text-sm">
              <Input
                label={<>Full administrator access</>}
                type="checkbox"
                className="size-5"
                checked={user.adminPermissions === undefined}
                onChange={(e) =>
                  update(user, e.target.checked ? undefined : [])
                }
              />
            </div>
            {user.adminPermissions !== undefined && (
              <div className="grid gap-2 sm:grid-cols-2">
                {data?.permissions.map((permission) => (
                  <div
                    key={permission}
                    className="flex min-h-11 items-center gap-3 rounded-xl bg-surface-secondary px-3 text-sm"
                  >
                    <Input
                      label={<>{permission.replace(":", " · ")}</>}
                      type="checkbox"
                      className="size-5"
                      checked={user.adminPermissions!.includes(permission)}
                      onChange={(e) =>
                        update(
                          user,
                          e.target.checked
                            ? [...user.adminPermissions!, permission]
                            : user.adminPermissions!.filter(
                                (p) => p !== permission,
                              ),
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            )}
            <Button isDisabled={busy} onPress={() => void save(user)}>
              Save access
            </Button>
          </section>
        )}
      />
      <section className="rounded-3xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Recent changes</h2>
        {
          <DataList
            data={data?.events}
            label="access history"
            renderItem={(event) => (
              <p
                key={event._id}
                className="mt-3 break-words border-t border-border pt-3 text-xs"
              >
                {new Date(event.createdAt).toLocaleString()} · {event.actorId} →{" "}
                {event.targetId} ·{" "}
                {event.fullAccess ? "Full access" : "Limited access"}
              </p>
            )}
          />
        }
      </section>
    </div>
  );
}
