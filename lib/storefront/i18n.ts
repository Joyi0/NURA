import type { GemstoneType, ProductCategory, ProductColor } from "@prisma/client";

export type Locale = "en" | "ar";

export const locales: Locale[] = ["en", "ar"];

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function direction(locale: Locale) {
  return locale === "ar" ? "rtl" : "ltr";
}

export function otherLocale(locale: Locale) {
  return locale === "ar" ? "en" : "ar";
}

export function switchLocalePath(pathname: string, locale: Locale) {
  const parts = pathname.split("/");
  if (isLocale(parts[1] || "")) {
    parts[1] = locale;
    return parts.join("/") || `/${locale}`;
  }
  return `/${locale}${pathname === "/" ? "" : pathname}`;
}

export const dictionaries = {
  en: {
    nav: {
      all: "All Jewelry",
      necklace: "Necklaces",
      earring: "Earrings",
      bracelet: "Bracelets",
      ring: "Rings",
      set: "Sets",
      about: "About NURA",
      cart: "Cart",
      orderLookup: "Order Lookup"
    },
    home: {
      eyebrow: "Soft Luxury Jewelry",
      title: "NURA",
      intro:
        "Refined gold-tone jewelry for modern femininity, designed for everyday elegance and understated occasions.",
      brandStoryEyebrow: "About NURA",
      brandStoryTitle: "Built for women in the UAE, with transparency at every step.",
      brandStoryText:
        "Through Mariam Al Noor, a clearly disclosed fictional digital brand character, NURA tells a story of independence rooted in Fujairah and shaped for contemporary life in the UAE. Our approach centers on direct manufacturing relationships, honest gemstone identification, and a future commitment to licensed programs serving women and children.",
      brandStoryStats: ["Digital brand character", "Transparent gemstone information", "Future community commitment"],
      cta: "Explore New Arrivals",
      arrivalsTitle: "New Arrivals",
      arrivalsText: "Approved pieces are published automatically from the NURA product system.",
      viewAll: "View all"
    },
    banners: [
      {
        title: "Soft Luxury, Everyday",
        text: "Gold light, refined silhouettes, and jewelry that feels quietly elevated.",
        cta: "Shop the edit"
      },
      {
        title: "A Golden Point of View",
        text: "Warm white surfaces and gemstone details for polished daily styling.",
        cta: "Discover pieces"
      },
      {
        title: "Modern Middle Eastern Elegance",
        text: "Minimal jewelry styling shaped by soft light and confident femininity.",
        cta: "Explore jewelry"
      },
      {
        title: "Quiet Details",
        text: "Considered pieces for vanity rituals, gifting, and daily wear.",
        cta: "View jewelry"
      },
      {
        title: "Evening, Understated",
        text: "Refined shine for occasions that call for calm confidence.",
        cta: "Shop new arrivals"
      }
    ],
    products: {
      allTitle: "All Jewelry",
      helper: "Browse approved NURA pieces. Select a product to view images, details, and price.",
      empty: "No active products in this collection yet.",
      searchLabel: "Search products",
      searchPlaceholder: "Search name, SKU, material, collection...",
      searchButton: "Search",
      clearSearch: "Clear",
      searchResults: "{count} results for “{query}”",
      color: "Color",
      gemstone: "Gemstone",
      allColors: "All colors",
      allGemstones: "All gemstones",
      sku: "SKU",
      category: "Category",
      pricing: "Pricing Status",
      target: "Within target range",
      review: "Needs review",
      addToCart: "Add to Cart",
      addedToCart: "Added to cart",
      descriptionFallback:
        "A refined NURA jewelry piece selected for daily soft luxury, polished styling, and understated occasions."
    },
    cart: {
      title: "Cart",
      helper: "MVP checkout uses simulated payment and saves the order as paid_simulated.",
      empty: "Your cart is empty.",
      name: "Name",
      email: "Email",
      countryCode: "Country code",
      phone: "Phone",
      emirate: "Emirate",
      cityArea: "City / Area",
      addressLine1: "Address line",
      addressLine2: "Apartment / building (optional)",
      country: "Country",
      required: "Please fill in name, email, phone, and UAE delivery address.",
      total: "Total",
      checkout: "Simulated Payment",
      remove: "Remove",
      success: "Simulated payment successful. Order number:",
      failed: "Checkout failed"
    },
    orderLookup: {
      title: "Find Your Order",
      helper: "Enter the email or phone number used at checkout to view recent guest orders.",
      label: "Email or phone",
      placeholder: "name@email.com or +971...",
      submit: "Search Orders",
      empty: "No orders found for this contact.",
      itemCount: "Items",
      detail: "Details",
      orderedAt: "Ordered at"
    },
    footer: "Elegant jewelry for everyday soft luxury."
  },
  ar: {
    nav: {
      all: "كل المجوهرات",
      necklace: "عقود",
      earring: "أقراط",
      bracelet: "أساور",
      ring: "خواتم",
      set: "أطقم",
      about: "عن NURA",
      cart: "السلة",
      orderLookup: "تتبع الطلب"
    },
    home: {
      eyebrow: "مجوهرات فاخرة ناعمة",
      title: "NURA",
      intro: "مجوهرات بلون الذهب للمرأة العصرية، مصممة لأناقة يومية هادئة ومناسبات راقية.",
      brandStoryEyebrow: "عن NURA",
      brandStoryTitle: "علامة تُبنى للمرأة في الإمارات بشفافية في كل خطوة.",
      brandStoryText:
        "من خلال مريم النور، وهي شخصية رقمية خيالية موضحة بصدق، تروي NURA قصة استقلال تبدأ من الفجيرة وتواكب الحياة المعاصرة في الإمارات. يرتكز نهجنا على علاقات تصنيع مباشرة وتعريف واضح بالأحجار والتزام مستقبلي تجاه برامج مرخصة تخدم النساء والأطفال.",
      brandStoryStats: ["شخصية رقمية للعلامة", "معلومات شفافة عن الأحجار", "التزام مجتمعي مستقبلي"],
      cta: "اكتشفي الجديد",
      arrivalsTitle: "وصل حديثا",
      arrivalsText: "تظهر القطع المعتمدة تلقائيا من نظام منتجات NURA.",
      viewAll: "عرض الكل"
    },
    banners: [
      {
        title: "فخامة ناعمة كل يوم",
        text: "لمعة ذهبية وتصاميم رقيقة ومجوهرات تمنح الإطلالة حضورا هادئا.",
        cta: "تسوقي المجموعة"
      },
      {
        title: "لمسة ذهبية راقية",
        text: "أسطح دافئة وتفاصيل أحجار ناعمة لإطلالة يومية مصقولة.",
        cta: "اكتشفي القطع"
      },
      {
        title: "أناقة شرق أوسطية عصرية",
        text: "تنسيق مجوهرات بسيط بضوء ناعم وأنوثة واثقة.",
        cta: "استكشفي المجوهرات"
      },
      {
        title: "تفاصيل هادئة",
        text: "قطع مختارة للهدية والارتداء اليومي ولحظات العناية الخاصة.",
        cta: "عرض المجوهرات"
      },
      {
        title: "مساء راق وهادئ",
        text: "لمعة مصقولة للمناسبات التي تحتاج إلى ثقة ناعمة.",
        cta: "تسوقي الجديد"
      }
    ],
    products: {
      allTitle: "كل المجوهرات",
      helper: "تصفحي قطع NURA المعتمدة. اختاري المنتج لعرض الصور والتفاصيل والسعر.",
      empty: "لا توجد منتجات منشورة في هذه المجموعة حاليا.",
      searchLabel: "البحث في المنتجات",
      searchPlaceholder: "ابحثي بالاسم أو الرمز أو المادة أو المجموعة...",
      searchButton: "بحث",
      clearSearch: "مسح",
      searchResults: "{count} نتيجة عن \"{query}\"",
      color: "اللون",
      gemstone: "نوع الحجر",
      allColors: "كل الألوان",
      allGemstones: "كل الأحجار",
      sku: "رمز المنتج",
      category: "الفئة",
      pricing: "حالة التسعير",
      target: "ضمن النطاق المستهدف",
      review: "تحتاج إلى مراجعة",
      addToCart: "أضيفي إلى السلة",
      addedToCart: "تمت الإضافة إلى السلة",
      descriptionFallback: "قطعة مجوهرات راقية من NURA مختارة لأناقة يومية ناعمة ومناسبات هادئة."
    },
    cart: {
      title: "السلة",
      helper: "يستخدم الإصدار الأول دفعا تجريبيا ويحفظ الطلب بحالة paid_simulated.",
      empty: "السلة فارغة.",
      name: "الاسم",
      email: "البريد الإلكتروني",
      countryCode: "رمز الدولة",
      phone: "رقم الهاتف",
      emirate: "الإمارة",
      cityArea: "المدينة / المنطقة",
      addressLine1: "العنوان التفصيلي",
      addressLine2: "الشقة / المبنى (اختياري)",
      country: "الدولة",
      required: "يرجى تعبئة الاسم والبريد الإلكتروني ورقم الهاتف وعنوان التوصيل داخل الإمارات.",
      total: "الإجمالي",
      checkout: "دفع تجريبي",
      remove: "إزالة",
      success: "تم الدفع التجريبي بنجاح. رقم الطلب:",
      failed: "فشل إنشاء الطلب"
    },
    orderLookup: {
      title: "تتبع طلبك",
      helper: "أدخلي البريد الإلكتروني أو رقم الهاتف المستخدم عند الدفع لعرض طلبات الزائر.",
      label: "البريد الإلكتروني أو رقم الهاتف",
      placeholder: "name@email.com أو +971...",
      submit: "بحث عن الطلبات",
      empty: "لا توجد طلبات لهذا التواصل.",
      itemCount: "عدد القطع",
      detail: "التفاصيل",
      orderedAt: "تاريخ الطلب"
    },
    footer: "مجوهرات أنيقة لفخامة يومية ناعمة."
  }
} satisfies Record<Locale, Record<string, unknown>>;

