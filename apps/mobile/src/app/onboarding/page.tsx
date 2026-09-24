"use client";
import { BrandLogo } from "@/components/BrandLogo";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import Image from "next/image";
import { apiRequest, withAuth } from "@repo/api";
import { useApp } from "@/context/AppContext";
import { SocialLogin } from "@/components/SocialLogin";
import { Icon, type IconName } from "./luma-icon";
import styles from "./onboarding.module.css";
import {
  authCompletionDestination,
  useAuthDestination,
} from "@/lib/auth-destination";

type Step =
  | "splash"
  | "welcome"
  | "options"
  | "email"
  | "email-code"
  | "phone"
  | "phone-code"
  | "passkey"
  | "profile";
type Notice = "email" | "social" | "passkey" | null;
const artwork = [
  {
    file: "Pizza Chef.png",
    x: 8,
    y: 0,
    size: 26,
    endX: 7,
    endY: -38,
    rotation: -9,
  },
  {
    file: "Pizza Box.png",
    x: 84,
    y: 6,
    size: 28,
    endX: 78,
    endY: -32,
    rotation: 9,
  },
  {
    file: "Pizza.png",
    x: 39,
    y: 23,
    size: 40,
    endX: 46,
    endY: -4,
    rotation: 7,
  },
  {
    file: "Scooter.png",
    x: 6,
    y: 45,
    size: 35,
    endX: -14,
    endY: -8,
    rotation: -8,
  },
  {
    file: "Fresh Ingredients.png",
    x: 76,
    y: 57,
    size: 36,
    endX: 81,
    endY: 23,
    rotation: 8,
  },
  {
    file: "Tomatoes.png",
    x: -13,
    y: 79,
    size: 29,
    endX: 16,
    endY: -31,
    rotation: -10,
  },
  {
    file: "Digital Food Receipt.png",
    x: 34,
    y: 80,
    size: 27,
    endX: -4,
    endY: 40,
    rotation: 6,
  },
  {
    file: "Pizza Slice.png",
    x: 45,
    y: -3,
    size: 23,
    endX: 23,
    endY: -16,
    rotation: -12,
  },
  {
    file: "Mushroom.png",
    x: -6,
    y: 24,
    size: 21,
    endX: 17,
    endY: 30,
    rotation: 12,
  },
  {
    file: "Cheese Block.png",
    x: 67,
    y: 89,
    size: 21,
    endX: 56,
    endY: 37,
    rotation: -8,
  },
] as const;
const validEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
const validPhone = (value: string) =>
  /^\+?[0-9 ()-]{7,22}$/.test(value) && value.replace(/\D/g, "").length >= 7;
const cleanPhone = (value: string) => value.replace(/[^\d+]/g, "");

