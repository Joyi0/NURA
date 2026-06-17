"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/nura-admin/dashboard", label: "数据仪表盘" },
  { href: "/nura-admin/products", label: "商品管理" },
  { href: "/nura-admin/orders", label: "订单履约" },
  { href: "/nura-admin/customers", label: "客户线索" }
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.replace("/nura-admin");
    router.refresh();
  }

  return (
    <nav className="admin-nav">
      {links.map((link) => (
        <Link className={pathname === link.href ? "active" : ""} href={link.href} key={link.href}>
          {link.label}
        </Link>
      ))}
      <button className="admin-nav-button" onClick={logout}>
        退出登录
      </button>
    </nav>
  );
}
