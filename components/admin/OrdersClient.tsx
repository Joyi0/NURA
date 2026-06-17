"use client";

import { FormEvent, useEffect, useState } from "react";

const statuses = [
  ["", "全部状态"],
  ["PENDING_SHIPMENT", "待发货"],
  ["SHIPPED", "已发货"],
  ["COMPLETED", "已完成"],
  ["AFTER_SALES", "售后"]
];

type Order = {
  id: string;
  orderNumber: string;
  customerName: string | null;
  email: string | null;
  phone: string | null;
  shippingAddress: string | null;
  internalNote: string | null;
  fulfillmentStatus: string;
  fulfillmentLabel: string;
  totalLabel: string;
  createdAt: string;
  items: Array<{ name: string; sku: string; quantity: number; priceLabel: string }>;
};

export function OrdersClient({ initialOrders = [] }: { initialOrders?: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setMessage("");
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    const response = await fetch(`/api/admin/orders?${params.toString()}`);
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || "读取失败");
      return;
    }
    setOrders(data.orders);
  }

  function search(event: FormEvent) {
    event.preventDefault();
    void load();
  }

  async function update(order: Order, patch: Partial<Pick<Order, "fulfillmentStatus" | "internalNote" | "shippingAddress">>) {
    const response = await fetch(`/api/admin/orders/${order.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch)
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || "更新失败");
      return;
    }
    await load();
  }

  return (
    <div className="dashboard-stack">
      <form className="admin-filter-row" onSubmit={search}>
        <div className="field">
          <label>订单号 / 邮箱 / 手机号</label>
          <input value={q} onChange={(event) => setQ(event.target.value)} />
        </div>
        <div className="field">
          <label>状态</label>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            {statuses.map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <button className="btn secondary" type="submit">
          检索订单
        </button>
      </form>

      {message ? <p className="notice">{message}</p> : null}

      <div className="table-wrap admin-panel">
        <table className="admin-table">
          <thead>
            <tr>
              <th>订单</th>
              <th>客户</th>
              <th>商品</th>
              <th>金额</th>
              <th>状态</th>
              <th>备注 / 地址</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>
                  <strong>{order.orderNumber}</strong>
                  <p className="muted">{new Date(order.createdAt).toLocaleString("zh-CN")}</p>
                </td>
                <td>
                  <div>{order.customerName || "游客"}</div>
                  <div className="muted">{order.email || "-"}</div>
                  <div className="muted">{order.phone || "-"}</div>
                </td>
                <td>
                  {order.items.map((item) => (
                    <div key={`${order.id}-${item.sku}`}>
                      {item.name} x {item.quantity}
                      <p className="muted">{item.sku}</p>
                    </div>
                  ))}
                </td>
                <td>{order.totalLabel}</td>
                <td>
                  <select value={order.fulfillmentStatus} onChange={(event) => update(order, { fulfillmentStatus: event.target.value })}>
                    {statuses.slice(1).map(([value, label]) => (
                      <option value={value} key={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <textarea defaultValue={order.internalNote || ""} placeholder="内部备注" onBlur={(event) => update(order, { internalNote: event.target.value })} />
                  <textarea defaultValue={order.shippingAddress || ""} placeholder="地址预留" onBlur={(event) => update(order, { shippingAddress: event.target.value })} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 ? <p className="muted">暂无订单。</p> : null}
      </div>
    </div>
  );
}
