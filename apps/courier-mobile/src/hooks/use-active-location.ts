'use client';

import { ApiError, couriersClient } from '@repo/api';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getCurrentPosition, GeoError } from '@/lib/geolocation';
import { requireCourierToken } from '@/lib/auth';

const INTERVAL_MS = 15_000;

export function useActiveLocationSharing(enabled: boolean) {
  const [lastPosted, setLastPosted] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const postingRef = useRef(false);

  const postOnce = useCallback(async () => {
    if (postingRef.current) return;
    postingRef.current = true;
    try {
      const token = requireCourierToken();
      const coords = await getCurrentPosition();
      const res = await couriersClient.updateLocation(coords, {
        accessToken: token,
      });
      setLastPosted(
        `${res.latitude.toFixed(5)}, ${res.longitude.toFixed(5)} @ ${res.updatedAt}`,
      );
      setError(null);
    } catch (err) {
      if (err instanceof GeoError) setError(err.message);
      else if (err instanceof ApiError) setError(err.message);
      else setError('Location update failed');
    } finally {
      postingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const immediate = window.setTimeout(() => {
      void postOnce();
    }, 0);
    const id = window.setInterval(() => {
      void postOnce();
    }, INTERVAL_MS);
    return () => {
      window.clearTimeout(immediate);
      window.clearInterval(id);
    };
  }, [enabled, postOnce]);

  return { lastPosted, error, postOnce };
}
