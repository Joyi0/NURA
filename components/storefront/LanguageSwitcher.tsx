"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Locale, switchLocalePath } from "@/lib/storefront/i18n";

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  return (
    <div className="language-switcher" aria-label="Language switcher">
      <Link className={locale === "en" ? "active" : ""} href={switchLocalePath(pathname, "en")}>
        EN
      </Link>
      <span>/</span>
      <Link className={locale === "ar" ? "active" : ""} href={switchLocalePath(pathname, "ar")}>
        AR
      </Link>
    </div>
  );
}
