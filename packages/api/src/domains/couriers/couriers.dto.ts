export type UpdateCourierProfileRequest = {
  vehicleType?: string;
  vehicleModel?: string;
  plateNumber?: string;
  avatarUrl?: string;
};

export type SessionCodeRequest = {
  /** QR payload or OTP code */
  code: string;
};

export type UpdateCourierLocationRequest = {
  longitude: number;
  latitude: number;
};

export type CourierLocationResponse = {
  longitude: number;
  latitude: number;
  updatedAt: string;
};

export type CourierProfile = {
  id: string;
  userId: string;
  isActive: boolean;
  vehicleType?: string;
  vehicleModel?: string;
  plateNumber?: string;
  avatarUrl?: string;
  onDuty: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CourierSession = {
  id: string;
  courierId: string;
  startCode: string;
  endCode?: string;
  startedAt?: string;
  endedAt?: string;
  status: "pending" | "active" | "ended";
  lastLongitude?: number;
  lastLatitude?: number;
  locationUpdatedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};
