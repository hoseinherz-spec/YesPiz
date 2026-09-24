"use client";
import { AppText } from "@/components/Text";

import { Form } from "@repo/ui/forms";

import { Avatar, Button } from "@heroui/react";
import { ProfileFormSkeleton } from "@/features/profile/components/ProfileSkeletons";
import styles from "@/features/profile/components/Profile.module.css";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  AccountField,
  AccountNotice,
  AccountScreen,
} from "@/components/AccountScreen";
import type { Translator } from "@/constants/i18n";
import { type AppUser, useApp } from "@/context/AppContext";
import { hx } from "@/lib/heroui-classes";

type EditableProfile = Pick<
  AppUser,
  "firstName" | "lastName" | "email" | "phone"
>;

function EditProfileForm({
  user,
  t,
  updateLocalUser,
}: {
  user: AppUser;
  t: Translator;
  updateLocalUser: (patch: Partial<EditableProfile>) => Promise<void>;
}) {
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [email] = useState(user.email ?? "");
  const [phone] = useState(user.phone ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (saving) return;
    setError(null);
    setStatus(null);
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      (email && !email.includes("@"))
    ) {
      setError(t("login.errorGeneric"));
      return;
    }
    setSaving(true);
    try {
      await updateLocalUser({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      setStatus(t("editProfile.saved"));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not save. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className={styles.editAvatar}>
        <Avatar
          className={styles.avatar}
          aria-label={[firstName, lastName].join(" ")}
        >
          <Avatar.Fallback>
            {(firstName || "Y").slice(0, 1).toUpperCase()}
          </Avatar.Fallback>
        </Avatar>
      </div>

      {error ? <AccountNotice tone="danger">{error}</AccountNotice> : null}
      {status ? <AccountNotice tone="success">{status}</AccountNotice> : null}

      <Form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <div className="grid gap-5">
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="firstName">
              {t("login.firstName")}
            </label>
            <AccountField
              label={t("login.firstName")}
              name="firstName"
              autoComplete="given-name"
              placeholder={t("login.firstName")}
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              className="px-4"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="lastName">
              {t("login.lastName")}
            </label>
            <AccountField
              label={t("login.lastName")}
              name="lastName"
              autoComplete="family-name"
              placeholder={t("login.lastName")}
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              className="px-4"
            />
          </div>
        </div>
        <label className={styles.fieldLabel} htmlFor="email">
          {t("login.emailLabel")}
        </label>
        <AccountField
          label={t("login.emailLabel")}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={t("login.emailLabel")}
          value={email}
          readOnly
        />
        <AccountField
          label={t("editProfile.phone")}
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder={t("login.phonePlaceholder")}
          value={phone}
          readOnly
        />
        <AppText as="p" className="text-center text-xs text-muted">
          Names are saved to your account and synced across devices. Contact
          changes require verification.
        </AppText>
        <Button
          type="submit"
          isDisabled={
            saving ||
            (firstName.trim() === user.firstName &&
              lastName.trim() === user.lastName)
          }
          aria-busy={saving}
          variant="primary"

          className={hx.btnPrimary}
        >
          {t("common.save")}
        </Button>
      </Form>
    </>
  );
}

export default function EditProfilePage() {
  const router = useRouter();
  const { t, hydrated, authed, user, updateLocalUser } = useApp();

  useEffect(() => {
    if (hydrated && !authed) {
      router.replace("/auth/sign-in/?next=/profile/edit/");
    }
  }, [authed, hydrated, router]);

  return (
    <AccountScreen
      title={t("editProfile.title")}
      className={styles.subpage}
      backHref="/profile/"
    >
      {!hydrated ? (
        <ProfileFormSkeleton />
      ) : user ? (
        <EditProfileForm user={user} t={t} updateLocalUser={updateLocalUser} />
      ) : (
        <AppText as="p" className="text-center text-sm text-muted">
          {t("profile.signInPrompt")}
        </AppText>
      )}
    </AccountScreen>
  );
}
