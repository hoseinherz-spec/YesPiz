import {
  apiRequest,
  withAuth,
  type ApiRequestOptions,
  type AuthRequestOptions,
} from "../../core";
import type {
  AcceptInviteRequest,
  AuthResponse,
  BootstrapAdminRequest,
  ConfirmPasswordResetOtpRequest,
  ConfirmPasswordResetOtpResponse,
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
} from "./account.dto";
import { accountEndpoints } from "./account.endpoint";

export type { AuthRequestOptions };

export const accountClient = {
  startSignup(body: { firstName: string; lastName: string; email: string }) {
    return apiRequest<{ challengeId: string; email: string; verificationCode?: string }>("/api/v1/account/auth/signup", { method: "POST", body });
  },
  verifySignup(body: { challengeId: string; code: string }) {
    return apiRequest<{ token: string }>("/api/v1/account/auth/signup/verify", { method: "POST", body });
  },
  completeSignup(body: { token: string; password: string }) {
    return apiRequest<{ status: string }>("/api/v1/account/auth/signup/complete", { method: "POST", body });
  },
  socialProviders() {
    return apiRequest<Record<"google" | "apple" | "facebook", boolean>>("/api/v1/account/auth/providers");
  },
  updateMe(body: { firstName: string; lastName: string; revision: number }, options?: AuthRequestOptions) {
    return apiRequest<ProfileResponse>(accountEndpoints.me, withAuth({ ...options, method: "PATCH", body }));
  },
  socialLogin(
    body: { provider: "google" | "apple" | "facebook"; idToken: string; nonce: string },
    options?: ApiRequestOptions,
  ) {
    return apiRequest<AuthResponse>("/api/v1/account/auth/social", {
      ...options,
      method: "POST",
      body,
    });
  },
  register(body: RegisterRequest, options?: ApiRequestOptions) {
    return apiRequest<AuthResponse>(accountEndpoints.register, {
      ...options,
      method: "POST",
      body,
    });
  },

  sendOtp(body: SendOtpRequest, options?: ApiRequestOptions) {
    return apiRequest<SendOtpResponse>(accountEndpoints.otp, {
      ...options,
      method: "POST",
      body,
    });
  },

  confirmOtp(body: ConfirmOtpRequest, options?: ApiRequestOptions) {
    return apiRequest<AuthResponse>(accountEndpoints.otpConfirm, {
      ...options,
      method: "POST",
      body,
    });
  },

  login(body: LoginRequest, options?: ApiRequestOptions) {
    return apiRequest<AuthResponse>(accountEndpoints.login, {
      ...options,
      method: "POST",
      body,
    });
  },

  loginAsRole(
    role: UserRole,
    body: Omit<LoginRequest, "role">,
    options?: ApiRequestOptions,
  ) {
    return apiRequest<AuthResponse>(accountEndpoints.roleLogin(role), {
      ...options,
      method: "POST",
      body,
    });
  },

  bootstrapAdmin(body: BootstrapAdminRequest, options?: ApiRequestOptions) {
    return apiRequest<AuthResponse>(accountEndpoints.bootstrapAdmin, {
      ...options,
      method: "POST",
      body,
    });
  },

  createInvite(body: CreateInviteRequest, options?: AuthRequestOptions) {
    return apiRequest<CreateInviteResponse>(
      accountEndpoints.createInvite,
      withAuth({ ...options, method: "POST", body }),
    );
  },

  acceptInvite(body: AcceptInviteRequest, options?: ApiRequestOptions) {
    return apiRequest<AuthResponse>(accountEndpoints.acceptInvite, {
      ...options,
      method: "POST",
      body,
    });
  },

  forgotPassword(body: ForgotPasswordRequest, options?: ApiRequestOptions) {
    return apiRequest<ForgotPasswordResponse>(accountEndpoints.forgotPassword, {
      ...options,
      method: "POST",
      body,
    });
  },

  confirmPasswordResetOtp(
    body: ConfirmPasswordResetOtpRequest,
    options?: ApiRequestOptions,
  ) {
    return apiRequest<ConfirmPasswordResetOtpResponse>(
      accountEndpoints.confirmPasswordResetOtp,
      { ...options, method: "POST", body },
    );
  },

  resetPassword(body: ResetPasswordRequest, options?: ApiRequestOptions) {
    return apiRequest<{ status: string }>(accountEndpoints.resetPassword, {
      ...options,
      method: "POST",
      body,
    });
  },

  getMe(options?: AuthRequestOptions) {
    return apiRequest<ProfileResponse>(
      accountEndpoints.me,
      withAuth({ ...options, method: "GET" }),
    );
  },

  restoreCash(
    userId: string,
    body: { reason: string },
    options?: AuthRequestOptions,
  ) {
    return apiRequest<ProfileResponse>(
      accountEndpoints.cashRestore(userId),
      withAuth({ ...options, method: "POST", body }),
    );
  },
};
