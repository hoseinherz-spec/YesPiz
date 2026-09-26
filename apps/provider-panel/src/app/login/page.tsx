"use client";
import { Form, Input } from "@repo/ui/forms";

import { accountClient, ApiError } from "@repo/api";
import { Button, Card, Typography } from "@heroui/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { getProviderToken, setProviderToken } from "@/lib/auth";

export default function ProviderLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("provider.munich@yespizz.local");
  const [password, setPassword] = useState("Provider123!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getProviderToken()) router.replace("/offers");
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await accountClient.loginAsRole("provider", {
        method: "password",
        email,
        password,
      });
      setProviderToken(res.accessToken);
      router.replace("/offers");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        <Card.Content className="flex flex-col gap-4 p-0">
          <div>
            <div className="mb-4 w-fit rounded-lg bg-[#02020e] px-3 py-2">
              <Image src="/yespizz-wordmark.svg" alt="Yespizz" width={150} height={50} priority />
            </div>
            <Typography type="h1" className="text-2xl font-semibold">
              Kitchen login
            </Typography>
            <p className="text-muted mt-1 text-sm">Provider panel</p>
          </div>
          <Form className="flex flex-col gap-3" onSubmit={onSubmit}>
            <Input
              label={<>Email</>}
              wrapperClassName="flex flex-col gap-1 text-sm"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-border bg-background rounded-md border px-3 py-2"
            />
            <Input
              label={<>Password</>}
              wrapperClassName="flex flex-col gap-1 text-sm"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-border bg-background rounded-md border px-3 py-2"
            />
            {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
            <Button type="submit" variant="primary" isDisabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </Form>
        </Card.Content>
      </Card>
    </main>
  );
}
