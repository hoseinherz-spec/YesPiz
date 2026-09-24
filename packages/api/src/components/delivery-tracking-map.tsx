"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import type * as Leaflet from "leaflet";
import "leaflet/dist/leaflet.css";

type Point = { latitude: number; longitude: number };
type Props = {
  destination: Point | null;
  rider: Point | null;
  route: [number, number][] | null;
  marker: ReactNode;
  recenter: number;
  label: string;
};
export function DeliveryTrackingMap(props: Props) {
  const container = useRef<HTMLDivElement>(null);
  const latest = useRef(props);
  const map = useRef<Leaflet.Map | null>(null);
  const layers = useRef<{
    rider?: Leaflet.Marker;
    destination?: Leaflet.CircleMarker;
    route?: Leaflet.Polyline;
  }>({});
  const [L, setL] = useState<typeof Leaflet | null>(null);
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const [error, setError] = useState("");
  const fitted = useRef(false);
  latest.current = props;
  useEffect(() => {
    let stopped = false;
    void import("leaflet")
      .then((api) => {
        if (stopped || !container.current) return;
        const center = latest.current.rider || latest.current.destination;
        if (!center) return;
        const instance = api
          .map(container.current, {
            zoomControl: false,
            scrollWheelZoom: false,
          })
          .setView([center.latitude, center.longitude], 15);
        map.current = instance;
        api
          .tileLayer(
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
            if (!stopped)
              setError(
                "Map tiles are unavailable. Tracking details will keep updating.",
              );
          });
        const observer = new ResizeObserver(() => instance.invalidateSize());
        observer.observe(container.current);
        instance.on("unload", () => observer.disconnect());
        setL(api);
      })
      .catch(() => {
        if (!stopped)
          setError(
            "The map could not load. Tracking details will keep updating.",
          );
      });
    return () => {
      stopped = true;
      map.current?.remove();
      map.current = null;
      layers.current = {};
      fitted.current = false;
    };
  }, []);
  useEffect(() => {
    const instance = map.current;
    if (!L || !instance) return;
    const { rider, destination, route } = props;
    if (destination) {
      const position: Leaflet.LatLngTuple = [
        destination.latitude,
        destination.longitude,
      ];
      if (!layers.current.destination)
        layers.current.destination = L.circleMarker(position, {
          radius: 10,
          weight: 5,
          color: "#fff",
          fillColor: "#8509ee",
          fillOpacity: 1,
        })
          .addTo(instance)
          .bindTooltip("Delivery location");
      else layers.current.destination.setLatLng(position);
    } else {
      layers.current.destination?.remove();
      layers.current.destination = undefined;
    }
    if (rider) {
      const position: Leaflet.LatLngTuple = [rider.latitude, rider.longitude];
      if (!layers.current.rider) {
        const element = document.createElement("div");
        layers.current.rider = L.marker(position, {
          icon: L.divIcon({
            html: element,
            className: "tracking-map-marker",
            iconSize: [58, 68],
            iconAnchor: [29, 58],
          }),
          keyboard: false,
        }).addTo(instance);
        setHost(element);
      } else layers.current.rider.setLatLng(position);
    } else {
      layers.current.rider?.remove();
      layers.current.rider = undefined;
      setHost(null);
    }
    layers.current.route?.remove();
    layers.current.route = route?.length
      ? L.polyline(route, {
          color: "#8509ee",
          weight: 6,
          opacity: 1,
          lineCap: "round",
        }).addTo(instance)
      : undefined;
    if (!fitted.current) {
      const points = [rider, destination]
        .filter((p): p is Point => Boolean(p))
        .map((p): Leaflet.LatLngTuple => [p.latitude, p.longitude]);
      if (points.length) {
        instance.fitBounds(L.latLngBounds(points), {
          padding: [55, 80],
          maxZoom: 16,
        });
        fitted.current = Boolean(rider);
      }
    }
  }, [
    L,
    props.rider?.latitude,
    props.rider?.longitude,
    props.destination?.latitude,
    props.destination?.longitude,
    props.route,
  ]);
  useEffect(() => {
    const target = latest.current.rider || latest.current.destination;
    if (target && map.current)
      map.current.panTo([target.latitude, target.longitude], {
        animate: !matchMedia("(prefers-reduced-motion: reduce)").matches,
        duration: 0.25,
      });
  }, [props.recenter]);
  return (
    <>
      <div
        ref={container}
        className="tracking-map-canvas"
        aria-label={props.label}
      />
      {host && createPortal(props.marker, host)}
      {error && (
        <p className="tracking-map-error" role="status">
          {error}
        </p>
      )}
    </>
  );
}
