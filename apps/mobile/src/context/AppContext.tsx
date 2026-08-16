'use client';

import {
  accountClient,
  ApiError,
  ordersClient,
  type CustomerOrderProjection,
  type CustomerOrderView,
  type DeliveryAddress,
  type ProfileResponse,
} from '@repo/api';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { Language, makeTranslator, Translator } from '@/constants/i18n';
import { palettes, Palette } from '@/constants/theme';
import { entityId } from '@/lib/entity-id';
import { pickDeliveryEta, type EtaWindow } from '@/lib/eta';

export type ThemeMode = 'dark' | 'light';

export type OrderStatusKey =
  | 'received'
  | 'kitchen'
  | 'preparing'
  | 'driver'
  | 'onway'
  | 'delivered';

export const ORDER_STEPS: { key: OrderStatusKey }[] = [
  { key: 'received' },
  { key: 'kitchen' },
  { key: 'preparing' },
  { key: 'driver' },
  { key: 'onway' },
  { key: 'delivered' },
];

export type Order = {
  id: string;
  items: { name: string; quantity: number }[];
  total: number;
  placedAt: number;
  status: 'active' | 'completed' | 'cancelled';
  stepIndex: number;
  eta: EtaWindow;
  customerStatus?: CustomerOrderProjection | null;
  requiresDeliveryPin?: boolean;
  deliveryPin?: string;
  leaveAtDoor?: boolean;
  hasShortExtraStop?: boolean;
  thumbnail?: string;
};

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  kind: 'order' | 'promo' | 'system';
};

export type Address = {
  id: string;
  label: string;
  detail: string;
};

export type AppUser = {
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
  updateLocalUser: (patch: Partial<Pick<AppUser, 'firstName' | 'lastName' | 'email' | 'phone'>>) => void;
  accessToken: string | null;
  authed: boolean;
  authLoading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  onboarded: boolean;
  sendOtp: (phone: string) => Promise<void>;
  loginWithOtp: (
    phone: string,
    code: string,
    names?: { firstName?: string; lastName?: string },
  ) => Promise<void>;
  loginWithPassword: (email: string, password: string) => Promise<void>;
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
  selectedAddressId: string;
  setSelectedAddressId: (id: string) => void;
  refreshAddresses: () => Promise<void>;
  createAddress: (input: {
    label: string;
    street: string;
    city?: string;
    zipcode?: string;
  }) => Promise<Address>;
  orders: Order[];
  refreshOrders: () => Promise<void>;
  addOrder: (o: Order) => void;
  activeOrderId: string | null;
  setActiveOrderId: (id: string | null) => void;
  advanceActiveOrder: () => void;
  notifications: AppNotification[];
  markAllRead: () => void;
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

const STORAGE_KEY = 'yespiz_state_v2';
const TOKEN_KEY = 'yespizz_access_token';

const SAMPLE_ORDERS: Order[] = [
  {
    id: 'o-1001',
    items: [
      { name: 'YesPiz Special', quantity: 1 },
      { name: 'Diavola', quantity: 1 },
    ],
    total: 31.7,
    placedAt: Date.now() - 1000 * 60 * 60 * 26,
    status: 'completed',
    stepIndex: 5,
    eta: {},
  },
  {
    id: 'o-1000',
    items: [{ name: 'Margherita', quantity: 2 }],
    total: 22.7,
    placedAt: Date.now() - 1000 * 60 * 60 * 72,
    status: 'completed',
    stepIndex: 5,
    eta: {},
  },
  {
    id: 'o-0999',
    items: [{ name: 'Funghi', quantity: 1 }],
    total: 14.4,
    placedAt: Date.now() - 1000 * 60 * 60 * 120,
    status: 'cancelled',
    stepIndex: 0,
    eta: {},
  },
];

const SAMPLE_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    title: 'notif.n1.title',
    body: 'notif.n1.body',
    time: 'notif.n1.time',
    unread: true,
    kind: 'order',
  },
  {
    id: 'n2',
    title: 'notif.n2.title',
    body: 'notif.n2.body',
    time: 'notif.n2.time',
    unread: true,
    kind: 'promo',
  },
  {
    id: 'n3',
    title: 'notif.n3.title',
    body: 'notif.n3.body',
    time: 'notif.n3.time',
    unread: false,
    kind: 'promo',
  },
];

const CUSTOMER_ROLE = 'client' as const;

const STATUS_INDEX: Record<CustomerOrderProjection, number> = {
  received: 0,
  kitchen: 1,
  preparing: 2,
  driver: 3,
  onway: 4,
  delivered: 5,
};

