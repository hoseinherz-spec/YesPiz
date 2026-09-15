export type UserRole = "client" | "provider" | "courier" | "admin";
export type AuthMethod = "password" | "google" | "otp";
export type InviteRole = "provider" | "courier" | "admin";

export type LocationDto = {
  address?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  zipcode?: string;
  longitude?: number;
  latitude?: number;
  coordinates?: {
    type?: "Point";
    coordinates?: [number, number];
  };
};

export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  roles: UserRole[];
  activeRole: UserRole;
};

export type AuthResponse = {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUser;
};

export type SendOtpRequest = {
  phone: string;
  role?: "client" | "customer";
  channel?: "sms";
};

export type SendOtpResponse = {
  status: string;
  phone: string;
  role: UserRole;
  channel: string;
};

export type ConfirmOtpRequest = {
  phone: string;
  code: string;
  role?: "client" | "customer";
  firstName?: string;
  lastName?: string;
  location?: LocationDto;
};

export type LoginRequest = {
  method: "password" | "google";
  role: UserRole;
  email?: string;
  password?: string;
  idToken?: string;
  firstName?: string;
  lastName?: string;
  inviteToken?: string;
};

export type RegisterRequest = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  /** Public registration ignores privileged roles; customer only. */
  role?: "client" | "customer";
  location?: LocationDto;
};

export type CreateInviteRequest = {
  role: InviteRole;
  email?: string;
  expiresInHours?: number;
};

export type CreateInviteResponse = {
  id: string;
  role: UserRole;
  email?: string;
  expiresAt: string;
  token: string;
};

export type AcceptInviteRequest = {
  token: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  location?: LocationDto;
};

export type BootstrapAdminRequest = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  bootstrapSecret?: string;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type ForgotPasswordResponse = {
  status: string;
  /** Present only in non-production for local/demo flows */
  resetToken?: string;
};

export type ResetPasswordRequest = {
  token: string;
  password: string;
};

export type ProfileResponse = {
  adminPermissions?: string[];
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  roles: UserRole[];
  activeRole: UserRole;
  location?: LocationDto;
  isActive: boolean;
  phoneVerifiedAt?: string;
  emailVerifiedAt?: string;
  createdAt: string;
  updatedAt: string;
  cashBanned?: boolean;
  failedCashCount?: number;
  cashTrustScore?: number;
  cashTrustTier?: string;
  creditCents?: number;
  cashRestoredAt?: string;
  cashRestoreReason?: string;
};
