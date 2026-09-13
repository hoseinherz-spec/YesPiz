export type CreateProviderRequest = {
  userId: string;
  name: string;
  address: string;
  logoUrl?: string;
  longitude: number;
  latitude: number;
  rating?: number;
};

export type UpdateProviderRequest = {
  name?: string;
  address?: string;
  logoUrl?: string;
  longitude?: number;
  latitude?: number;
  isActive?: boolean;
  acceptingOrders?: boolean;
  rating?: number;
  acceptCap?: number | null;
};

export type ProviderSelfUpdateRequest = {
  acceptingOrders?: boolean;
  logoUrl?: string;
  acceptCap?: number | null;
  pausedUntil?: string;
};

export type EightySixRequest = {
  menuItemIds: string[];
};

export type PauseOrdersRequest = {
  reason?: string;
  until?: string;
};

export type Provider = {
  hoursEnabled?: boolean;
  timezone?: string;
  openingHours?: { day: number; opens: string; closes: string }[];
  closedDates?: string[];
  id: string;
  userId: string;
  name: string;
  address: string;
  logoUrl?: string;
  longitude: number;
  latitude: number;
  location: { type: "Point"; coordinates: [number, number] };
  rating: number;
  qualityScore?: number;
  complaintCount?: number;
  delayCount?: number;
  errorCount?: number;
  autoSuspended?: boolean;
  suspendedAt?: string;
  suspendReason?: string;
  acceptCap?: number | null;
  openOrders: number;
  isActive: boolean;
  acceptingOrders: boolean;
  pausedUntil?: string;
  pauseReason?: string;
  eightySixedItemIds?: string[];
  createdAt?: string;
  updatedAt?: string;
};