function mapProfile(profile: ProfileResponse | { id: string; firstName: string; lastName: string; email?: string; phone?: string }): AppUser {
  return {
    id: profile.id,
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    phone: profile.phone,
  };
}

function mapAddress(doc: DeliveryAddress): Address {
  const id = entityId(doc);
  const detail = [doc.street, doc.zipcode, doc.city].filter(Boolean).join(', ');
  return { id, label: doc.label, detail };
}

export function mapCustomerOrder(view: CustomerOrderView): Order {
  const stepIndex =
    view.customerStatus != null ? (STATUS_INDEX[view.customerStatus] ?? 0) : 0;
  const delivered =
    view.customerStatus === 'delivered' ||
    view.status === 'DELIVERED' ||
    view.status === 'COMPLETED';
  const cancelled =
    view.status === 'CANCELLED' || view.status === 'FAILED_CASH';
  return {
    id: view.id,
    items: view.lines.map((line) => ({
      name: line.name,
      quantity: line.quantity,
    })),
    total: view.totalCents / 100,
    placedAt: view.createdAt ? new Date(view.createdAt).getTime() : Date.now(),
    status: cancelled ? 'cancelled' : delivered ? 'completed' : 'active',
    stepIndex,
    eta: delivered ? {} : pickDeliveryEta(view),
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
  return 'Something went wrong';
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const [language, setLanguageState] = useState<Language>('en');
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [onboarded, setOnboarded] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(['pepperoni', 'yespiz-special']);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [notifications, setNotifications] =
    useState<AppNotification[]>(SAMPLE_NOTIFICATIONS);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);
  const [smsNotificationsEnabled, setSmsNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [localProfile, setLocalProfile] = useState<
    Partial<Pick<AppUser, 'firstName' | 'lastName' | 'email' | 'phone'>>
  >({});

  const persistToken = useCallback((token: string | null) => {
    setAccessToken(token);
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
  }, []);

  const refreshAddresses = useCallback(async (token?: string | null) => {
    const auth = token === undefined ? accessToken : token;
    if (!auth) {
      setAddresses([]);
      return;
    }
    const list = await ordersClient.listAddresses({ accessToken: auth });
    const mapped = list.map(mapAddress).filter((a) => a.id);
    setAddresses(mapped);
    setSelectedAddressId((prev) => {
      if (prev && mapped.some((a) => a.id === prev)) return prev;
      const preferred = list.find((a) => a.isDefault) ?? list[0];
      return preferred ? entityId(preferred) : '';
    });
  }, [accessToken]);

  const refreshOrders = useCallback(async (token?: string | null) => {
    const auth = token === undefined ? accessToken : token;
    if (!auth) {
      setOrders(SAMPLE_ORDERS);
      return;
    }
    const list = await ordersClient.list({ accessToken: auth });
    setOrders(list.map(mapCustomerOrder));
  }, [accessToken]);

  const applyAuth = useCallback(
    (token: string, profile: AppUser) => {
      persistToken(token);
      setUser(profile);
      setAuthError(null);
      void refreshAddresses(token).catch(() => setAddresses([]));
      void refreshOrders(token).catch(() => setOrders([]));
    },
    [persistToken, refreshAddresses, refreshOrders],
  );

  useEffect(() => {
    /* Intentional: hydrate UI state from localStorage after mount (SSR-safe). */
    let cancelled = false;

    async function hydrate() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        let storedProfile: Partial<
          Pick<AppUser, 'firstName' | 'lastName' | 'email' | 'phone'>
        > = {};
        if (raw) {
          const s = JSON.parse(raw) as Record<string, unknown>;
          if (s.mode === 'dark' || s.mode === 'light') setModeState(s.mode);
          if (s.language === 'en' || s.language === 'de') setLanguageState(s.language);
          if (typeof s.onboarded === 'boolean') setOnboarded(s.onboarded);
          if (Array.isArray(s.favorites)) setFavorites(s.favorites as string[]);
          if (typeof s.pushEnabled === 'boolean') setPushEnabled(s.pushEnabled);
          if (typeof s.emailNotificationsEnabled === 'boolean') {
            setEmailNotificationsEnabled(s.emailNotificationsEnabled);
          }
          if (typeof s.smsNotificationsEnabled === 'boolean') {
            setSmsNotificationsEnabled(s.smsNotificationsEnabled);
          }
          if (typeof s.locationEnabled === 'boolean') {
            setLocationEnabled(s.locationEnabled);
          }
          if (typeof s.selectedAddressId === 'string') {
            setSelectedAddressId(s.selectedAddressId);
          }
          if (typeof s.activeOrderId === 'string' || s.activeOrderId === null) {
            setActiveOrderId(s.activeOrderId as string | null);
          }
          if (s.localProfile && typeof s.localProfile === 'object') {
            storedProfile = s.localProfile as typeof storedProfile;
            setLocalProfile(storedProfile);
          }
        }

        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
          setAccessToken(token);
          try {
            const me = await accountClient.getMe({ accessToken: token });
            if (!cancelled) {
              setUser({ ...mapProfile(me), ...storedProfile });
              const [addrList, orderList] = await Promise.all([
                ordersClient.listAddresses({ accessToken: token }),
                ordersClient.list({ accessToken: token }),
              ]);
              if (cancelled) return;
              const mapped = addrList.map(mapAddress).filter((a) => a.id);
              setAddresses(mapped);
              setSelectedAddressId((prev) => {
                if (prev && mapped.some((a) => a.id === prev)) return prev;
                const preferred =
                  addrList.find((a) => a.isDefault) ?? addrList[0];
                return preferred ? entityId(preferred) : '';
              });
              setOrders(orderList.map(mapCustomerOrder));
            }
          } catch {
            if (!cancelled) {
              localStorage.removeItem(TOKEN_KEY);
              setAccessToken(null);
              setUser(null);
              setOrders(SAMPLE_ORDERS);
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
    document.documentElement.classList.toggle('dark', mode === 'dark');
    document.documentElement.classList.toggle('light', mode === 'light');
    document.documentElement.setAttribute('data-theme', mode);
  }, [hydrated, mode]);

  const setMode = useCallback((m: ThemeMode) => setModeState(m), []);
  const setLanguage = useCallback((l: Language) => setLanguageState(l), []);
  const t = useMemo(() => makeTranslator(language), [language]);
  const toggleMode = useCallback(
    () => setModeState((m) => (m === 'dark' ? 'light' : 'dark')),
    [],
  );

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const updateLocalUser = useCallback(
    (patch: Partial<Pick<AppUser, 'firstName' | 'lastName' | 'email' | 'phone'>>) => {
      setLocalProfile((current) => ({ ...current, ...patch }));
      setUser((current) => (current ? { ...current, ...patch } : current));
    },
    [],
  );

  const sendOtp = useCallback(async (phone: string) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await accountClient.sendOtp({ phone, role: CUSTOMER_ROLE, channel: 'sms' });
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

  const loginWithPassword = useCallback(
    async (email: string, password: string) => {
      setAuthLoading(true);
      setAuthError(null);
      try {
        const res = await accountClient.login({
          method: 'password',
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
    persistToken(null);
    setUser(null);
    setAddresses([]);
    setSelectedAddressId('');
    setOrders(SAMPLE_ORDERS);
    setActiveOrderId(null);
    setAuthError(null);
    setLocalProfile({});
  }, [persistToken]);

  const completeOnboarding = useCallback(() => setOnboarded(true), []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);
  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  const createAddress = useCallback(
    async (input: {
      label: string;
      street: string;
      city?: string;
      zipcode?: string;
    }) => {
      if (!accessToken) throw new Error('Not authenticated');
      const created = await ordersClient.createAddress(
        {
          label: input.label,
          street: input.street,
          city: input.city ?? 'Munich',
          zipcode: input.zipcode,
          country: 'DE',
          longitude: 11.5755,
          latitude: 48.1374,
          isDefault: addresses.length === 0,
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
          status: next === ORDER_STEPS.length - 1 ? 'completed' : 'active',
        };
      }),
    );
  }, [activeOrderId, accessToken]);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => n.unread).length,
    [notifications],
  );

  const colors = mode === 'dark' ? palettes.dark : palettes.light;
  const userName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.firstName
    : 'Guest';
  const userEmail = user?.email ?? user?.phone ?? '';

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
    sendOtp,
    loginWithOtp,
    loginWithPassword,
    register,
    logout,
    completeOnboarding,
    favorites,
    toggleFavorite,
    isFavorite,
    addresses,
    selectedAddressId,
    setSelectedAddressId,
    refreshAddresses,
    createAddress,
    orders,
    refreshOrders,
    addOrder,
    activeOrderId,
    setActiveOrderId,
    advanceActiveOrder,
    notifications,
    markAllRead,
    unreadCount,
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
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function useTheme() {
  return useApp().colors;
}
