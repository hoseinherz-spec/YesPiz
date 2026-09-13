"use client";
import { FormValue } from "@repo/ui/forms";
import { hoursSchema } from "@repo/ui/form-schemas";
import { Form, Input, Select } from "@repo/ui/forms";

import { apiRequest, withAuth, providersClient } from "@repo/api";
import { Button } from "@heroui/react";
import { useCallback, useEffect, useState } from "react";
import { requireProviderToken } from "@/lib/auth";
type Period = { day: number; opens: string; closes: string };
export function OpeningHours() {
  const [enabled, setEnabled] = useState(false);
  const [zone, setZone] = useState("Europe/Vienna");
  const [hours, setHours] = useState<Period[]>([]);
  const [dates, setDates] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const load = useCallback(async () => {
    try {
      const data = await providersClient.getMeProfile({
        accessToken: requireProviderToken(),
      });
      setEnabled(data.hoursEnabled ?? false);
      setZone(data.timezone ?? "Europe/Vienna");
      setHours(data.openingHours ?? []);
      setDates((data.closedDates ?? []).join(", "));
      setLoaded(true);
      setNotice("");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Unable to load hours.");
    }
  }, []);
  useEffect(() => {
    // Defer initial loading so synchronous auth/storage failures update after the effect.
    void Promise.resolve().then(load);
  }, [load]);
  async function save() {
    setBusy(true);
    setNotice("");
    try {
      await apiRequest(
        "/api/v1/providers/me/hours",
        withAuth({
          accessToken: requireProviderToken(),
          method: "PATCH",
          body: {
            hoursEnabled: enabled,
            timezone: zone,
            openingHours: hours,
            closedDates: dates
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          },
        }),
      );
      setNotice("Opening hours saved. Existing orders continue as normal.");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Unable to save hours.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="rounded-3xl bg-card p-6">
      <div className="flex justify-between gap-3">
        <h2 className="text-xl font-semibold">Opening hours</h2>
        <Button variant="ghost" size="sm" onPress={() => void load()}>
          Reload
        </Button>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted">
        Control when new pizza orders can be offered. Pause, capacity and
        inventory still apply.
      </p>
      {notice && (
        <p role="status" className="mt-4 text-sm">
          {notice}
        </p>
      )}
      {loaded && (
        <Form
          className="mt-5 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <FormValue
            name="hours"
            value={{
              timezone: zone,
              periods: hours,
              closedDates: dates
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            }}
            schema={hoursSchema}
          />
          <Input
            label={<>Use weekly opening hours</>}
            wrapperClassName="flex items-center gap-3 text-sm"
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          <Input
            label={<>Timezone</>}
            wrapperClassName="block text-sm"
            required
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            className="ml-3 rounded-xl bg-field-background p-3"
          />
          {hours.map((period, index) => (
            <div key={index} className="flex flex-wrap items-center gap-3">
              <Select
                aria-label={`Day ${index + 1}`}
                className="rounded-xl bg-field-background p-3"
                value={period.day}
                onChange={(e) =>
                  setHours((old) =>
                    old.map((p, i) =>
                      i === index ? { ...p, day: Number(e.target.value) } : p,
                    ),
                  )
                }
              >
                {[
                  "Sunday",
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                ].map((day, i) => (
                  <option value={i} key={day}>
                    {day}
                  </option>
                ))}
              </Select>
              <Input
                required
                aria-label={`Opens ${index + 1}`}
                type="time"
                value={period.opens}
                onChange={(e) =>
                  setHours((old) =>
                    old.map((p, i) =>
                      i === index ? { ...p, opens: e.target.value } : p,
                    ),
                  )
                }
                className="rounded-xl bg-field-background p-3"
              />
              <span>to</span>
              <Input
                required
                aria-label={`Closes ${index + 1}`}
                pattern="(?:(?:[01][0-9]|2[0-3]):[0-5][0-9]|24:00)"
                title="HH:mm, including 24:00 for midnight"
                value={period.closes}
                onChange={(e) =>
                  setHours((old) =>
                    old.map((p, i) =>
                      i === index ? { ...p, closes: e.target.value } : p,
                    ),
                  )
                }
                className="w-24 rounded-xl bg-field-background p-3"
              />
              <Button
                type="button"
                variant="ghost"
                onPress={() =>
                  setHours((old) => old.filter((_, i) => i !== index))
                }
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            variant="secondary"
            type="button"
            isDisabled={hours.length >= 28}
            onPress={() =>
              setHours((old) => [
                ...old,
                { day: 1, opens: "11:00", closes: "22:00" },
              ])
            }
          >
            Add opening period
          </Button>
          <Input
            label={<>Closed dates (YYYY-MM-DD, separated by commas)</>}
            wrapperClassName="block text-sm"
            value={dates}
            onChange={(e) => setDates(e.target.value)}
            className="mt-2 w-full rounded-xl bg-field-background p-3"
          />
          {enabled && !hours.length && (
            <p className="text-sm text-warning">
              With no periods, new orders will be stopped on every day.
            </p>
          )}
          <Button type="submit" isDisabled={busy}>
            Save opening hours
          </Button>
        </Form>
      )}
    </section>
  );
}
