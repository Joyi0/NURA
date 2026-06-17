import { notFound } from "next/navigation";
import { CartClient } from "@/components/storefront/CartClient";
import { dictionary, isLocale } from "@/lib/storefront/i18n";

type AddPayload = {
  id: string;
  sku: string;
  name: string;
  price: number;
  image: string | null;
};

export default async function CartPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ add?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = dictionary(locale);
  const query = await searchParams;
  const initialAdd = parseAddPayload(query.add);

  return (
    <div className="page">
      <div className="page-title">
        <h1>{t.cart.title}</h1>
        <p>{t.cart.helper}</p>
      </div>
      <CartClient copy={t.cart} initialAdd={initialAdd} />
    </div>
  );
}

function parseAddPayload(value?: string): AddPayload | null {
  if (!value) return null;
  try {
    const product = JSON.parse(value) as AddPayload;
    if (!product.id || !product.sku || !product.name || !Number.isFinite(Number(product.price))) return null;
    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      price: Math.round(Number(product.price)),
      image: product.image || null
    };
  } catch {
    return null;
  }
}
