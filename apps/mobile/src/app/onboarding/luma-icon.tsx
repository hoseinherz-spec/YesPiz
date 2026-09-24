import React from "react";

export type IconName =
  | "close"
  | "back"
  | "arrow"
  | "mail"
  | "phone"
  | "code"
  | "key"
  | "face"
  | "lock"
  | "devices"
  | "check"
  | "photo"
  | "warning"
  | "apple";
export function Icon({
  name,
  size = 28,
  color = "currentColor",
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  const paths: Partial<Record<IconName, string>> = {
    close: "M5 5 23 23 M23 5 5 23",
    back: "M18 4 8 14 18 24",
    arrow: "M14 3v22 M5 16l9 9 9-9",
    mail: "M3 5l9 9q2 2 4 0L25 5 M3 23l8-9 M25 23l-8-9",
    phone:
      "M12 5h4 M10 15h.1 M14 15h.1 M18 15h.1 M10 19h.1 M14 19h.1 M18 19h.1 M10 23h.1 M14 23h.1 M18 23h.1",
    code: "M12 24H7q-5 0-5-5V8q0-5 5-5h14q5 0 5 5v8 M17 24l7-7 3 3-7 7h-3z M24 25h3",
    key: "M10 26q-8-1-8-5 0-3 5-5 4-2 2-5-2-2-2-5 0-5 5-5t5 5q0 3-2 5v2 M20 18l6-6 M23 15l2 2 M25 13l2 2",
    face: "M8 3H5q-2 0-2 2v4 M20 3h3q2 0 2 2v4 M3 20v3q0 2 2 2h3 M25 20v3q0 2-2 2h-3 M9 9v3 M19 9v3 M14 9v7h-2 M8 19q6 5 12 0",
    lock: "M8 12V8a6 6 0 0 1 12 0v4",
    devices: "M15 21H5q-3 0-3-3V6q0-3 3-3h17 M9 25h4 M10 21v4",
    check: "M4 14l7 8L25 5",
    photo:
      "M13 24H7q-5 0-5-5V7q0-5 5-5h14q5 0 5 5v8 M4 21l7-7 5 4 5-5 M22 20v8 M18 24h8",
    warning: "M14 8v8 M14 21h.01",
    apple:
      "M19 6c2-2 2-4 2-5-2 0-4 1-5 3-1 1-2 3-1 4 1 0 3-1 4-2ZM24 21c-1 3-3 7-6 7-2 0-3-1-5-1s-3 1-5 1C4 27 1 21 1 15 1 10 4 7 8 7c2 0 4 2 5 2s4-2 7-2c2 0 4 1 6 3-6 3-5 9-2 11Z",
  };
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {name === "mail" && <rect x="2" y="3" width="24" height="23" rx="5" />}
      {name === "phone" && <rect x="6" y="1" width="16" height="26" rx="4" />}
      {name === "code" &&
        [8, 14, 20].map((x) => <circle key={x} cx={x} cy="13" r=".5" />)}
      {name === "key" && <circle cx="17" cy="22" r="4" />}
      {name === "lock" && <rect x="5" y="12" width="18" height="14" rx="4" />}
      {name === "devices" && (
        <rect x="16" y="10" width="10" height="16" rx="2" />
      )}
      {name === "photo" && <circle cx="9" cy="9" r="2" />}
      {name === "warning" && (
        <path d="M12 2q2-3 4 0l12 23H0z" fill={color} stroke="none" />
      )}
      <path
        d={paths[name]}
        fill={name === "apple" ? color : "none"}
        stroke={name === "warning" ? "var(--danger)" : color}
      />
    </svg>
  );
}