export const categoryCopy: Record<Locale, Record<ProductCategory, { label: string; productName: string; description: string }>> = {
  en: {
    NECKLACE: {
      label: "Necklaces",
      productName: "NURA Gemstone Necklace",
      description: "A refined necklace selected for soft gold light, polished styling, and everyday elegance."
    },
    EARRING: {
      label: "Earrings",
      productName: "NURA Gemstone Earrings",
      description: "Elegant earrings selected for refined shine, balanced proportions, and modern femininity."
    },
    BRACELET: {
      label: "Bracelets",
      productName: "NURA Gold Bracelet",
      description: "A delicate bracelet designed to add a quiet gold accent to daily styling."
    },
    RING: {
      label: "Rings",
      productName: "NURA Gemstone Ring",
      description: "A polished ring with soft luxury presence for everyday and occasion wear."
    },
    SET: {
      label: "Sets",
      productName: "NURA Jewelry Set",
      description: "A coordinated jewelry set designed for considered gifting and polished occasion styling."
    }
  },
  ar: {
    NECKLACE: {
      label: "عقود",
      productName: "عقد NURA مرصع",
      description: "عقد راق مختار للمعة ذهبية ناعمة وتنسيق يومي أنيق."
    },
    EARRING: {
      label: "أقراط",
      productName: "أقراط NURA مرصعة",
      description: "أقراط أنيقة بلمعة مصقولة وتوازن رقيق لإطلالة عصرية."
    },
    BRACELET: {
      label: "أساور",
      productName: "سوار NURA ذهبي",
      description: "سوار ناعم يضيف لمسة ذهبية هادئة إلى الإطلالة اليومية."
    },
    RING: {
      label: "خواتم",
      productName: "خاتم NURA مرصع",
      description: "خاتم مصقول بحضور فاخر وهادئ للارتداء اليومي والمناسبات."
    },
    SET: {
      label: "أطقم",
      productName: "طقم مجوهرات NURA",
      description: "طقم مجوهرات متناسق للهدايا الراقية وإطلالات المناسبات المصقولة."
    }
  }
};

