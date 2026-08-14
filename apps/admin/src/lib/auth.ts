'use client';

const TOKEN_KEY = 'yespizz_admin_token';

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function requireAdminToken(): string {
  const token = getAdminToken();
  if (!token) {
    throw new Error('Not authenticated');
  }
  return token;
}
