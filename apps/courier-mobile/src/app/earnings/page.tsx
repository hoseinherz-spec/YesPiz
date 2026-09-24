"use client";
import { PartnerStatement } from "@repo/api/components/partner-statement";
import { AppFrame } from "@/components/AppFrame";
import { getCourierToken } from "@/lib/auth";
import { ScreenHeader } from "@/components/ScreenHeader";

export default function EarningsPage() {
  return (
    <AppFrame className="courier-screen">
      <ScreenHeader
        title="Earnings"
        subtitle="Statements and settlements"
        backHref="/home/"
      />
      <div className="courier-card">
        <PartnerStatement party="courier" accessToken={getCourierToken()} />
      </div>
    </AppFrame>
  );
}
