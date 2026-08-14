/**
 * Socket.IO helper for clients that optionally connect to the API realtime
 * namespace. Polling remains the primary mobile strategy; this documents rooms
 * and event names for server-ready consumers.
 *
 * Usage (when `socket.io-client` is available):
 * ```ts
 * import { io } from 'socket.io-client';
 * import { realtimePath, realtimeRooms } from '@repo/api';
 * const socket = io(realtimeUrl(baseUrl), { auth: { token }, path: '/socket.io' });
 * socket.emit('join', { rooms: [realtimeRooms.order(orderId)] });
 * socket.on('order.status', handler);
 * ```
 */

export const REALTIME_NAMESPACE = '/realtime';

export const realtimeEvents = {
  orderStatus: 'order.status',
  offerCreated: 'offer.created',
  offerExpired: 'offer.expired',
  courierLocation: 'courier.location',
} as const;

export const realtimeRooms = {
  order: (id: string) => `order:${id}`,
  provider: (id: string) => `provider:${id}`,
  courier: (id: string) => `courier:${id}`,
  user: (id: string) => `user:${id}`,
} as const;

export function realtimeUrl(baseUrl = 'http://localhost:8058') {
  const root = baseUrl.replace(/\/$/, '').replace(/\/api\/v1$/, '');
  return `${root}${REALTIME_NAMESPACE}`;
}

export function realtimePath() {
  return REALTIME_NAMESPACE;
}
