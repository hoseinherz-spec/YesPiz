'use client';

const TOKEN_KEY = 'yespizz_courier_token';

export function getCourierToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setCourierToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearCourierToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function requireCourierToken(): string {
  const token = getCourierToken();
  if (!token) throw new Error('Not authenticated');
  return token;
}
