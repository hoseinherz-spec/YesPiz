"use client";

import { useState, type ComponentProps } from "react";
import { Button, FieldError, Input, Label, TextField } from "@heroui/react";
import styles from "./auth.module.css";

type AuthFieldProps = {
  label: string;
  error?: string;
  isPassword?: boolean;
} & ComponentProps<typeof Input>;

export function AuthField({
  label,
  error,
  isPassword = false,
  type,
  ...inputProps
}: AuthFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      className={styles.field}
      isInvalid={Boolean(error)}
      isRequired={inputProps.required}
    >
      <Label>{label}</Label>
      <div className={styles.inputShell}>
        <Input
          {...inputProps}
          type={isPassword ? (visible ? "text" : "password") : type}
          aria-invalid={Boolean(error)}
        />
        {isPassword && (
          <Button
            type="button"
            variant="ghost"
            isIconOnly
            className={styles.reveal}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            onPress={() => setVisible((value) => !value)}
          >
            <EyeIcon visible={visible} />
          </Button>
        )}
      </div>
      {error && <FieldError>{error}</FieldError>}
    </TextField>
  );
}

export function AuthSubmit({
  children,
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button
      {...props}
      type="submit"
      variant="primary"
      fullWidth
      className={styles.primary}
    >
      {children}
    </Button>
  );
}

function EyeIcon({ visible }: { visible: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" data-visible={visible}>
      <path d="M2.5 12s3.4-5.5 9.5-5.5 9.5 5.5 9.5 5.5-3.4 5.5-9.5 5.5S2.5 12 2.5 12Z" />
      <circle className={styles.eyePupil} cx="12" cy="12" r="2.5" />
      <path className={styles.eyeSlash} pathLength="1" d="M3 3 21 21" />
    </svg>
  );
}
