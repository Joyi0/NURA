"use client";

import { FormEvent, useEffect, useState } from "react";

type Customer = {
  key: string;
  email: string | null;
  phone: string | null;
  orderCount: number;
  totalSpend: string;
  lastOrderAt: string;
  preferredCategory: string;
  tags: string[];
};

export function CustomersClient() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setMessage("");
    const response = await fetch("/api/admin/customers");
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || "读取失败");
      return;
    }
    setCustomers(data.customers);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void load();
  }

  return (
    <div className="dashboard-stack">
      <form className="admin-login-row" onSubmit={submit}>
        <button className="btn secondary" type="submit">
          读取客户
        </button>
      </form>
      {message ? <p className="notice">{message}</p> : null}
      <div className="table-wrap admin-panel">
        <table className="admin-table">
          <thead>
            <tr>
              <th>联系方式</th>
              <th>最近下单</th>
              <th>历史订单数</th>
              <th>累计消费</th>
              <th>偏好品类</th>
              <th>标签</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.key}>
                <td>
                  <div>{customer.email || "-"}</div>
                  <div className="muted">{customer.phone || "-"}</div>
                </td>
                <td>{new Date(customer.lastOrderAt).toLocaleString("zh-CN")}</td>
                <td>{customer.orderCount}</td>
                <td>{customer.totalSpend}</td>
                <td>{customer.preferredCategory}</td>
                <td>{customer.tags.join(" / ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {customers.length === 0 ? <p className="muted">暂无客户线索。</p> : null}
      </div>
    </div>
  );
}
