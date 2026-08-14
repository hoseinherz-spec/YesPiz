'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import { EXTRAS, SIZES } from '@/constants/pizzas';

export type CartItem = {
  lineId: string;
  menuItemId: string;
  menuVersion: number;
  name: string;
  size: 'small' | 'medium' | 'large';
  extras: string[];
  quantity: number;
  unitPrice: number;
  image: string;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'lineId'>) => void;
  removeItem: (lineId: string) => void;
  updateQty: (lineId: string, delta: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  promoApplied: boolean;
  applyPromo: () => void;
  /** Menu version shared by cart lines (0 when empty / offline static). */
  menuVersion: number;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

const newId = () => Date.now().toString() + Math.random().toString(36).slice(2, 11);

export function priceFor(base: number, size: CartItem['size'], extras: string[]) {
  const sizeDelta = SIZES.find((s) => s.id === size)?.delta ?? 0;
  const extrasTotal = extras.reduce(
    (sum, id) => sum + (EXTRAS.find((e) => e.id === id)?.price ?? 0),
    0,
  );
  return base + sizeDelta + extrasTotal;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [promoApplied, setPromoApplied] = useState(false);

  const addItem = useCallback((item: Omit<CartItem, 'lineId'>) => {
    setItems((prev) => {
      const match = prev.find(
        (p) =>
          p.menuItemId === item.menuItemId &&
          p.size === item.size &&
          p.extras.slice().sort().join() === item.extras.slice().sort().join(),
      );
      if (match) {
        return prev.map((p) =>
          p.lineId === match.lineId
            ? { ...p, quantity: p.quantity + item.quantity }
            : p,
        );
      }
      return [...prev, { ...item, lineId: newId() }];
    });
  }, []);

  const removeItem = useCallback((lineId: string) => {
    setItems((prev) => prev.filter((p) => p.lineId !== lineId));
  }, []);

  const updateQty = useCallback((lineId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((p) =>
          p.lineId === lineId ? { ...p, quantity: p.quantity + delta } : p,
        )
        .filter((p) => p.quantity > 0),
    );
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    setPromoApplied(false);
  }, []);

  const applyPromo = useCallback(() => setPromoApplied(true), []);

  const subtotal = useMemo(
    () => items.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0),
    [items],
  );
  const count = useMemo(
    () => items.reduce((sum, p) => sum + p.quantity, 0),
    [items],
  );
  const discount = useMemo(
    () => (promoApplied ? Math.round(subtotal * 0.3 * 100) / 100 : 0),
    [promoApplied, subtotal],
  );
  const deliveryFee = 0;
  const total = Math.max(0, subtotal - discount) + deliveryFee;
  const menuVersion = items[0]?.menuVersion ?? 0;

  const value: CartContextValue = {
    items,
    addItem,
    removeItem,
    updateQty,
    clear,
    count,
    subtotal,
    deliveryFee,
    discount,
    total,
    promoApplied,
    applyPromo,
    menuVersion,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
