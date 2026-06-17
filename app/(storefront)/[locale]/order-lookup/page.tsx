import { notFound } from "next/navigation";
import { OrderLookupClient } from "@/components/storefront/OrderLookupClient";
import { dictionary, isLocale } from "@/lib/storefront/i18n";

export default async function OrderLookupPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = dictionary(locale);

  return (
    <div className="page">
      <div className="page-title">
        <h1>{t.orderLookup.title}</h1>
        <p>{t.orderLookup.helper}</p>
      </div>
      <OrderLookupClient copy={t.orderLookup} />
    </div>
  );
}
