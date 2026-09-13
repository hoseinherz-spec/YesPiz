import { BadRequestException } from "@nestjs/common";
export type OpeningPeriod = { day: number; opens: string; closes: string };
export type Availability = {
  hoursEnabled?: boolean;
  timezone?: string;
  openingHours?: OpeningPeriod[];
  closedDates?: string[];
  isActive?: boolean;
  acceptingOrders?: boolean;
  autoSuspended?: boolean;
  pausedUntil?: Date;
  acceptCap?: number | null;
  openOrders?: number;
  eightySixedItemIds?: unknown[];
};
export function validateHours(
  timezone: string,
  hours: OpeningPeriod[],
  closedDates: string[],
) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: timezone }).format();
  } catch {
    throw new BadRequestException("Choose a valid IANA timezone.");
  }
  if (hours.some((h) => h.opens >= h.closes))
    throw new BadRequestException(
      "Each period must end after it starts. Split overnight hours at midnight.",
    );
  if (
    hours.some((h, i) =>
      hours.some(
        (other, j) =>
          i !== j &&
          h.day === other.day &&
          h.opens < other.closes &&
          other.opens < h.closes,
      ),
    )
  )
    throw new BadRequestException("Opening periods cannot overlap.");
  if (
    closedDates.some(
      (date) =>
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        !Number.isFinite(new Date(date).getTime()) ||
        new Date(date).toISOString().slice(0, 10) !== date,
    )
  )
    throw new BadRequestException("Choose valid closure dates.");
}
export function withinHours(provider: Availability, now = new Date()) {
  if (!provider.hoursEnabled) return true;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: provider.timezone || "Europe/Vienna",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const value = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";
  if (
    provider.closedDates?.includes(
      `${value("year")}-${value("month")}-${value("day")}`,
    )
  )
    return false;
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
    value("weekday"),
  );
  const time = `${value("hour")}:${value("minute")}`;
  return Boolean(
    provider.openingHours?.some(
      (period) =>
        period.day === day && time >= period.opens && time < period.closes,
    ),
  );
}
export function canReceiveOrder(
  provider: Availability,
  itemIds: string[] = [],
  now = new Date(),
) {
  if (provider.isActive === false || provider.autoSuspended) return false;
  if (provider.pausedUntil && provider.pausedUntil > now) return false;
  if (
    provider.acceptingOrders === false &&
    !(provider.pausedUntil && provider.pausedUntil <= now)
  )
    return false;
  if (
    provider.acceptCap != null &&
    (provider.openOrders ?? 0) >= provider.acceptCap
  )
    return false;
  if (
    itemIds.some((id) => provider.eightySixedItemIds?.map(String).includes(id))
  )
    return false;
  return withinHours(provider, now);
}
