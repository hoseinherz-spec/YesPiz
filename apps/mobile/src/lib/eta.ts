export type EtaWindow = {
  min?: number;
  max?: number;
  computedAt?: string;
  hasShortExtraStop?: boolean;
};

const STALE_MS = 10 * 60 * 1000;

export function pickDeliveryEta(view: {
  etaDeliveryMin?: number;
  etaDeliveryMax?: number;
  etaPrepMin?: number;
  etaPrepMax?: number;
  etaComputedAt?: string;
  hasShortExtraStop?: boolean;
  customerStatus?: string | null;
}): EtaWindow {
  const inDelivery =
    view.customerStatus === 'driver' ||
    view.customerStatus === 'onway' ||
    view.customerStatus === 'delivered';

  const min = inDelivery ? view.etaDeliveryMin : view.etaPrepMin;
  const max = inDelivery ? view.etaDeliveryMax : view.etaPrepMax;

  return {
    min,
    max,
    computedAt: view.etaComputedAt,
    hasShortExtraStop: view.hasShortExtraStop,
  };
}

export function isEtaStale(computedAt?: string, now = Date.now()): boolean {
  if (!computedAt) return false;
  const at = new Date(computedAt).getTime();
  if (Number.isNaN(at)) return false;
  return now - at > STALE_MS;
}

export function formatEtaRange(
  window: EtaWindow,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string {
  const { min, max } = window;
  if (min != null && max != null && min !== max) {
    return t('tracking.etaRange', { min, max });
  }
  if (max != null) return t('tracking.minutes', { n: max });
  if (min != null) return t('tracking.minutes', { n: min });
  return t('tracking.etaPending');
}

export function etaArrivalTimestamp(computedAt?: string, maxMinutes?: number): Date | null {
  if (!computedAt || maxMinutes == null) return null;
  const base = new Date(computedAt).getTime();
  if (Number.isNaN(base)) return null;
  return new Date(base + maxMinutes * 60_000);
}
