import {
  apiRequest,
  withAuth,
  type ApiRequestOptions,
  type AuthRequestOptions,
} from '../../core';
import type {
  AcceptInviteRequest,
  AuthResponse,
  BootstrapAdminRequest,
  ConfirmOtpRequest,
  CreateInviteRequest,
  CreateInviteResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginRequest,
  ProfileResponse,
  RegisterRequest,
  ResetPasswordRequest,
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

  bootstrapAdmin(body: BootstrapAdminRequest, options?: ApiRequestOptions) {
    return apiRequest<AuthResponse>(accountEndpoints.bootstrapAdmin, {
      ...options,
      method: 'POST',
      body,
    });
  },

  createInvite(body: CreateInviteRequest, options?: AuthRequestOptions) {
    return apiRequest<CreateInviteResponse>(
      accountEndpoints.createInvite,
      withAuth({ ...options, method: 'POST', body }),
    );
  },

  acceptInvite(body: AcceptInviteRequest, options?: ApiRequestOptions) {
    return apiRequest<AuthResponse>(accountEndpoints.acceptInvite, {
      ...options,
      method: 'POST',
      body,
    });
  },

  forgotPassword(body: ForgotPasswordRequest, options?: ApiRequestOptions) {
    return apiRequest<ForgotPasswordResponse>(accountEndpoints.forgotPassword, {
      ...options,
      method: 'POST',
      body,
    });
  },

  resetPassword(
    body: ResetPasswordRequest,
    options?: ApiRequestOptions,
  ) {
    return apiRequest<{ status: string }>(accountEndpoints.resetPassword, {
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
