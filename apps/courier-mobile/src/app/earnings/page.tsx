"use client";
import { PartnerStatement } from "@repo/api/components/partner-statement";
import { AppFrame } from "@/components/AppFrame";
import { getCourierToken } from "@/lib/auth";
import Link from "next/link";
export default function EarningsPage() {
  return (
    <AppFrame>
      <Link className="mb-6 block text-sm underline" href="/home/">
        Back to deliveries
      </Link>
      <PartnerStatement party="courier" accessToken={getCourierToken()} />
    </AppFrame>
  );
}
