import { LegacyAuthRedirect } from "@/components/auth/LegacyAuthRedirect";
export default function Page() {
  return <LegacyAuthRedirect to="/auth/sign-up/" />;
}
