"use client";
import { useState } from "react";
import { couriersClient, type CourierProfile } from "@repo/api";
import { Form, Input } from "@repo/ui/forms";
import { Button } from "@heroui/react";
import { ChevronDown } from "lucide-react";
import { Car1, Bicycle, Motorcycle, Scooter } from "@repo/icons";
import { requireCourierToken } from "@/lib/auth";

const vehicles = [
  { value: "car", label: "Car", Icon: Car1 },
  { value: "motorcycle", label: "Motorcycle", Icon: Motorcycle },
  { value: "scooter", label: "Scooter", Icon: Scooter },
  { value: "bicycle", label: "Bicycle", Icon: Bicycle },
];
export function VehicleProfile({
  profile,
  onSaved,
}: {
  profile: CourierProfile;
  onSaved: (profile: CourierProfile) => void;
}) {
  const [open, setOpen] = useState(false);
  const [vehicleType, setVehicleType] = useState(
    ["bike", "e-bike"].includes(profile.vehicleType ?? "") ? "bicycle" : profile.vehicleType ?? "scooter",
  );
  const [vehicleModel, setModel] = useState(profile.vehicleModel ?? "");
  const [plateNumber, setPlate] = useState(profile.plateNumber ?? "");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  return (
    <section className="t-acc courier-card my-5 p-5" data-open={open}>
      <button
        type="button"
        className="t-acc-head flex w-full items-center justify-between gap-3 text-start"
        aria-expanded={open}
        aria-controls="vehicle-profile"
        onClick={() => setOpen(!open)}
      >
        <span>
          <strong className="block">Your vehicle</strong>
          <span className="text-sm text-muted">
            {profile.vehicleModel || profile.vehicleType || "Add your vehicle"}{" "}
            · Profile & identification
          </span>
        </span>
        <span className="t-acc-chevron">
          <ChevronDown size={20} />
        </span>
      </button>
      <div className="t-acc-panel" id="vehicle-profile" inert={!open}>
        <div className="t-acc-panel-inner">
          <Form
            className="space-y-4 pt-5"
            onSubmit={async (e) => {
              e.preventDefault();
              if (busy) return;
              if (!vehicleModel.trim()) { setError("Add the vehicle model and colour so the kitchen can identify you."); return; }
              setBusy(true);
              setError("");
              setNotice("");
              try {
                const saved = await couriersClient.updateMe(
                  {
                    vehicleType,
                    vehicleModel: vehicleModel.trim(),
                    plateNumber: plateNumber.trim(),
                  },
                  { accessToken: requireCourierToken() },
                );
                onSaved(saved);
                setNotice(
                  "Vehicle saved. Your kitchen and customers will see your updated details.",
                );
              } catch (e) {
                setError(
                  e instanceof Error ? e.message : "Could not save. Try again.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <fieldset disabled={busy}>
              <legend className="mb-2 text-sm font-semibold">
                Vehicle type
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {vehicles.map(({ value, label, Icon }) => (
                  <label
                    key={value}
                    className={`flex min-h-14 cursor-pointer items-center gap-2 rounded-2xl border p-3 ${vehicleType === value ? "border-accent bg-accent text-accent-foreground" : "border-border"}`}
                  >
                    <input
                      type="radio"
                      name="vehicleType"
                      value={value}
                      checked={vehicleType === value}
                      onChange={() => setVehicleType(value)}
                    />
                    <Icon size={18} />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
            <Input
              label="Model / colour"
              required
              value={vehicleModel}
              maxLength={80}
              disabled={busy}
              placeholder="e.g. Black Honda PCX"
              onChange={(e) => setModel(e.target.value)}
            />
            <Input
              label="Registration plate (if applicable)"
              value={plateNumber}
              maxLength={24}
              autoCapitalize="characters"
              disabled={busy}
              onChange={(e) => setPlate(e.target.value)}
            />
            <p className="text-xs text-muted">
              Keep these details accurate so the kitchen can identify you at
              pickup.
            </p>
            {error && (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            )}
            {notice && (
              <p role="status" className="text-sm">
                {notice}
              </p>
            )}
            <Button type="submit" isDisabled={busy}>
              {busy ? "Saving…" : "Save vehicle"}
            </Button>
          </Form>
        </div>
      </div>
    </section>
  );
}