export default function OnboardingPage() {
  const router = useRouter();
  const app = useApp();
  const destination = useAuthDestination();
  const finishSignIn = () => {
    app.completeOnboarding();
    router.replace(
      preview ? destination : authCompletionDestination(destination),
    );
  };
  const skipOnboarding = () => {
    app.completeOnboarding();
    router.replace("/home/");
  };
  const reduced = useReducedMotion();
  const [step, setStep] = useState<Step>("splash");
  const [preview, setPreview] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const phoneFirst = false;
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [photo, setPhoto] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<Notice>(null);
  const [password, setPassword] = useState("");
  const [viewportHeight, setViewportHeight] = useState<number>();
  const input = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const lock = useRef(false);
  const mounted = useRef(true);
  const touchStart = useRef<number | null>(null);
  const isCode = step === "email-code" || step === "phone-code";

  useEffect(() => {
    mounted.current = true;
    let cancelled = false;
    const ready = Promise.all(
      artwork.map(({ file }) => {
        const image = new window.Image();
        image.src = `/images/pizzacraft/onboarding/${encodeURIComponent(file.replace(".png", ".webp"))}`;
        return image.decode().catch(() => undefined);
      }),
    );
    let decodeTimeout: number | undefined;
    const decodeLimit = new Promise<void>((resolve) => {
      decodeTimeout = window.setTimeout(resolve, 4000);
    });
    const timer = window.setTimeout(async () => {
      await Promise.race([ready, decodeLimit]);
      window.clearTimeout(decodeTimeout);
      if (cancelled) return;
      setPreview(
        new URLSearchParams(window.location.search).get("preview") === "1",
      );
      setStep(
        new URLSearchParams(window.location.search).get("signin") === "1"
          ? new URLSearchParams(window.location.search).get("email") === "1"
            ? "email"
            : "options"
          : "welcome",
      );
    }, 1150);
    const viewport = window.visualViewport;
    const resize = () =>
      setViewportHeight(viewport?.height ?? window.innerHeight);
    resize();
    viewport?.addEventListener("resize", resize);
    return () => {
      mounted.current = false;
      cancelled = true;
      window.clearTimeout(decodeTimeout);
      window.clearTimeout(timer);
      viewport?.removeEventListener("resize", resize);
    };
  }, []);
  useEffect(() => {
    if (!["email", "email-code", "phone", "phone-code"].includes(step)) return;
    const timer = window.setTimeout(
      () => input.current?.focus({ preventScroll: true }),
      reduced ? 0 : 320,
    );
    return () => window.clearTimeout(timer);
  }, [step, reduced]);
  useEffect(() => {
    if (!error) return;
    const timer = window.setTimeout(() => setError(""), 5500);
    return () => window.clearTimeout(timer);
  }, [error]);
  useEffect(() => {
    if (notice) dialog.current?.showModal();
    else dialog.current?.close();
  }, [notice]);
  useEffect(
    () => () => {
      if (photo.startsWith("blob:")) URL.revokeObjectURL(photo);
    },
    [photo],
  );

  function go(next: Step) {
    if (lock.current) return;
    input.current?.blur();
    setError("");
    setCode("");
    setStep(next);
  }
  function back() {
    const previous: Partial<Record<Step, Step>> = {
      options: "welcome",
      email: "options",
      "email-code": "email",
      phone: phoneFirst ? "options" : "email-code",
      "phone-code": "phone",
      passkey: "phone",
      profile: "email-code",
    };
    go(previous[step] ?? "welcome");
  }
  async function run(action: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    app.clearAuthError();
    try {
      await action();
    } catch (cause) {
      if (mounted.current)
        setError(cause instanceof Error ? cause.message : "Please try again.");
    } finally {
      lock.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  const delay = () =>
    new Promise<void>((resolve) => window.setTimeout(resolve, 700));
  function submitContact(event?: FormEvent) {
    event?.preventDefault();
    if (
      (step === "email" && !validEmail(email)) ||
      (step === "phone" && !validPhone(phone))
    )
      return;
    if (step === "email" && !preview) {
      if (password.length < 8) return;
      void run(async () => {
        await app.loginWithPassword(email.trim(), password);
        if (mounted.current) finishSignIn();
      });
      return;
    }
    void run(async () => {
      if (preview) await delay();
      else await app.sendOtp(cleanPhone(phone));
      if (mounted.current) {
        setCode("");
        setStep(step === "email" ? "email-code" : "phone-code");
      }
    });
  }
  function verify(value: string) {
    if (value.length !== 6) return;
    input.current?.blur();
    void run(async () => {
      if (preview) {
        await delay();
        if (value !== "123456") {
          setCode("");
          throw new Error("That's not the correct code. Try again?");
        }
      } else {
        // Email codes are never passed to the phone endpoint or treated as real authentication.
        if (step !== "phone-code")
          throw new Error("Email code sign-in is not available.");
        try {
          await app.loginWithOtp(cleanPhone(phone), value);
          if (mounted.current) finishSignIn();
          return;
        } catch (cause) {
          setCode("");
          throw cause;
        }
      }
      if (mounted.current) {
        setCode("");
        setStep("profile");
      }
    });
  }
  async function saveProfile(event?: FormEvent) {
    event?.preventDefault();
    if (!name.trim()) return;
    const [firstName, ...rest] = name.trim().split(/\s+/);
    try {
      if (!preview) await app.updateLocalUser({ firstName, lastName: rest.join(" ") });
      // Matches the app's existing local profile editing model. Never creates an auth session.
      localStorage.setItem(
        preview ? "yespiz-luma-preview-profile" : "yespiz-onboarding-profile",
        JSON.stringify({ name: name.trim(), bio: bio.trim() }),
      );
    } catch {
      setError("Your profile could not be saved. Please try again.");
      return;
    }
    if (!preview) app.completeOnboarding();
    router.replace(
      preview ? destination : authCompletionDestination(destination),
    );
  }
  function enrollPasskey(event: FormEvent) {
    event.preventDefault();
    if (preview) {
      setNotice(null);
      go("profile");
      return;
    }
    if (!app.accessToken) {
      setError("Sign in before creating a passkey.");
      return;
    }
    void run(async () => {
      const { startRegistration } = await import("@simplewebauthn/browser");
      const request = await apiRequest<{
        requestId: string;
        options: Parameters<typeof startRegistration>[0]["optionsJSON"];
      }>(
        "/api/v1/account/passkeys/register/options",
        withAuth({
          accessToken: app.accessToken!,
          method: "POST",
          body: { password },
        }),
      );
      const response = await startRegistration({
        optionsJSON: request.options,
      });
      await apiRequest(
        "/api/v1/account/passkeys/register/verify",
        withAuth({
          accessToken: app.accessToken!,
          method: "POST",
          body: { requestId: request.requestId, response, name: "My device" },
        }),
      );
      setPassword("");
      setNotice(null);
      setStep("profile");
    });
  }
  const title =
    step === "email"
      ? "Continue with Email"
      : isCode
        ? "Enter Verification Code"
        : step === "phone"
          ? phoneFirst
            ? "Continue with Phone"
            : "Add Your Phone"
          : step === "passkey"
            ? "Simplify Your Sign In"
            : "Complete Your Profile";
  const badge: IconName =
    step === "email"
      ? "mail"
      : isCode
        ? "code"
        : step === "phone"
          ? "phone"
          : "key";
  const canNext =
    step === "email"
      ? validEmail(email) && (preview || password.length >= 8)
      : step === "phone"
        ? validPhone(phone)
        : code.length === 6;
  const spring = reduced
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 155, damping: 25, mass: 1.05 };

  return (
    <main
      className={styles.root}
      style={
        {
          "--visible-height": viewportHeight ? `${viewportHeight}px` : "100dvh",
        } as CSSProperties
      }
    >
      <div className={styles.app}>
        <AnimatePresence mode="wait">
          {step === "splash" ? (
            <motion.div
              key="splash"
              className={styles.splash}
              exit={{ opacity: 0 }}
            >
              <BrandLogo className="brand-logo-splash" />
            </motion.div>
          ) : step === "welcome" || step === "options" ? (
            <motion.div
              key="welcome"
              className={styles.welcome}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.section
                className={styles.hero}
                animate={{
                  height: step === "options" ? "62.4%" : "100%",
                  borderBottomLeftRadius: step === "options" ? 42 : 0,
                  borderBottomRightRadius: step === "options" ? 42 : 0,
                }}
                transition={spring}
                onTouchStart={(event) => {
                  touchStart.current = event.touches[0]?.clientY ?? null;
                }}
                onTouchEnd={(event) => {
                  const y = event.changedTouches[0]?.clientY;
                  if (
                    touchStart.current !== null &&
                    y !== undefined &&
                    Math.abs(y - touchStart.current) > 50
                  )
                    go(y < touchStart.current ? "options" : "welcome");
                  touchStart.current = null;
                }}
              >
                <button
                  type="button"
                  className={styles.skipOnboarding}
                  onClick={skipOnboarding}
                >
                  Skip
                </button>
                <div className={styles.artworkScene} aria-hidden="true">
                  {artwork.map((item, index) => (
                    <motion.div
                      key={item.file}
                      className={styles.artTile}
                      style={
                        {
                          "--float-delay": `${0.9 + index * 0.07}s`,
                          "--float-duration": `${4.2 + (index % 4) * 0.65}s`,
                          "--float-turn": `${index % 2 ? -3 : 3}deg`,
                        } as CSSProperties
                      }
                      initial={
                        reduced
                          ? false
                          : {
                              opacity: 0,
                              scale: 0.88,
                              y: 24 + (index % 3) * 5,
                              rotate: item.rotation + (index % 2 ? -6 : 6),
                              left: `${item.x}%`,
                              top: `${item.y}%`,
                              width: `${item.size}%`,
                            }
                      }
                      animate={{
                        opacity: 1,
                        scale: step === "options" ? 0.94 : 1,
                        y: 0,
                        left: `${step === "options" ? item.endX : item.x}%`,
                        top: `${step === "options" ? item.endY : item.y}%`,
                        width: `${item.size}%`,
                        rotate:
                          step === "options"
                            ? item.rotation / 2
                            : item.rotation,
                      }}
                      transition={
                        reduced
                          ? { duration: 0 }
                          : {
                              type: "spring",
                              stiffness: 180,
                              damping: 24,
                              mass: 0.85 + (index % 3) * 0.1,
                              delay: index * 0.028,
                              opacity: { duration: 0.28, delay: index * 0.028 },
                            }
                      }
                    >
                      <Image
                        src={`/images/pizzacraft/onboarding/${encodeURIComponent(item.file.replace(".png", ".webp"))}`}
                        alt=""
                        width={640}
                        height={640}
                        loading="eager"
                        draggable={false}
                      />
                    </motion.div>
                  ))}
                </div>
                <motion.div
                  className={styles.heroCopy}
                  animate={{ top: step === "options" ? "38vh" : "66.6vh" }}
                  transition={spring}
                >
                  <BrandLogo />
                  <h1>
                    Great pizza.
                    <br />
                    Good times.
                    <br />
                    <span>start here</span>
                  </h1>
                </motion.div>
                {step === "welcome" ? (
                  <button
                    type="button"
                    className={styles.start}
                    aria-label="Get started"
                    onClick={() => go("options")}
                  >
                    <Icon name="arrow" color="currentColor" />
                  </button>
                ) : (
                  <button
                    type="button"
                    className={styles.handleButton}
                    aria-label="Expand welcome"
                    onClick={back}
                  >
                    <span />
                  </button>
                )}
              </motion.section>
              {step === "options" && (
                <motion.div
                  className={styles.options}
                  initial={{ opacity: 0, y: 35 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reduced ? 0 : 0.12 }}
                >
                  <p>
                    Find your favourite pizza, make it your own
                    <br className={styles.wideBreak} /> and get it delivered to
                    your door.
                  </p>
                  <PrimaryButton
                    label="Continue with Email"
                    busy={busy}
                    onClick={() => preview ? go("email") : router.push(`/auth/sign-in/?next=${encodeURIComponent(destination)}`)}
                  />
                  <SocialLogin onSuccess={finishSignIn} withSeparator />
                  <small>
                    Read our <a href="/settings/privacy/">Privacy Policy.</a>
                  </small>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.section
              key={step}
              className={`${styles.screen} ${step === "profile" ? styles.profile : ""} ${step === "passkey" ? styles.passkey : ""}`}
              initial={{ opacity: 0, x: reduced ? 0 : 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: reduced ? 0 : -16 }}
              transition={{ duration: reduced ? 0 : 0.23 }}
              aria-label={title}
            >
              <header className={styles.toolbar}>
                {step === "email" ? (
                  <>
                    <span className={styles.grabber} />
                    <button
                      className={`${styles.round} ${styles.right}`}
                      aria-label="Close"
                      disabled={busy}
                      onClick={() => go("options")}
                    >
                      <Icon name="close" />
                    </button>
                  </>
                ) : (
                  <>
                    {step !== "passkey" && step !== "profile" && (
                      <button
                        className={styles.round}
                        aria-label="Back"
                        disabled={busy}
                        onClick={back}
                      >
                        <Icon name="back" />
                      </button>
                    )}
                    {(step === "passkey" ||
                      (step === "phone" && !phoneFirst)) && (
                      <button
                        className={`${styles.round} ${styles.right}`}
                        disabled={busy}
                        onClick={() =>
                          go(step === "phone" ? "passkey" : "profile")
                        }
                      >
                        Skip
                      </button>
                    )}
                    {step === "profile" && (
                      <button
                        className={`${styles.round} ${styles.right}`}
                        aria-label="Save profile"
                        disabled={!name.trim() || busy}
                        onClick={() => saveProfile()}
                      >
                        <Icon name="check" />
                      </button>
                    )}
                  </>
                )}
              </header>
              <div className={styles.content}>
                {step === "profile" ? (
                  <>
                    <button
                      className={styles.avatar}
                      aria-label="Choose profile photo"
                      onClick={() => fileInput.current?.click()}
                      style={
                        photo
                          ? {
                              backgroundImage: `url(${JSON.stringify(photo)})`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                            }
                          : undefined
                      }
                    >
                      <span>
                        <Icon name="photo" size={20} />
                      </span>
                    </button>
                    <input
                      className={styles.hidden}
                      ref={fileInput}
                      type="file"
                      accept="image/*"
                      aria-label="Profile photo"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          if (
                            !file.type.startsWith("image/") ||
                            file.size > 10 * 1024 * 1024
                          ) {
                            setError("Choose an image smaller than 10 MB.");
                            return;
                          }
                          setPhoto(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </>
                ) : (
                  <div className={styles.badge}>
                    <Icon key={step} name={badge} size={31} />
                  </div>
                )}
                <h1>{title}</h1>
                <p className={styles.subtitle}>
                  {step === "email" ? (
                    "Sign in to your Yespiz account."
                  ) : isCode ? (
                    <>
                      We sent a verification code to your{" "}
                      {step === "email-code" ? "email" : "phone number"}
                      <br />
                      <strong>{step === "email-code" ? email : phone}.</strong>
                    </>
                  ) : step === "phone" ? (
                    "Add your phone number for delivery updates and to stay in touch with your courier."
                  ) : step === "passkey" ? (
                    "Passkeys are a fast and secure way to sign in."
                  ) : (
                    "Make yourself at home. Tell us a little about you."
                  )}
                </p>
                {(step === "email" || step === "phone") && (
                  <form onSubmit={submitContact} className={styles.contactForm}>
                    <input
                      ref={input}
                      aria-label={
                        step === "email" ? "Email Address" : "Phone number"
                      }
                      type={step === "email" ? "email" : "tel"}
                      inputMode={step === "email" ? "email" : "tel"}
                      autoComplete={step === "email" ? "email" : "tel"}
                      autoCapitalize="none"
                      spellCheck={false}
                      value={step === "email" ? email : phone}
                      onChange={(event) =>
                        step === "email"
                          ? setEmail(event.target.value)
                          : setPhone(
                              event.target.value
                                .replace(/[^\d+ ()-]/g, "")
                                .slice(0, 22),
                            )
                      }
                      placeholder={
                        step === "email" ? "Email Address" : "+65 8123 4567"
                      }
                      disabled={busy}
                    />
                    {step === "email" && !preview && (
                      <>
                        <input
                          aria-label="Password"
                          type="password"
                          autoComplete="current-password"
                          placeholder="Password"
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          disabled={busy}
                          minLength={8}
                        />
                        <a className={styles.textLink} href="/auth/forgot-password/">
                          Forgot password?
                        </a>
                        <p className={styles.accountHint}>
                          New to Yespiz?{" "}
                          <a
                            href={`/auth/sign-up/?next=${encodeURIComponent(destination)}`}
                          >
                            Create an account
                          </a>
                        </p>
                      </>
                    )}
                  </form>
                )}
                {isCode && (
                  <div
                    className={styles.codeField}
                    onClick={() => input.current?.focus()}
                  >
                    <div className={styles.digits} aria-hidden="true">
                      {Array.from({ length: 6 }, (_, i) => (
                        <span
                          key={i}
                          data-empty={!code[i]}
                          data-cursor={i === code.length}
                        >
                          {code[i] || "–"}
                        </span>
                      ))}
                    </div>
                    <input
                      ref={input}
                      aria-label="Six digit verification code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={code}
                      disabled={busy}
                      onChange={(event) => {
                        const value = event.target.value
                          .replace(/\D/g, "")
                          .slice(0, 6);
                        setCode(value);
                        if (value.length === 6) verify(value);
                      }}
                    />
                  </div>
                )}
                {step === "passkey" && (
                  <div className={styles.benefits}>
                    {(
                      [
                        [
                          "face",
                          "var(--accent)",
                          "Go Password-Free",
                          "Sign in instantly using Face ID, without needing to enter a password or SMS code.",
                        ],
                        [
                          "lock",
                          "var(--warning)",
                          "Built-in Security",
                          "Passkeys are securely stored on-device, protecting you against threats like phishing.",
                        ],
                        [
                          "devices",
                          "var(--success)",
                          "Works Across Devices",
                          "The system seamlessly syncs passkeys across devices, letting you sign in from anywhere.",
                        ],
                      ] as const
                    ).map(([icon, color, heading, body]) => (
                      <div key={icon}>
                        <span style={{ color }}>
                          <Icon name={icon} color={color} size={23} />
                        </span>
                        <section>
                          <h2>{heading}</h2>
                          <p>{body}</p>
                        </section>
                      </div>
                    ))}
                  </div>
                )}
                {step === "profile" && (
                  <form className={styles.profileForm} onSubmit={saveProfile}>
                    <label>
                      Your Name
                      <input
                        aria-label="Your Name"
                        autoComplete="name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Your Name"
                        maxLength={80}
                      />
                    </label>
                    <label>
                      Bio
                      <textarea
                        aria-label="Bio"
                        value={bio}
                        onChange={(event) => setBio(event.target.value)}
                        placeholder="Share a little about your background and interests."
                        maxLength={500}
                        rows={3}
                      />
                    </label>
                  </form>
                )}
              </div>
              {step !== "profile" && (
                <footer className={styles.footer}>
                  <PrimaryButton
                    label={
                      step === "passkey"
                        ? "Create Passkey"
                        : step === "email" && !preview
                          ? "Sign in"
                          : "Next"
                    }
                    busy={busy}
                    onClick={() => {
                      if (step === "passkey") setNotice("passkey");
                      else if (isCode) verify(code);
                      else submitContact();
                    }}
                    disabled={step !== "passkey" && !canNext}
                  />
                </footer>
              )}
            </motion.section>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {error && (
            <motion.div
              role="alert"
              className={styles.toast}
              initial={{ opacity: 0, y: -25 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <Icon name="warning" color="currentColor" size={17} />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>
        <dialog
          ref={dialog}
          className={styles.dialog}
          onCancel={() => {
            if (!busy) setNotice(null);
          }}
          onClose={() => setNotice(null)}
        >
          {notice === "social" && (
            <>
              <h2>Continue to Yespiz</h2>
              <SocialLogin
                onSuccess={() => {
                  setNotice(null);
                  finishSignIn();
                }}
              />
              {!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID &&
                !process.env.NEXT_PUBLIC_APPLE_CLIENT_ID && (
                  <p>
                    Social sign-in is not configured. Continue with Phone to
                    sign in.
                  </p>
                )}
            </>
          )}
          {notice === "passkey" && (
            <form onSubmit={enrollPasskey}>
              <h2>Create Passkey</h2>
              <p>
                {preview
                  ? "This is a visual preview. No passkey will be created."
                  : "Confirm your current Yespiz password to create a passkey on this device."}
              </p>
              {!preview && (
                <input
                  type="password"
                  aria-label="Current password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Current password"
                />
              )}
              <button className={styles.primary} type="submit" disabled={busy}>
                {preview
                  ? "Continue to profile"
                  : busy
                    ? "Waiting for your device…"
                    : "Create Passkey"}
              </button>
            </form>
          )}
          <button
            className={styles.dismiss}
            disabled={busy}
            onClick={() => {
              setNotice(null);
              setPassword("");
            }}
          >
            Cancel
          </button>
        </dialog>
      </div>
    </main>
  );
}

function PrimaryButton({
  label,
  onClick,
  busy,
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  busy: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={styles.primary}
      onClick={onClick}
      disabled={disabled || busy}
      aria-busy={busy}
    >
      {busy && <span className={styles.spinner} aria-label="Loading" />}
      {label}
    </button>
  );
}
