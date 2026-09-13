"use client";
import { Input } from "@repo/ui/forms";

import { Button, Typography } from "@heroui/react";
import { Eye, EyeSlash } from "@repo/icons";
import type { InputHTMLAttributes, ReactNode } from "react";
import { useState } from "react";

import { AppFrame } from "@/components/AppFrame";
import { ScreenHeader } from "@/components/ScreenHeader";
import { cn } from "@/lib/cn";
import { hx } from "@/lib/heroui-classes";

type AccountScreenProps = {
  title: string;
  children: ReactNode;
  subtitle?: string;
  backHref?: string;
  className?: string;
};

export function AccountScreen({
  title,
  children,
  subtitle,
  backHref,
  className,
}: AccountScreenProps) {
  return (
    <AppFrame padded={false}>
      <div
        className={cn(
          "flex min-h-dvh flex-col px-[clamp(20px,8vw,38px)] pt-[max(28px,env(safe-area-inset-top))] pb-[max(30px,env(safe-area-inset-bottom))]",
          className,
        )}
      >
        <ScreenHeader title={title} subtitle={subtitle} backHref={backHref} />
        {children}
      </div>
    </AppFrame>
  );
}

export function AccountHero({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-9 text-center">
      <Typography
        type="h1"
        className={cn(hx.h1, "whitespace-pre-line text-[38px]")}
      >
        {title}
      </Typography>
      <Typography
        type="body"
        className="mx-auto mt-3 max-w-sm text-[16px] text-muted"
      >
        {description}
      </Typography>
    </div>
  );
}

type AccountFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function AccountField({
  label,
  error,
  className,
  id,
  ...props
}: AccountFieldProps) {
  const inputId = id ?? props.name;
  return (
    <div>
      <Input
        label={label}
        labelClassName="sr-only"
        wrapperClassName="block"
        required={[
          "email",
          "firstName",
          "lastName",
          "street",
          "city",
          "postalCode",
          "code",
        ].includes(props.name ?? "")}
        minLength={props.name === "code" ? 4 : undefined}
        maxLength={
          props.name === "code" ? 6 : props.name === "email" ? 254 : 250
        }
        pattern={props.name === "code" ? "[0-9]{4,6}" : undefined}
        {...props}
        id={inputId}
        className={cn(
          hx.field,
          "bg-card text-[16px] font-semibold focus-visible:ring-2 focus-visible:ring-focus/20",
          error && "border-danger",
          className,
        )}
        aria-invalid={Boolean(error)}
      />
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

type PasswordFieldProps = Omit<AccountFieldProps, "type">;

export function PasswordField({ className, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <AccountField
        required
        minLength={8}
        maxLength={128}
        {...props}
        type={visible ? "text" : "password"}
        className={cn("pr-16", className)}
      />
      <Button
        type="button"
        isIconOnly
        variant="ghost"
        aria-label={visible ? "Hide password" : "Show password"}
        onPress={() => setVisible((current) => !current)}
        className="absolute top-2 right-2 size-[58px] min-w-0 rounded-full text-muted"
      >
        {visible ? <Eye size={22} /> : <EyeSlash size={22} />}
      </Button>
    </div>
  );
}

export function AccountNotice({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "danger" | "success";
}) {
  return (
    <p
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "rounded-[18px] border border-border bg-card px-4 py-3 text-sm leading-relaxed",
        tone === "muted" && "text-muted",
        tone === "danger" && "text-danger",
        tone === "success" && "text-success",
      )}
    >
      {children}
    </p>
  );
}
