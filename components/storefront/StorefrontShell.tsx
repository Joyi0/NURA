import Link from "next/link";
import { categories } from "@/lib/shared/catalog";
import { categoryLabel, dictionary, Locale } from "@/lib/storefront/i18n";
import { CartNavLink } from "./CartNavLink";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function StorefrontShell({ children, locale }: { children: React.ReactNode; locale: Locale }) {
  const t = dictionary(locale);

  return (
    <div className="storefront-shell">
      <header className="site-header">
        <Link href={`/${locale}`} className="brand" aria-label="NURA home">
          <img src="/api/assets?path=image%2Flogo%2Flogo.png" alt="NURA" />
        </Link>
        <nav className="nav">
          <Link href={`/${locale}/products`}>{t.nav.all}</Link>
          {categories.map((category) => (
            <Link href={`/${locale}/products?category=${category.value}`} key={category.value}>
              {categoryLabel(category.value, locale)}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <Link href={`/${locale}/order-lookup`}>{t.nav.orderLookup}</Link>
          <CartNavLink href={`/${locale}/cart`} label={t.nav.cart} />
          <LanguageSwitcher locale={locale} />
        </div>
      </header>
      <main>{children}</main>
      <footer className="footer">
        <span>NURA</span>
        <span>{t.footer}</span>
      </footer>
    </div>
  );
}
