"use client";

import { useEffect, useMemo, useState } from "react";
import { CartItem, clearCart, getCart, saveCart } from "@/lib/storefront/cart";
import { assetUrl } from "@/lib/shared/catalog";

type CartCopy = {
  empty: string;
  name: string;
  email: string;
  phone: string;
  total: string;
  checkout: string;
  remove: string;
  success: string;
  failed: string;
};

export function CartClient({ copy, initialAdd }: { copy: CartCopy; initialAdd?: Omit<CartItem, "quantity"> | null }) {
  const [items, setItems] = useState<CartItem[]>(() => (initialAdd ? [{ ...initialAdd, quantity: 1 }] : []));
  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const total = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);

  useEffect(() => {
    const current = getCart();
    if (!initialAdd) {
      setItems(current);
      return;
    }

    const exists = current.some((item) => item.id === initialAdd.id);
    const next = exists ? current : [{ ...initialAdd, quantity: 1 }, ...current];
    setItems(next);
    saveCart(next);
    window.dispatchEvent(new CustomEvent("nura-cart-updated"));
  }, [initialAdd]);

  function update(next: CartItem[]) {
    setItems(next);
    saveCart(next);
  }

  async function checkout() {
    setMessage("");
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ items, customerName, email, phone })
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || copy.failed);
      return;
    }
    clearCart();
    setItems([]);
    setMessage(`${copy.success} ${data.orderNumber}`);
  }

  return (
    <div className="cart-panel">
      <div className="cart-list">
        {items.map((item) => (
          <div className="cart-row" key={item.id}>
            <img src={assetUrl(item.image)} alt={item.name} />
            <div>
              <strong>{item.name}</strong>
              <p className="muted">{item.sku}</p>
              <div className="price">AED {item.price.toLocaleString("en-US")}</div>
            </div>
            <div className="qty">
              <button onClick={() => update(items.map((p) => (p.id === item.id ? { ...p, quantity: Math.max(1, p.quantity - 1) } : p)))}>-</button>
              <span>{item.quantity}</span>
              <button onClick={() => update(items.map((p) => (p.id === item.id ? { ...p, quantity: p.quantity + 1 } : p)))}>+</button>
              <button className="btn secondary" onClick={() => update(items.filter((p) => p.id !== item.id))}>
                {copy.remove}
              </button>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && !message ? <p className="notice">{copy.empty}</p> : null}

      <div className="admin-grid" style={{ marginTop: 24 }}>
        <div className="form-grid">
          <div className="field">
            <label>{copy.name}</label>
            <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
          </div>
          <div className="field">
              <label>{copy.email}</label>
              <input value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
          <div className="field">
            <label>{copy.phone}</label>
            <input value={phone} onChange={(event) => setPhone(event.target.value)} />
          </div>
        </div>
        <div>
          <h2>
            {copy.total} AED {total.toLocaleString("en-US")}
          </h2>
          <button className="btn" disabled={items.length === 0} onClick={checkout}>
            {copy.checkout}
          </button>
          {message ? <p className="notice">{message}</p> : null}
        </div>
      </div>
    </div>
  );
}
