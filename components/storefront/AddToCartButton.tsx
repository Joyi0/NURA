"use client";

import { useState } from "react";
import { addToCart } from "@/lib/storefront/cart";

export function AddToCartButton({
  label,
  addedLabel,
  cartHref,
  product
}: {
  label: string;
  addedLabel: string;
  cartHref: string;
  product: { id: string; sku: string; name: string; price: number; image: string | null };
}) {
  const [added, setAdded] = useState(false);
  const href = `${cartHref}?add=${encodeURIComponent(JSON.stringify(product))}`;

  return (
    <div className="add-cart-stack">
      <a
        className="btn"
        href={href}
        onClick={() => {
          addToCart(product);
          setAdded(true);
          window.dispatchEvent(new CustomEvent("nura-cart-updated"));
          window.setTimeout(() => setAdded(false), 2200);
        }}
      >
        {label}
      </a>
      {added ? <span className="cart-feedback">{addedLabel}</span> : null}
    </div>
  );
}
