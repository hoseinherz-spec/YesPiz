"use client";
import { useNotifications } from "@/lib/use-notifications";
import { disableNotifications } from "@repo/api/components/notifications";

import {
  accountClient,
  apiRequest,
  ApiError,
  ordersClient,
  type CustomerOrderProjection,
  type CustomerOrderView,
  type DeliveryAddress,
  type ProfileResponse,
} from "@repo/api";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Language, makeTranslator, Translator } from "@/constants/i18n";
import { palettes, Palette } from "@/constants/theme";
import { entityId } from "@/lib/entity-id";
import { pickDeliveryEta, type EtaWindow } from "@/lib/eta";

export type ThemeMode = "dark" | "light";

export type OrderStatusKey =
  "received" | "kitchen" | "preparing" | "driver" | "onway" | "delivered";

export const ORDER_STEPS: { key: OrderStatusKey }[] = [
  { key: "received" },
  { key: "kitchen" },
  { key: "preparing" },
  { key: "driver" },
  { key: "onway" },
  { key: "delivered" },
];

export type Order = {
  id: string;
  items: { name: string; quantity: number }[];
  total: number;
  placedAt: number;
  status: "active" | "completed" | "cancelled";
  awaitingPayment?: boolean;
  refundStatus?: string;
  stepIndex: number;
  eta: EtaWindow;
  deliveryWindowStart?: string;
  deliveryWindowEnd?: string;
  scheduledAt?: string;
  isScheduled?: boolean;
  promisedDeliveryAt?: string;
  compensationCents?: number;
  customerStatus?: CustomerOrderProjection | null;
  requiresDeliveryPin?: boolean;
  deliveryPin?: string;
  leaveAtDoor?: boolean;
  hasShortExtraStop?: boolean;
  thumbnail?: string;
  addressId?: string;
  deliveryAddress?: string;
  deliveryInstructions?: string;
};

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  kind: "order" | "promo" | "system";
};

export type Address = {
  id: string;
  label: string;
  detail: string;
  street: string;
  city?: string;
  zipcode?: string;
  isDefault: boolean;
  entrance?: string;
  floor?: string;
  unit?: string;
};

export type AppUser = {
  profileRevision?: number;
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
};

type AppContextValue = {
  hydrated: boolean;
  mode: ThemeMode;
  colors: Palette;
  toggleMode: () => void;
  setMode: (m: ThemeMode) => void;
  language: Language;
  setLanguage: (l: Language) => void;
  t: Translator;
  user: AppUser | null;
  userName: string;
  userEmail: string;
  updateLocalUser: (
    patch: Partial<Pick<AppUser, "firstName" | "lastName" | "email" | "phone">>,
  ) => Promise<void>;
  accessToken: string | null;
  authed: boolean;
  authLoading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  onboarded: boolean;
  welcomed: boolean;
  completeWelcome: () => void;
  sendOtp: (phone: string) => Promise<void>;
  loginWithOtp: (
    phone: string,
    code: string,
    names?: { firstName?: string; lastName?: string },
  ) => Promise<void>;
  loginWithSocial: (
    provider: "google" | "apple" | "facebook",
    idToken: string,
    nonce: string,
  ) => Promise<void>;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  loginWithPasskey: () => Promise<void>;
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) => Promise<void>;
  logout: () => void;
  completeOnboarding: () => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  addresses: Address[];
  addressesLoading: boolean;
  addressesError: string | null;
  selectedAddressId: string;
  setSelectedAddressId: (id: string) => void;
  refreshAddresses: () => Promise<void>;
  createAddress: (input: {
    label: string;
    street: string;
    city?: string;
    zipcode?: string;
    longitude: number;
    latitude: number;
    entrance?: string;
    floor?: string;
    unit?: string;
    doorCode?: string;
    instructions?: string;
  }) => Promise<Address>;
  deleteAddress: (id: string) => Promise<void>;
  orders: Order[];
  refreshOrders: () => Promise<void>;
  addOrder: (o: Order) => void;
  activeOrderId: string | null;
  setActiveOrderId: (id: string | null) => void;
  advanceActiveOrder: () => void;
  notifications: AppNotification[];
  markAllRead: () => Promise<void>;
  notificationsLoading: boolean;
  notificationsError: string;
  notificationsSaving: boolean;
  refreshNotifications: () => Promise<void>;
  loadMoreNotifications: () => Promise<void>;
  hasMoreNotifications: boolean;
  unreadCount: number;
  pushEnabled: boolean;
  setPushEnabled: (v: boolean) => void;
  emailNotificationsEnabled: boolean;
  setEmailNotificationsEnabled: (v: boolean) => void;
  smsNotificationsEnabled: boolean;
  setSmsNotificationsEnabled: (v: boolean) => void;
  locationEnabled: boolean;
  setLocationEnabled: (v: boolean) => void;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

