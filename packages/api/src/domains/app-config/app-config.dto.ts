export type AppConfig = {
  deliveryFeeCents: number;
  smallSizeDeltaCents: number;
  mediumSizeDeltaCents: number;
  largeSizeDeltaCents: number;
  extraCheeseCents: number;
  jalapenosCents: number;
  olivesCents: number;
  garlicDipCents: number;

  id: string;
  key: string;
  w1Rating: number;
  w2Proximity: number;
  w3QueueEmptiness: number;
  dispatchTopN: number;
  dispatchInitialRadiusMeters: number;
  dispatchExpandedRadiusMeters: number;
  offerTimeoutSeconds: number;
  cashFailThreshold: number;
  cashHardCapCents: number;
  qualityAutoSuspendThreshold: number;
  maxBatchSize: number;
};

export type UpdateAppConfigRequest = Partial<Omit<AppConfig, "id" | "key">>;
