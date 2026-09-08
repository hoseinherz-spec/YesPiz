"use client";
import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, CircleMarker } from "leaflet";
import "leaflet/dist/leaflet.css";
type Coordinates = { latitude: number; longitude: number };
export function LocationMap({
  latitude,
  longitude,
  onSelect,
  label = "Delivery location",
}: Coordinates & {
  onSelect?: (coordinates: Coordinates) => void;
  label?: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const marker = useRef<CircleMarker | null>(null);
  const selection = useRef(onSelect);
  const position = useRef({ latitude, longitude });
  const [error, setError] = useState("");
  useEffect(() => {
    selection.current = onSelect;
  }, [onSelect]);
  useEffect(() => {
    position.current = { latitude, longitude };
    if (
      map.current &&
      Number.isFinite(latitude) &&
      Number.isFinite(longitude)
    ) {
      map.current.panTo([latitude, longitude]);
      marker.current?.setLatLng([latitude, longitude]);
    }
  }, [latitude, longitude]);
  useEffect(() => {
    let stopped = false;
    void import("leaflet")
      .then((L) => {
        if (stopped || !container.current) return;
        const center: [number, number] = [
          position.current.latitude,
          position.current.longitude,
        ];
        const instance = L.map(container.current, {
          scrollWheelZoom: false,
        }).setView(center, 15);
        map.current = instance;
        L.tileLayer(
          process.env.NEXT_PUBLIC_MAP_TILE_URL ||
            "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            maxZoom: 19,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
          },
        )
          .addTo(instance)
          .on("tileerror", () =>
            setError(
              "Map tiles unavailable. You can still use current location or coordinates.",
            ),
          );
        marker.current = L.circleMarker(center, {
          radius: 10,
          color: "#ffffff",
          fillColor: "#e44d26",
          fillOpacity: 1,
          weight: 3,
        }).addTo(instance);
        instance.on(
          "click",
          (event: { latlng: { lat: number; lng: number } }) =>
            selection.current?.({
              latitude: event.latlng.lat,
              longitude: event.latlng.lng,
            }),
        );
        const resize = new ResizeObserver(() => instance.invalidateSize());
        resize.observe(container.current);
        instance.on("unload", () => resize.disconnect());
      })
      .catch(() =>
        setError("Map unavailable. Use current location or enter coordinates."),
      );
    return () => {
      stopped = true;
      map.current?.remove();
      map.current = null;
      marker.current = null;
    };
  }, []);
  return (
    <div className="relative h-full min-h-64">
      <div
        ref={container}
        aria-label={label}
        className="h-full min-h-64 w-full"
        style={{ zIndex: 0 }}
      />
      {error && (
        <p
          role="status"
          className="absolute bottom-6 left-2 right-2 z-10 rounded bg-white p-2 text-xs text-black"
        >
          {error}
        </p>
      )}
    </div>
  );
}