const STORAGE_KEY = "yespiz_state_v2";
const AUTH_SESSION_KEY = "yespiz_auth_session_v1";
const AUTH_PROFILE_KEY = "yespiz_auth_profile_v1";
const DELIVERY_COUNTRY = (
  process.env.NEXT_PUBLIC_PAYMENT_COUNTRY || "DE"
).toUpperCase();
const DEFAULT_DELIVERY_CITY = DELIVERY_COUNTRY === "AT" ? "Wien" : "Munich";

const SAMPLE_ORDERS: Order[] = [
  {
    id: "o-1001",
    items: [
      { name: "YesPiz Special", quantity: 1 },
      { name: "Diavola", quantity: 1 },
    ],
    total: 31.7,
    placedAt: Date.now() - 1000 * 60 * 60 * 26,
    status: "completed",
    stepIndex: 5,
    eta: {},
  },
  {
    id: "o-1000",
    items: [{ name: "Margherita", quantity: 2 }],
    total: 22.7,
    placedAt: Date.now() - 1000 * 60 * 60 * 72,
    status: "completed",
    stepIndex: 5,
    eta: {},
  },
  {
    id: "o-0999",
    items: [{ name: "Funghi", quantity: 1 }],
    total: 14.4,
    placedAt: Date.now() - 1000 * 60 * 60 * 120,
    status: "cancelled",
    stepIndex: 0,
    eta: {},
  },
];

const CUSTOMER_ROLE = "client" as const;

const STATUS_INDEX: Record<CustomerOrderProjection, number> = {
  received: 0,
  kitchen: 1,
  preparing: 2,
  driver: 3,
  onway: 4,
  delivered: 5,
};

function mapProfile(
  profile:
    | ProfileResponse
    | {
        id: string;
        firstName: string;
        lastName: string;
        email?: string;
        phone?: string;
      },
): AppUser {
  return {
    profileRevision:
      "profileRevision" in profile ? (profile.profileRevision as number) : 0,
    id: profile.id,
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    phone: profile.phone,
  };
}

