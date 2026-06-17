"use client";

import { FormEvent, useState } from "react";

type OrderLookupCopy = {
  label: string;
  placeholder: string;
  submit: string;
  empty: string;
  itemCount: string;
  detail: string;
  orderedAt: string;
};

type LookupOrder = {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  fulfillmentStatus: string;
  totalFormatted: string;
  itemCount: number;
  email: string;
  phone: string;
  items: Array<{ sku: string; name: string; priceFormatted: string; quantity: number }>;
};

export function OrderLookupClient({ copy }: { copy: OrderLookupCopy }) {
  const [contact, setContact] = useState("");
  const [orders, setOrders] = useState<LookupOrder[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  async function search(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    const response = await fetch("/api/order-lookup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contact })
    });
    const data = await response.json();
    setOrders(response.ok ? data.orders : []);
    setSearched(true);
    setLoading(false);
  }

  return (
    <div className="cart-panel">
      <form className="lookup-form" onSubmit={search}>
        <div className="field">
          <label>{copy.label}</label>
          <input value={contact} onChange={(event) => setContact(event.target.value)} placeholder={copy.placeholder} required />
        </div>
        <button className="btn" type="submit" disabled={loading}>
          {loading ? "..." : copy.submit}
        </button>
      </form>

      <div className="order-lookup-list">
        {orders.map((order) => (
          <details className="order-card" key={order.id}>
            <summary>
              <span>
                <strong>{order.orderNumber}</strong>
                <small>{copy.orderedAt}: {new Date(order.createdAt).toLocaleDateString()}</small>
              </span>
              <span>{order.totalFormatted}</span>
              <span>{order.fulfillmentStatus}</span>
              <span>{copy.itemCount}: {order.itemCount}</span>
            </summary>
            <div className="order-card-body">
              <p className="muted">{order.email || order.phone}</p>
              <h3>{copy.detail}</h3>
              {order.items.map((item) => (
                <div className="order-line" key={`${order.id}-${item.sku}`}>
                  <span>{item.name}</span>
                  <span>{item.sku}</span>
                  <span>{item.priceFormatted} × {item.quantity}</span>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>

      {searched && orders.length === 0 ? <p className="notice">{copy.empty}</p> : null}
    </div>
  );
}
