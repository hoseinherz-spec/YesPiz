"use client";
import { FormAction, FormScope, Input } from "@repo/ui/forms";

import { ApiError, providersClient, type Provider } from "@repo/api";
import { Button, Card, Typography } from "@heroui/react";
import { useCallback, useState } from "react";
import { requireAdminToken } from "@/lib/auth";
import { entityId } from "@/lib/ids";
import { useLoadOnMount } from "@/lib/load-on-mount";

const emptyForm = {
  userId: "",
  name: "",
  address: "",
  longitude: "11.5755",
  latitude: "48.1374",
  logoUrl: "",
};

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    address: "",
    acceptingOrders: true,
    isActive: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const token = requireAdminToken();
    const list = await providersClient.list({ accessToken: token });
    setProviders(list);
  }, []);

  useLoadOnMount(() =>
    load().catch((err) =>
      setError(
        err instanceof ApiError ? err.message : "Failed to load providers",
      ),
    ),
  );

  async function createProvider() {
    setBusy(true);
    setError(null);
    try {
      const token = requireAdminToken();
      await providersClient.create(
        {
          userId: form.userId.trim(),
          name: form.name.trim(),
          address: form.address.trim(),
          longitude: Number(form.longitude),
          latitude: Number(form.latitude),
          logoUrl: form.logoUrl.trim() || undefined,
        },
        { accessToken: token },
      );
      setForm(emptyForm);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit() {
    if (!editId) return;
    setBusy(true);
    setError(null);
    try {
      const token = requireAdminToken();
      await providersClient.update(
        editId,
        {
          name: editForm.name.trim(),
          address: editForm.address.trim(),
          acceptingOrders: editForm.acceptingOrders,
          isActive: editForm.isActive,
        },
        { accessToken: token },
      );
      setEditId(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormScope>
      {
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          <div>
            <Typography type="h1" className="text-2xl font-semibold">
              Providers
            </Typography>
            <p className="text-muted text-sm">
              List, create, and update kitchens
            </p>
          </div>

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <Card className="p-4">
            <FormScope>
              <Card.Content className="flex flex-col gap-3 p-0">
                <Typography type="h3" className="font-medium">
                  Create provider
                </Typography>
                <div className="grid gap-2 md:grid-cols-2">
                  {(
                    [
                      ["userId", "User ID"],
                      ["name", "Name"],
                      ["address", "Address"],
                      ["longitude", "Longitude"],
                      ["latitude", "Latitude"],
                      ["logoUrl", "Logo URL"],
                    ] as const
                  ).map(([key, label]) => (
                    <Input
                      label={<>{label}</>}
                      wrapperClassName="flex flex-col gap-1 text-sm"
                      key={key}
                      required={key !== "logoUrl"}
                      type={
                        key === "latitude" || key === "longitude"
                          ? "number"
                          : key === "logoUrl"
                            ? "url"
                            : "text"
                      }
                      min={
                        key === "latitude"
                          ? -90
                          : key === "longitude"
                            ? -180
                            : undefined
                      }
                      max={
                        key === "latitude"
                          ? 90
                          : key === "longitude"
                            ? 180
                            : undefined
                      }
                      step="any"
                      value={form[key]}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, [key]: e.target.value }))
                      }
                      className="border-border bg-background rounded-md border px-3 py-2"
                    />
                  ))}
                </div>
                <FormAction
                  variant="primary"
                  isDisabled={busy}
                  onPress={createProvider}
                >
                  Create
                </FormAction>
              </Card.Content>
            </FormScope>
          </Card>

          <div className="flex flex-col gap-3">
            {providers.map((p) => {
              const id = entityId(p);
              const editing = editId === id;
              return (
                <Card key={id} className="p-4">
                  <FormScope>
                    <Card.Content className="flex flex-col gap-2 p-0">
                      {!editing ? (
                        <>
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <Typography type="h3" className="font-medium">
                                {p.name}
                              </Typography>
                              <p className="text-muted text-sm">{p.address}</p>
                              <p className="text-muted text-xs">
                                id {id} · user {entityId({ id: p.userId })} ·
                                rating {p.rating} ·{" "}
                                {p.acceptingOrders ? "accepting" : "paused"} ·{" "}
                                {p.isActive ? "active" : "inactive"}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="secondary"
                              onPress={() => {
                                setEditId(id);
                                setEditForm({
                                  name: p.name,
                                  address: p.address,
                                  acceptingOrders: p.acceptingOrders,
                                  isActive: p.isActive,
                                });
                              }}
                            >
                              Edit
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <Input
                            label={<>Name</>}
                            wrapperClassName="flex flex-col gap-1 text-sm"
                            required
                            value={editForm.name}
                            onChange={(e) =>
                              setEditForm((f) => ({
                                ...f,
                                name: e.target.value,
                              }))
                            }
                            className="border-border bg-background rounded-md border px-3 py-2"
                          />
                          <Input
                            label={<>Address</>}
                            wrapperClassName="flex flex-col gap-1 text-sm"
                            required
                            value={editForm.address}
                            onChange={(e) =>
                              setEditForm((f) => ({
                                ...f,
                                address: e.target.value,
                              }))
                            }
                            className="border-border bg-background rounded-md border px-3 py-2"
                          />
                          <Input
                            label={<>Accepting orders</>}
                            wrapperClassName="flex items-center gap-2 text-sm"
                            type="checkbox"
                            checked={editForm.acceptingOrders}
                            onChange={(e) =>
                              setEditForm((f) => ({
                                ...f,
                                acceptingOrders: e.target.checked,
                              }))
                            }
                          />
                          <Input
                            label={<>Active</>}
                            wrapperClassName="flex items-center gap-2 text-sm"
                            type="checkbox"
                            checked={editForm.isActive}
                            onChange={(e) =>
                              setEditForm((f) => ({
                                ...f,
                                isActive: e.target.checked,
                              }))
                            }
                          />
                          <div className="flex gap-2">
                            <FormAction
                              variant="primary"
                              size="sm"
                              isDisabled={busy}
                              onPress={saveEdit}
                            >
                              Save
                            </FormAction>
                            <Button
                              variant="secondary"
                              size="sm"
                              onPress={() => setEditId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </>
                      )}
                    </Card.Content>
                  </FormScope>
                </Card>
              );
            })}
            {!providers.length ? (
              <p className="text-muted text-sm">No providers yet</p>
            ) : null}
          </div>
        </div>
      }
    </FormScope>
  );
}
