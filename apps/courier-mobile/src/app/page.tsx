"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CourierIndex() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/home/");
  }, [router]);
  return (
    <p role="status" className="p-6">
      Opening courier deliveries…
    </p>
  );
}
