"use client";

import { useEffect } from "react";
import type { Locale } from "@/lib/storefront/i18n";
import { direction } from "@/lib/storefront/i18n";

export function DocumentLocale({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = direction(locale);
  }, [locale]);

  return null;
}
