"use client";
import { PartnerStatement } from "@repo/api/components/partner-statement";
import { getProviderToken } from "@/lib/auth";
export default function StatementPage() {
  return <PartnerStatement party="provider" accessToken={getProviderToken()} />;
}
