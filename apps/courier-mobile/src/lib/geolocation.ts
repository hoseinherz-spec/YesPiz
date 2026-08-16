export type GeoCoords = {
  longitude: number;
  latitude: number;
};

export type GeoErrorCode = 'denied' | 'unavailable' | 'timeout' | 'unsupported';

export class GeoError extends Error {
  readonly code: GeoErrorCode;

  constructor(code: GeoErrorCode, message: string) {
    super(message);
    this.name = 'GeoError';
    this.code = code;
  }
}

export function getCurrentPosition(options?: {
  timeoutMs?: number;
  maximumAgeMs?: number;
}): Promise<GeoCoords> {
  const timeoutMs = options?.timeoutMs ?? 10_000;
  const maximumAgeMs = options?.maximumAgeMs ?? 15_000;

  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.reject(
      new GeoError('unsupported', 'Geolocation is not available on this device.'),
    );
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          longitude: pos.coords.longitude,
          latitude: pos.coords.latitude,
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(
            new GeoError(
              'denied',
              'Location permission denied. Enable location in settings to continue.',
            ),
          );
          return;
        }
        if (err.code === err.TIMEOUT) {
          reject(
            new GeoError(
              'timeout',
              'Location request timed out. Move to an open area and retry.',
            ),
          );
          return;
        }
        reject(
          new GeoError(
            'unavailable',
            'Could not read your location. Check GPS and try again.',
          ),
        );
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: maximumAgeMs },
    );
  });
}
