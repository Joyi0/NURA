"use client";

import { useEffect, useMemo, useState } from "react";
import { CartItem, clearCart, getCart, saveCart } from "@/lib/storefront/cart";
import { assetUrl } from "@/lib/shared/catalog";

type CartCopy = {
  empty: string;
  name: string;
  email: string;
  countryCode: string;
  phone: string;
  emirate: string;
  cityArea: string;
  addressLine1: string;
  addressLine2: string;
  country: string;
  required: string;
  total: string;
  checkout: string;
  remove: string;
  success: string;
  failed: string;
};

const emirates = ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain"];

export function CartClient({ copy, initialAdd }: { copy: CartCopy; initialAdd?: Omit<CartItem, "quantity"> | null }) {
  const [items, setItems] = useState<CartItem[]>(() => (initialAdd ? [{ ...initialAdd, quantity: 1 }] : []));
  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [emirate, setEmirate] = useState("Dubai");
  const [cityArea, setCityArea] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [message, setMessage] = useState("");
  const total = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);
  const canSubmit = items.length > 0 && [customerName, email, phone, emirate, cityArea, addressLine1].every((value) => value.trim().length > 0);

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
    const requiredFields = [customerName, email, phone, emirate, cityArea, addressLine1];
    if (requiredFields.some((value) => value.trim().length === 0)) {
      setMessage(copy.required);
      return;
    }

    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        items,
        customerName,
        email,
        phone,
        phoneCountryCode: "+971",
        country: "United Arab Emirates",
        emirate,
        cityArea,
        addressLine1,
        addressLine2
      })
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
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div className="field">
            <label>{copy.countryCode}</label>
            <select value="+971" disabled>
              <option value="+971">+971 UAE</option>
            </select>
          </div>
          <div className="field">
            <label>{copy.phone}</label>
            <input inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </div>
          <div className="field">
            <label>{copy.country}</label>
            <input value="United Arab Emirates" disabled />
          </div>
          <div className="field">
            <label>{copy.emirate}</label>
            <select value={emirate} onChange={(event) => setEmirate(event.target.value)}>
              {emirates.map((item) => (
                <option value={item} key={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>{copy.cityArea}</label>
            <input value={cityArea} onChange={(event) => setCityArea(event.target.value)} />
          </div>
          <div className="field">
            <label>{copy.addressLine1}</label>
            <input value={addressLine1} onChange={(event) => setAddressLine1(event.target.value)} />
          </div>
          <div className="field">
            <label>{copy.addressLine2}</label>
            <input value={addressLine2} onChange={(event) => setAddressLine2(event.target.value)} />
          </div>
        </div>
        <div>
          <h2>
            {copy.total} AED {total.toLocaleString("en-US")}
          </h2>
          <button className="btn" disabled={!canSubmit} onClick={checkout}>
            {copy.checkout}
          </button>
          {message ? <p className="notice">{message}</p> : null}
        </div>
      </div>
    </div>
  );
}
