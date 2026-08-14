export type UserRole = 'client' | 'provider' | 'courier' | 'admin';
export type AuthMethod = 'password' | 'google' | 'otp';

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
    type?: 'Point';
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
  role: UserRole;
  channel?: 'sms';
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
  role: UserRole;
  firstName?: string;
  lastName?: string;
  location?: LocationDto;
};

export type LoginRequest = {
  method: 'password' | 'google';
  role: UserRole;
  email?: string;
  password?: string;
  idToken?: string;
  firstName?: string;
  lastName?: string;
};

export type RegisterRequest = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  location?: LocationDto;
};

export type ProfileResponse = {
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
};
