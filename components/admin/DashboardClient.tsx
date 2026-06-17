"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { readAdminPassword, rememberAdminPassword } from "@/lib/admin/password-cache";
import { assetUrl } from "@/lib/shared/catalog";

type DashboardData = {
  currency: string;
  metrics: {
    totalSales: string;
    validOrders: number;
    averageOrderValue: string;
    pendingShipment: number;
    afterSales: number;
    lowStock: number;
  };
  trend: Array<{ date: string; sales: number; orders: number }>;
  topProducts: Array<{ productId: string; name: string; image: string | null; sales: number; quantity: number; salesLabel: string }>;
};

export function DashboardClient() {
  const [password, setPassword] = useState("");
  const [data, setData] = useState<DashboardData | null>(null);
  const [message, setMessage] = useState("");
  const [view, setView] = useState<"day" | "week">("day");

  useEffect(() => {
    const saved = readAdminPassword();
    if (saved) {
      setPassword(saved);
      void load(saved);
    }
  }, []);

  async function load(nextPassword = password) {
    if (!nextPassword) return;
    setMessage("");
    const response = await fetch("/api/admin/dashboard", { headers: { "x-admin-password": nextPassword } });
    const next = await response.json();
    if (!response.ok) {
      setMessage(next.error || "读取失败");
      return;
    }
    rememberAdminPassword(nextPassword);
    setData(next);
  }

  function login(event: FormEvent) {
    event.preventDefault();
    void load();
  }

  const points = useMemo(() => {
    if (!data?.trend.length) return "";
    const max = Math.max(...data.trend.map((item) => (view === "day" ? item.sales : item.orders)), 1);
    return data.trend
      .map((item, index) => {
        const value = view === "day" ? item.sales : item.orders;
        const x = data.trend.length === 1 ? 280 : (index / (data.trend.length - 1)) * 560 + 20;
        const y = 150 - (value / max) * 120 + 20;
        return `${x},${y}`;
      })
      .join(" ");
  }, [data, view]);

  return (
    <div className="dashboard-stack">
      <form className="admin-login-row" onSubmit={login}>
        <div className="field">
          <label>管理员密码</label>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </div>
        <button className="btn secondary" type="submit">
          读取数据
        </button>
      </form>

      {message ? <p className="notice">{message}</p> : null}

      {data ? (
        <>
          <div className="metric-grid">
            <Metric label="总销售额" value={data.metrics.totalSales} />
            <Metric label="有效订单数" value={String(data.metrics.validOrders)} />
            <Metric label="平均客单价" value={data.metrics.averageOrderValue} />
            <Metric label="待发货订单" value={String(data.metrics.pendingShipment)} />
            <Metric label="待处理售后" value={String(data.metrics.afterSales)} />
            <Metric label="库存预警款" value={String(data.metrics.lowStock)} />
          </div>

          <section className="admin-panel">
            <div className="section-head">
              <div>
                <h2>7 日趋势</h2>
                <p>{view === "day" ? "销售额走势" : "订单量走势"}</p>
              </div>
              <div className="segmented">
                <button className={view === "day" ? "active" : ""} onClick={() => setView("day")} type="button">
                  日
                </button>
                <button className={view === "week" ? "active" : ""} onClick={() => setView("week")} type="button">
                  周
                </button>
              </div>
            </div>
            <svg className="trend-chart" viewBox="0 0 600 190" role="img" aria-label="7 day business trend">
              <defs>
                <linearGradient id="goldLine" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#d4af37" />
                  <stop offset="100%" stopColor="#f0d88a" />
                </linearGradient>
              </defs>
              <polyline points={points} fill="none" stroke="url(#goldLine)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </section>

          <section className="admin-panel">
            <div className="section-head">
              <div>
                <h2>热销 Top3</h2>
                <p>按销售额排序</p>
              </div>
            </div>
            <div className="top-list">
              {data.topProducts.map((product) => (
                <div className="top-row" key={product.productId}>
                  <img className="thumb" src={assetUrl(product.image)} alt={product.name} />
                  <div>
                    <strong>{product.name}</strong>
                    <p className="muted">销量 {product.quantity}</p>
                  </div>
                  <strong>{product.salesLabel}</strong>
                </div>
              ))}
              {data.topProducts.length === 0 ? <p className="muted">暂无销售数据。</p> : null}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <section className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </section>
  );
}
