import {
  apiRequest,
  withAuth,
  type ApiRequestOptions,
  type AuthRequestOptions,
} from '../../core';
import type {
  AuthResponse,
  ConfirmOtpRequest,
  LoginRequest,
  ProfileResponse,
  RegisterRequest,
  SendOtpRequest,
  SendOtpResponse,
  UserRole,
} from './account.dto';
import { accountEndpoints } from './account.endpoint';

export type { AuthRequestOptions };

export const accountClient = {
  register(body: RegisterRequest, options?: ApiRequestOptions) {
    return apiRequest<AuthResponse>(accountEndpoints.register, {
      ...options,
      method: 'POST',
      body,
    });
  },

  sendOtp(body: SendOtpRequest, options?: ApiRequestOptions) {
    return apiRequest<SendOtpResponse>(accountEndpoints.otp, {
      ...options,
      method: 'POST',
      body,
    });
  },

  confirmOtp(body: ConfirmOtpRequest, options?: ApiRequestOptions) {
    return apiRequest<AuthResponse>(accountEndpoints.otpConfirm, {
      ...options,
      method: 'POST',
      body,
    });
  },

  login(body: LoginRequest, options?: ApiRequestOptions) {
    return apiRequest<AuthResponse>(accountEndpoints.login, {
      ...options,
      method: 'POST',
      body,
    });
  },

  loginAsRole(
    role: UserRole,
    body: Omit<LoginRequest, 'role'>,
    options?: ApiRequestOptions,
  ) {
    return apiRequest<AuthResponse>(accountEndpoints.roleLogin(role), {
      ...options,
      method: 'POST',
      body,
    });
  },

  getMe(options?: AuthRequestOptions) {
    return apiRequest<ProfileResponse>(
      accountEndpoints.me,
      withAuth({ ...options, method: 'GET' }),
    );
  },

  restoreCash(
    userId: string,
    body: { reason: string },
    options?: AuthRequestOptions,
  ) {
    return apiRequest<ProfileResponse>(
      accountEndpoints.cashRestore(userId),
      withAuth({ ...options, method: 'POST', body }),
    );
  },
};
