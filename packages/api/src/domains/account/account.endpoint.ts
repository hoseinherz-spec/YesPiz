export const accountEndpoints = {
  register: '/api/v1/account/auth/register',
  otp: '/api/v1/account/auth/otp',
  otpConfirm: '/api/v1/account/auth/otp/confirm',
  login: '/api/v1/account/auth/login',
  roleLogin: (role: string) => `/api/v1/account/auth/${role}/login`,
  bootstrapAdmin: '/api/v1/account/auth/bootstrap-admin',
  acceptInvite: '/api/v1/account/auth/invites/accept',
  createInvite: '/api/v1/account/admin/invites',
  forgotPassword: '/api/v1/account/auth/password/forgot',
  resetPassword: '/api/v1/account/auth/password/reset',
  me: '/api/v1/account/profile/me',
  cashRestore: (id: string) => `/api/v1/account/admin/users/${id}/cash-restore`,
} as const;
