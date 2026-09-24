"use client";
import { Form } from "@repo/ui/forms";
import { Button as FormButton } from "@heroui/react";

import { accountClient, ApiError } from "@repo/api";
import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bike, ShieldCheck } from "lucide-react";

import {
  AccountField,
  AccountHero,
  AccountNotice,
  AccountScreen,
  PasswordField,
} from "@/components/AccountScreen";
import { CourierBrand } from "@/components/CourierBrand";
import { getCourierToken, setCourierToken } from "@/lib/auth";
import { hx } from "@/lib/heroui-classes";

export default function CourierLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (getCourierToken()) router.replace("/home/");
  }, [router]);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await accountClient.loginAsRole("courier", {
        method: "password",
        email,
        password,
      });
      setCourierToken(res.accessToken);
      router.replace("/home/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AccountScreen title="Courier sign in" className="courier-screen">
      <CourierBrand className="mx-auto mb-8" />
      <div className="courier-hero mb-7 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-[20px] bg-accent text-accent-foreground">
          <Bike size={28} />
        </span>
        <AccountHero
          title="Ready for the road?"
          description="Sign in to manage your shift, pickups, and deliveries."
        />
      </div>

      {error ? <AccountNotice tone="danger">{error}</AccountNotice> : null}
      {notice ? <AccountNotice>{notice}</AccountNotice> : null}

      <Form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <AccountField
          label="Email address"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="username"
          placeholder="Email Address"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <PasswordField
          label="Password"
          name="password"
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <Button
          variant="ghost"
          onPress={() =>
            setNotice("Contact dispatch to reset your courier password.")
          }
          className="h-auto justify-end self-end px-1 py-1 text-sm font-semibold text-muted"
        >
          Forget Password?
        </Button>
        <Button
          type="submit"
          variant="primary"
          isPending={loading}

          className={hx.btnPrimary}
        >
          {loading ? "Logging in…" : "Log In"}
        </Button>
      </Form>

      <p className="mt-6 text-center text-sm font-medium text-muted">
        Need a courier account?{" "}
        <FormButton
          variant="ghost"
          type="button"
          className="font-bold text-foreground outline-none focus-visible:underline"
          onPress={() =>
            setNotice("Courier accounts are created by your dispatch manager.")
          }
        >
          Contact dispatch
        </FormButton>
      </p>

      <div className="mt-auto flex items-center justify-center gap-2 pt-10 text-center text-xs leading-relaxed text-muted">
        <ShieldCheck size={16} className="shrink-0 text-success" />
        Courier access is issued and protected by your dispatch team.
      </div>
    </AccountScreen>
  );
}
