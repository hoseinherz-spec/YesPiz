"use client";
import { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
export type OperationsMapPoint = {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  kind: "order" | "courier";
};
export function OperationsMap({ points }: { points: OperationsMapPoint[] }) {
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const layers = useRef(new Map<string, Leaflet.CircleMarker>());
  const fitted = useRef(false);
  const [api, setApi] = useState<typeof Leaflet | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    void import("leaflet")
      .then((L) => {
        if (cancelled || !host.current) return;
        const instance = L.map(host.current).setView([48.137, 11.575], 12);
        L.tileLayer(
          process.env.NEXT_PUBLIC_MAP_TILE_URL ||
            "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            maxZoom: 19,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          },
        )
          .addTo(instance)
          .on("tileerror", () => {
            if (!cancelled)
              setError("Map tiles unavailable. Order lists remain available.");
          });
        map.current = instance;
        setApi(L);
        const resize = new ResizeObserver(() => instance.invalidateSize());
        resize.observe(host.current);
        instance.on("unload", () => resize.disconnect());
      })
      .catch(() => {
        if (!cancelled) setError("Map could not load.");
      });
    const markers = layers.current;
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
      markers.clear();
      fitted.current = false;
    };
  }, []);
  useEffect(() => {
    if (!api || !map.current) return;
    const current = new Set<string>();
    for (const point of points) {
      if (
        !Number.isFinite(point.latitude) ||
        !Number.isFinite(point.longitude) ||
        Math.abs(point.latitude) > 90 ||
        Math.abs(point.longitude) > 180
      )
        continue;
      current.add(point.id);
      let marker = layers.current.get(point.id);
      if (!marker) {
        marker = api
          .circleMarker([point.latitude, point.longitude], {
            radius: point.kind === "courier" ? 9 : 6,
            color: point.kind === "courier" ? "#167246" : "#6645ca",
            fillOpacity: 0.85,
          })
          .addTo(map.current);
        layers.current.set(point.id, marker);
      }
      marker.setLatLng([point.latitude, point.longitude]);
      const label = document.createElement("span");
      label.textContent = point.label;
      marker.unbindTooltip().bindTooltip(label);
    }
    for (const [id, marker] of layers.current)
      if (!current.has(id)) {
        marker.remove();
        layers.current.delete(id);
      }
    if (!fitted.current && layers.current.size) {
      map.current.fitBounds(
        api.featureGroup([...layers.current.values()]).getBounds(),
        { padding: [30, 30], maxZoom: 15 },
      );
      fitted.current = true;
    }
  }, [api, points]);
  return (
    <div>
      <div
        ref={host}
        role="region"
        aria-label="Live operations map: purple delivery destinations, green couriers"
        style={{ height: 380, borderRadius: 20, isolation: "isolate" }}
      />
      {error && <p role="status">{error}</p>}
      <p className="mt-2 text-xs text-muted">
        Purple: deliveries · Green: couriers with GPS updated within 90 seconds.
      </p>
    </div>
  );
}