function mapAddress(doc: DeliveryAddress): Address {
  const id = entityId(doc);
  const access = [
    doc.entrance ? `Stiege ${doc.entrance}` : "",
    doc.floor ? `${doc.floor}. Stock` : "",
    doc.unit ? `Tür ${doc.unit}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  const detail = [
    doc.street,
    [doc.zipcode, doc.city].filter(Boolean).join(" "),
    access,
  ]
    .filter(Boolean)
    .join(", ");
  return {
    id,
    label: doc.label,
    detail,
    street: doc.street,
    city: doc.city,
    zipcode: doc.zipcode,
    isDefault: doc.isDefault,
    entrance: doc.entrance,
    floor: doc.floor,
    unit: doc.unit,
  };
}

export function mapCustomerOrder(view: CustomerOrderView): Order {
  const stepIndex =
    view.customerStatus != null ? (STATUS_INDEX[view.customerStatus] ?? 0) : 0;
  const delivered =
    view.orderState === "completed" || view.customerStatus === "delivered";
  const cancelled = view.orderState === "cancelled";
  return {
    id: view.id,
    addressId: view.addressId,
    deliveryAddress: [
      view.deliveryStreet,
      view.deliveryCity,
      view.deliveryZipcode,
    ]
      .filter(Boolean)
      .join(", "),
    deliveryInstructions: view.deliveryInstructions,
    items: view.lines.map((line) => ({
      name: line.name,
      quantity: line.quantity,
    })),
    total: view.totalCents / 100,
    placedAt: view.createdAt ? new Date(view.createdAt).getTime() : Date.now(),
    status: cancelled ? "cancelled" : delivered ? "completed" : "active",
    refundStatus: view.refundStatus,
    awaitingPayment: view.orderState === "awaiting_payment",
    stepIndex,
    eta: delivered ? {} : pickDeliveryEta(view),
    deliveryWindowStart: view.deliveryWindowStart,
    deliveryWindowEnd: view.deliveryWindowEnd,
    scheduledAt: view.scheduledAt,
    isScheduled: view.isScheduled,
    promisedDeliveryAt: view.promisedDeliveryAt,
    compensationCents: view.compensationCents,
    customerStatus: view.customerStatus,
    requiresDeliveryPin: view.requiresDeliveryPin,
    deliveryPin: view.deliveryPin,
    leaveAtDoor: view.leaveAtDoor,
    hasShortExtraStop: view.hasShortExtraStop,
  };
}

function authErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [mode, setModeState] = useState<ThemeMode>("dark");
  const [language, setLanguageState] = useState<Language>("en");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [onboarded, setOnboarded] = useState(false);
  const [welcomed, setWelcomed] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([
    "pepperoni",
    "yespiz-special",
  ]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [addressesError, setAddressesError] = useState<string | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const notificationState = useNotifications(accessToken);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] =
    useState(true);
  const [smsNotificationsEnabled, setSmsNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [localProfile, setLocalProfile] = useState<
    Partial<Pick<AppUser, "firstName" | "lastName" | "email" | "phone">>
  >({});

  const sessionToken = useRef<string | null>(null);
  const persistToken = useCallback((token: string | null) => {
    sessionToken.current = token;
    setAccessToken(token);
    try {
      if (token) sessionStorage.setItem(AUTH_SESSION_KEY, token);
      else {
        sessionStorage.removeItem(AUTH_SESSION_KEY);
        sessionStorage.removeItem(AUTH_PROFILE_KEY);
      }
    } catch {
      // The in-memory session remains usable when storage is unavailable.
    }
  }, []);

  const refreshAddresses = useCallback(
    async (token?: string | null) => {
      const auth = token === undefined ? accessToken : token;
      if (!auth) {
        setAddresses([]);
        setAddressesLoading(false);
        setAddressesError(null);
        return;
      }
      setAddressesLoading(true);
      setAddressesError(null);
      try {
        const list = await ordersClient.listAddresses({ accessToken: auth });
        const mapped = list.map(mapAddress).filter((a) => a.id);
        setAddresses(mapped);
        setSelectedAddressId((prev) => {
          if (prev && mapped.some((a) => a.id === prev)) return prev;
          const preferred = list.find((a) => a.isDefault) ?? list[0];
          return preferred ? entityId(preferred) : "";
        });
      } catch (error) {
        setAddressesError(authErrorMessage(error));
        throw error;
      } finally {
        setAddressesLoading(false);
      }
    },
    [accessToken],
  );

  const refreshOrders = useCallback(
    async (token?: string | null) => {
      const auth = token === undefined ? accessToken : token;
      if (!auth) {
        setOrders(SAMPLE_ORDERS);
        return;
      }
      const list = await ordersClient.list({ accessToken: auth });
      setOrders(list.map(mapCustomerOrder));
    },
    [accessToken],
  );

  const applyAuth = useCallback(
    (token: string, profile: AppUser) => {
      persistToken(token);
      setUser(profile);
      try {
        sessionStorage.setItem(AUTH_PROFILE_KEY, JSON.stringify(profile));
      } catch {
        // The active in-memory profile is still authoritative.
      }
      setAuthError(null);
      void refreshAddresses(token).catch(() => setAddresses([]));
      void refreshOrders(token).catch(() => setOrders([]));
    },
    [persistToken, refreshAddresses, refreshOrders],
  );

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("campaign");
    if (code && /^[a-z0-9-]{3,40}$/.test(code)) {
      try {
        sessionStorage.setItem("yespizz_campaign", code);
      } catch {
        /* attribution is optional */
      }
    }
  }, []);

  useEffect(() => {
    /* Intentional: hydrate UI state from localStorage after mount (SSR-safe). */
    let cancelled = false;

    async function hydrate() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const s = JSON.parse(raw) as Record<string, unknown>;
          if (s.mode === "dark" || s.mode === "light") setModeState(s.mode);
          if (s.language === "en" || s.language === "de")
            setLanguageState(s.language);
          if (typeof s.onboarded === "boolean") setOnboarded(s.onboarded);
          if (typeof s.welcomed === "boolean") setWelcomed(s.welcomed);
          if (Array.isArray(s.favorites)) setFavorites(s.favorites as string[]);
          if (typeof s.pushEnabled === "boolean") setPushEnabled(s.pushEnabled);
          if (typeof s.emailNotificationsEnabled === "boolean") {
            setEmailNotificationsEnabled(s.emailNotificationsEnabled);
          }
          if (typeof s.smsNotificationsEnabled === "boolean") {
            setSmsNotificationsEnabled(s.smsNotificationsEnabled);
          }
          if (typeof s.locationEnabled === "boolean") {
            setLocationEnabled(s.locationEnabled);
          }
          if (typeof s.selectedAddressId === "string") {
            setSelectedAddressId(s.selectedAddressId);
          }
          if (typeof s.activeOrderId === "string" || s.activeOrderId === null) {
            setActiveOrderId(s.activeOrderId as string | null);
          }
        }

        const storedToken = sessionStorage.getItem(AUTH_SESSION_KEY);
        if (storedToken) {
          sessionToken.current = storedToken;
          setAccessToken(storedToken);
          const cachedProfile = sessionStorage.getItem(AUTH_PROFILE_KEY);
          if (cachedProfile) {
            try {
              const parsed = JSON.parse(cachedProfile) as AppUser;
              if (parsed?.id) setUser(parsed);
            } catch {
              sessionStorage.removeItem(AUTH_PROFILE_KEY);
            }
          }
          try {
            // Authentication is determined by /me alone. Optional address or
            // order fetches must not erase a valid session on a transient error.
            const me = await accountClient.getMe({ accessToken: storedToken });
            if (!cancelled) {
              const profile = mapProfile(me);
              setUser(profile);
              sessionStorage.setItem(AUTH_PROFILE_KEY, JSON.stringify(profile));
            }
            const [addressResult, orderResult] = await Promise.allSettled([
              ordersClient.listAddresses({ accessToken: storedToken }),
              ordersClient.list({ accessToken: storedToken }),
            ]);
            if (!cancelled) {
              if (addressResult.status === "fulfilled") {
                const addressDocs = addressResult.value;
                const mappedAddresses = addressDocs
                  .map(mapAddress)
                  .filter((address) => address.id);
                setAddresses(mappedAddresses);
                setSelectedAddressId((selected) => {
                  if (
                    selected &&
                    mappedAddresses.some((address) => address.id === selected)
                  )
                    return selected;
                  const preferred =
                    addressDocs.find((address) => address.isDefault) ??
                    addressDocs[0];
                  return preferred ? entityId(preferred) : "";
                });
              } else {
                setAddressesError(authErrorMessage(addressResult.reason));
              }
              if (orderResult.status === "fulfilled") {
                setOrders(orderResult.value.map(mapCustomerOrder));
              } else {
                setOrders([]);
              }
            }
          } catch (error) {
            if (error instanceof ApiError && error.status === 401) {
              sessionStorage.removeItem(AUTH_SESSION_KEY);
              sessionStorage.removeItem(AUTH_PROFILE_KEY);
              if (!cancelled) {
                sessionToken.current = null;
                setAccessToken(null);
                setUser(null);
                setOrders(SAMPLE_ORDERS);
              }
            } else if (!cancelled) {
              // Keep the last authenticated session during a transient API
              // outage; foreground/online sync will verify it again.
              setAuthError(authErrorMessage(error));
            }
          }
        } else {
          setOrders(SAMPLE_ORDERS);
        }
      } catch {
        // ignore corrupt storage
      } finally {
        if (!cancelled) setHydrated(true);
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          mode,
          language,
          onboarded,
          welcomed,
          favorites,
          pushEnabled,
          emailNotificationsEnabled,
          smsNotificationsEnabled,
          locationEnabled,
          selectedAddressId,
          activeOrderId,
          localProfile,
        }),
      );
    } catch {
      // ignore
    }
  }, [
    hydrated,
    mode,
    language,
    onboarded,
    welcomed,
    favorites,
    pushEnabled,
    emailNotificationsEnabled,
    smsNotificationsEnabled,
    locationEnabled,
    selectedAddressId,
    activeOrderId,
    localProfile,
  ]);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.classList.toggle("dark", mode === "dark");
    document.documentElement.classList.toggle("light", mode === "light");
    document.documentElement.setAttribute("data-theme", mode);
  }, [hydrated, mode]);

  const setMode = useCallback((m: ThemeMode) => setModeState(m), []);
  const setLanguage = useCallback((l: Language) => setLanguageState(l), []);
  const t = useMemo(() => makeTranslator(language), [language]);
  const toggleMode = useCallback(
    () => setModeState((m) => (m === "dark" ? "light" : "dark")),
    [],
  );

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const updateLocalUser = useCallback(
    async (
      patch: Partial<
        Pick<AppUser, "firstName" | "lastName" | "email" | "phone">
      >,
    ) => {
      if (!accessToken || !user) throw new Error("Please sign in first.");
      if (
        (patch.email !== undefined && patch.email !== user.email) ||
        (patch.phone !== undefined && patch.phone !== user.phone)
      )
        throw new Error("Contact changes require verification.");
      const me = await accountClient.updateMe(
        {
          firstName: patch.firstName ?? user.firstName,
          lastName: patch.lastName ?? user.lastName,
          revision: user.profileRevision ?? 0,
        },
        { accessToken },
      );
      if (sessionToken.current === accessToken) {
        setUser(mapProfile(me));
        setLocalProfile({});
      }
    },
    [accessToken, user],
  );

  // Refresh from the API when returning to the app or reconnecting. Ignore stale responses.
  useEffect(() => {
    if (!hydrated || !accessToken) return;
    let cancelled = false;
    let pending = false;
    const sync = async () => {
      if (pending || document.visibilityState === "hidden") return;
      pending = true;
      try {
        const me = await accountClient.getMe({ accessToken });
        if (!cancelled && sessionToken.current === accessToken)
          setUser((current) =>
            current &&
            current.id === me.id &&
            (current.profileRevision ?? 0) > (me.profileRevision ?? 0)
              ? current
              : mapProfile(me),
          );
      } catch (error) {
        if (
          !cancelled &&
          sessionToken.current === accessToken &&
          error instanceof ApiError &&
          error.status === 401
        ) {
          persistToken(null);
          setUser(null);
          setAddresses([]);
          setOrders([]);
        }
      } finally {
        pending = false;
      }
    };
    window.addEventListener("focus", sync);
    window.addEventListener("online", sync);
    document.addEventListener("visibilitychange", sync);
    const timer = window.setInterval(sync, 60000);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener("focus", sync);
      window.removeEventListener("online", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [hydrated, accessToken, persistToken]);

  const sendOtp = useCallback(async (phone: string) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await accountClient.sendOtp({
        phone,
        role: CUSTOMER_ROLE,
        channel: "sms",
      });
    } catch (err) {
      setAuthError(authErrorMessage(err));
      throw err;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const loginWithOtp = useCallback(
    async (
      phone: string,
      code: string,
      names?: { firstName?: string; lastName?: string },
    ) => {
      setAuthLoading(true);
      setAuthError(null);
      try {
        const res = await accountClient.confirmOtp({
          phone,
          code,
          role: CUSTOMER_ROLE,
          firstName: names?.firstName,
          lastName: names?.lastName,
        });
        applyAuth(res.accessToken, mapProfile(res.user));
        setOnboarded(true);
      } catch (err) {
        setAuthError(authErrorMessage(err));
        throw err;
      } finally {
        setAuthLoading(false);
      }
    },
    [applyAuth],
  );

  const loginWithSocial = useCallback(
    async (
      provider: "google" | "apple" | "facebook",
      idToken: string,
      nonce: string,
    ) => {
      setAuthLoading(true);
      setAuthError(null);
      try {
        const res = await accountClient.socialLogin({
          provider,
          idToken,
          nonce,
        });
        applyAuth(res.accessToken, mapProfile(res.user));
        setOnboarded(true);
      } catch (err) {
        setAuthError(authErrorMessage(err));
        throw err;
      } finally {
        setAuthLoading(false);
      }
    },
    [applyAuth],
  );

  const loginWithPassword = useCallback(
    async (email: string, password: string) => {
      setAuthLoading(true);
      setAuthError(null);
      try {
        const res = await accountClient.login({
          method: "password",
          role: CUSTOMER_ROLE,
          email,
          password,
        });
        applyAuth(res.accessToken, mapProfile(res.user));
        setOnboarded(true);
      } catch (err) {
        setAuthError(authErrorMessage(err));
        throw err;
      } finally {
        setAuthLoading(false);
      }
    },
    [applyAuth],
  );

  const loginWithPasskey = useCallback(async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const { startAuthentication } = await import("@simplewebauthn/browser");
      const request = await apiRequest<{
        requestId: string;
        options: Parameters<typeof startAuthentication>[0]["optionsJSON"];
      }>("/api/v1/account/passkeys/authenticate/options", { method: "POST" });
      const response = await startAuthentication({
        optionsJSON: request.options,
      });
      const result = await apiRequest<
        Awaited<ReturnType<typeof accountClient.login>>
      >("/api/v1/account/passkeys/authenticate/verify", {
        method: "POST",
        body: { requestId: request.requestId, response },
      });
      applyAuth(result.accessToken, mapProfile(result.user));
      setOnboarded(true);
    } catch (error) {
      setAuthError(authErrorMessage(error));
      throw error;
    } finally {
      setAuthLoading(false);
    }
  }, [applyAuth]);

  const register = useCallback(
    async (
      email: string,
      password: string,
      firstName: string,
      lastName: string,
    ) => {
      setAuthLoading(true);
      setAuthError(null);
      try {
        const res = await accountClient.register({
          email,
          password,
          firstName,
          lastName,
          role: CUSTOMER_ROLE,
        });
        applyAuth(res.accessToken, mapProfile(res.user));
        setOnboarded(true);
      } catch (err) {
        setAuthError(authErrorMessage(err));
        throw err;
      } finally {
        setAuthLoading(false);
      }
    },
    [applyAuth],
  );

  const logout = useCallback(() => {
    if (accessToken)
      void disableNotifications(accessToken).catch(() => undefined);
    persistToken(null);
    setUser(null);
    setAddresses([]);
    setAddressesLoading(false);
    setAddressesError(null);
    setSelectedAddressId("");
    setOrders(SAMPLE_ORDERS);
    setActiveOrderId(null);
    setAuthError(null);
    setLocalProfile({});
  }, [persistToken, accessToken]);

  const completeWelcome = useCallback(() => setWelcomed(true), []);
  const completeOnboarding = useCallback(() => setOnboarded(true), []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);
  const isFavorite = useCallback(
    (id: string) => favorites.includes(id),
    [favorites],
  );

  const createAddress = useCallback(
    async (input: {
      label: string;
      street: string;
      city?: string;
      zipcode?: string;
      longitude: number;
      latitude: number;
      entrance?: string;
      floor?: string;
      unit?: string;
      doorCode?: string;
      instructions?: string;
    }) => {
      if (!accessToken) throw new Error("Not authenticated");
      const created = await ordersClient.createAddress(
        {
          label: input.label,
          street: input.street,
          city: input.city ?? DEFAULT_DELIVERY_CITY,
          zipcode: input.zipcode,
          country: DELIVERY_COUNTRY,
          longitude: input.longitude,
          latitude: input.latitude,
          isDefault: addresses.length === 0,
          entrance: input.entrance,
          floor: input.floor,
          unit: input.unit,
          doorCode: input.doorCode,
          instructions: input.instructions,
        },
        { accessToken },
      );
      const mapped = mapAddress(created);
      await refreshAddresses();
      if (mapped.id) setSelectedAddressId(mapped.id);
      return mapped;
    },
    [accessToken, addresses.length, refreshAddresses],
  );

  const deleteAddress = useCallback(
    async (id: string) => {
      if (!accessToken) throw new Error("Not authenticated");
      await ordersClient.deleteAddress(id, { accessToken });
      await refreshAddresses();
    },
    [accessToken, refreshAddresses],
  );

  const addOrder = useCallback((o: Order) => {
    setOrders((prev) => [o, ...prev.filter((x) => x.id !== o.id)]);
    setActiveOrderId(o.id);
  }, []);

  const advanceActiveOrder = useCallback(() => {
    // Local demo fallback only — API orders are polled by tracking page.
    if (accessToken) return;
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== activeOrderId) return o;
        const next = Math.min(o.stepIndex + 1, ORDER_STEPS.length - 1);
        return {
          ...o,
          stepIndex: next,
          status: next === ORDER_STEPS.length - 1 ? "completed" : "active",
        };
      }),
    );
  }, [activeOrderId, accessToken]);

  const colors = mode === "dark" ? palettes.dark : palettes.light;
  const userName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      user.firstName
    : "Guest";
  const userEmail = user?.email ?? user?.phone ?? "";

  const value: AppContextValue = {
    hydrated,
    mode,
    colors,
    toggleMode,
    setMode,
    language,
    setLanguage,
    t,
    user,
    userName,
    userEmail,
    updateLocalUser,
    accessToken,
    authed: Boolean(accessToken && user),
    authLoading,
    authError,
    clearAuthError,
    onboarded,
    welcomed,
    completeWelcome,
    sendOtp,
    loginWithOtp,
    loginWithPassword,
    loginWithPasskey,
    loginWithSocial,
    register,
    logout,
    completeOnboarding,
    favorites,
    toggleFavorite,
    isFavorite,
    addresses,
    addressesLoading,
    addressesError,
    selectedAddressId,
    setSelectedAddressId,
    refreshAddresses,
    createAddress,
    deleteAddress,
    orders,
    refreshOrders,
    addOrder,
    activeOrderId,
    setActiveOrderId,
    advanceActiveOrder,
    ...notificationState,
    pushEnabled,
    setPushEnabled,
    emailNotificationsEnabled,
    setEmailNotificationsEnabled,
    smsNotificationsEnabled,
    setSmsNotificationsEnabled,
    locationEnabled,
    setLocationEnabled,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export function useTheme() {
  return useApp().colors;
}
