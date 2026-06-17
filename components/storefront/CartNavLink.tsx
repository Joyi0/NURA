"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCart } from "@/lib/storefront/cart";

export function CartNavLink({ href, label }: { href: string; label: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function sync() {
      setCount(getCart().reduce((sum, item) => sum + item.quantity, 0));
    }
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("nura-cart-updated", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("nura-cart-updated", sync);
    };
  }, []);

  return (
    <Link href={href}>
      {label}
      {count > 0 ? <span className="cart-count">{count}</span> : null}
    </Link>
  );
}