export function dictionary(locale: Locale) {
  return dictionaries[locale];
}

export function categoryLabel(category: ProductCategory, locale: Locale) {
  return categoryCopy[locale][category].label;
}

const colorLabels: Record<Locale, Record<ProductColor, string>> = {
  en: {
    YELLOW: "Yellow",
    RED: "Red",
    PINK: "Pink",
    BLUE: "Blue",
    GREEN: "Green",
    COLORLESS: "Colorless",
    UNKNOWN: "To be confirmed"
  },
  ar: {
    YELLOW: "أصفر",
    RED: "أحمر",
    PINK: "وردي",
    BLUE: "أزرق",
    GREEN: "أخضر",
    COLORLESS: "عديم اللون",
    UNKNOWN: "بانتظار التأكيد"
  }
};

const gemstoneLabels: Record<Locale, Record<GemstoneType, string>> = {
  en: {
    LAB_GROWN_DIAMOND: "Laboratory-grown diamond",
    MOISSANITE: "Moissanite",
    LAB_GROWN_COLORED_GEMSTONE: "Laboratory-grown colored gemstone",
    OTHER: "Other gemstone",
    UNKNOWN: "To be confirmed"
  },
  ar: {
    LAB_GROWN_DIAMOND: "ألماس مصنع مخبرياً",
    MOISSANITE: "مويسانايت",
    LAB_GROWN_COLORED_GEMSTONE: "حجر كريم ملون مصنع مخبرياً",
    OTHER: "حجر كريم آخر",
    UNKNOWN: "بانتظار التأكيد"
  }
};

export function productColorLabel(color: ProductColor, locale: Locale) {
  return colorLabels[locale][color];
}

export function gemstoneTypeLabel(type: GemstoneType, locale: Locale) {
  return gemstoneLabels[locale][type];
}

export function productDisplayName(product: { sourceCode: string | null; category: ProductCategory }, locale: Locale) {
  const base = categoryCopy[locale][product.category].productName;
  return product.sourceCode ? `${base} ${product.sourceCode}` : base;
}

export function productDescription(product: { category: ProductCategory }, locale: Locale) {
  return categoryCopy[locale][product.category].description;
}
