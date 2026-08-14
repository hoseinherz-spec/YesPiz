export const accountEndpoints = {
  register: '/api/v1/account/auth/register',
  otp: '/api/v1/account/auth/otp',
  otpConfirm: '/api/v1/account/auth/otp/confirm',
  login: '/api/v1/account/auth/login',
  roleLogin: (role: string) => `/api/v1/account/auth/${role}/login`,
  me: '/api/v1/account/profile/me',
} as const;
