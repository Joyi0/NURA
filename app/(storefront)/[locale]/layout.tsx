import { notFound } from "next/navigation";
import { DocumentLocale } from "@/components/storefront/DocumentLocale";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";
import { direction, isLocale, locales } from "@/lib/storefront/i18n";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function StorefrontLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div lang={locale} dir={direction(locale)}>
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.lang=${JSON.stringify(locale)};document.documentElement.dir=${JSON.stringify(direction(locale))};`
        }}
      />
      <DocumentLocale locale={locale} />
      <StorefrontShell locale={locale}>{children}</StorefrontShell>
    </div>
  );
}
