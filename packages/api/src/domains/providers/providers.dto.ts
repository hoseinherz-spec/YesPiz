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
  acceptCap?: number;
};

export type ProviderSelfUpdateRequest = {
  acceptingOrders?: boolean;
  logoUrl?: string;
  acceptCap?: number;
};

export type Provider = {
  id: string;
  userId: string;
  name: string;
  address: string;
  logoUrl?: string;
  longitude: number;
  latitude: number;
  location: { type: 'Point'; coordinates: [number, number] };
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
  createdAt?: string;
  updatedAt?: string;
};
