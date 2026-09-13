import { BadRequestException } from "@nestjs/common";
import {
  validateHours,
  withinHours,
  type OpeningPeriod,
} from "../providers/availability";

export type PizzaPresentation = {
  gallery: string[];
  fields: Array<{
    name: string;
    type: "text" | "number" | "boolean";
    value: string;
    visibility: "public" | "internal";
  }>;
  availability: {
    enabled: boolean;
    timezone: string;
    periods: OpeningPeriod[];
    closedDates: string[];
  };
};
export function validatePresentation(p: PizzaPresentation): PizzaPresentation {
  const bad = () => {
    throw new BadRequestException(
      "Invalid pizza images, fields or availability.",
    );
  };
  if (
    !p ||
    !Array.isArray(p.gallery) ||
    p.gallery.length > 12 ||
    p.gallery.some(
      (url) =>
        typeof url !== "string" ||
        url.length > 2000 ||
        !/^(https?:\/\/|\/(?!\/))/.test(url),
    ) ||
    !Array.isArray(p.fields) ||
    p.fields.length > 40
  )
    return bad();
  for (const f of p.fields) {
    if (
      !f ||
      typeof f.name !== "string" ||
      !f.name.trim() ||
      f.name.length > 100 ||
      !["text", "number", "boolean"].includes(f.type) ||
      typeof f.value !== "string" ||
      f.value.length > 2000 ||
      !["public", "internal"].includes(f.visibility)
    )
      return bad();
    if (
      f.type === "number" &&
      (!f.value.trim() || !Number.isFinite(Number(f.value)))
    )
      return bad();
    if (f.type === "boolean" && !["true", "false"].includes(f.value))
      return bad();
  }
  const a = p.availability;
  if (
    !a ||
    typeof a.enabled !== "boolean" ||
    typeof a.timezone !== "string" ||
    !Array.isArray(a.periods) ||
    a.periods.length > 28 ||
    !Array.isArray(a.closedDates) ||
    a.closedDates.length > 100
  )
    return bad();
  for (const h of a.periods)
    if (
      !h ||
      !Number.isInteger(h.day) ||
      h.day < 0 ||
      h.day > 6 ||
      typeof h.opens !== "string" ||
      typeof h.closes !== "string" ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(h.opens) ||
      !/^(([01]\d|2[0-3]):[0-5]\d|24:00)$/.test(h.closes)
    )
      return bad();
  validateHours(a.timezone, a.periods, a.closedDates);
  return {
    gallery: [...p.gallery],
    fields: p.fields.map(({ name, type, value, visibility }) => ({
      name: name.trim(),
      type,
      value,
      visibility,
    })),
    availability: {
      enabled: a.enabled,
      timezone: a.timezone,
      periods: a.periods.map(({ day, opens, closes }) => ({
        day,
        opens,
        closes,
      })),
      closedDates: [...a.closedDates],
    },
  };
}
export function pizzaAvailable(p?: PizzaPresentation, now = new Date()) {
  return (
    !p ||
    withinHours(
      {
        hoursEnabled: p.availability.enabled,
        timezone: p.availability.timezone,
        openingHours: p.availability.periods,
        closedDates: p.availability.closedDates,
      },
      now,
    )
  );
}
export function publicPresentation(p?: PizzaPresentation) {
  if (!p) return undefined;
  return {
    gallery: p.gallery,
    fields: p.fields
      .filter((f) => f.visibility === "public")
      .map(({ name, type, value }) => ({ name, type, value })),
  };
}
