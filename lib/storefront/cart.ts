"use client";

export type CartItem = {
  id: string;
  sku: string;
  name: string;
  price: number;
  image: string | null;
  quantity: number;
};

const key = "nura-cart";

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  const fromStorage = readStorage();
  if (fromStorage) return fromStorage;
  const fromCookie = readCookie();
  if (fromCookie) return fromCookie;
  return [];
}

export function saveCart(items: CartItem[]) {
  const value = JSON.stringify(items);
  try {
    window.localStorage?.setItem(key, value);
  } catch {
    // Some embedded browsers disable localStorage; cookies keep the cart usable.
  }
  document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=2592000; samesite=lax`;
}

export function addToCart(product: Omit<CartItem, "quantity">) {
  const items = getCart();
  const existing = items.find((item) => item.id === product.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    items.push({ ...product, quantity: 1 });
  }
  saveCart(items);
}

export function clearCart() {
  try {
    window.localStorage?.removeItem(key);
  } catch {
    // Ignore storage failures; cookie cleanup below is enough for fallback browsers.
  }
  document.cookie = `${key}=; path=/; max-age=0; samesite=lax`;
}

function readStorage() {
  try {
    const value = window.localStorage?.getItem(key);
    if (!value) return null;
    return JSON.parse(value) as CartItem[];
  } catch {
    return null;
  }
}

function readCookie() {
  try {
    const pair = document.cookie
      .split("; ")
      .find((item) => item.startsWith(`${key}=`));
    if (!pair) return null;
    return JSON.parse(decodeURIComponent(pair.slice(key.length + 1))) as CartItem[];
  } catch {
    return null;
  }
}
