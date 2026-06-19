import Link from "next/link";
import { notFound } from "next/navigation";
import { GemstoneType, Prisma, ProductCategory, ProductColor } from "@prisma/client";
import { assetUrl, categories, gemstoneTypes, productColors } from "@/lib/shared/catalog";
import { formatAed } from "@/lib/shared/money";
import { prisma } from "@/lib/shared/prisma";
import { localizedProductName, mainImage, productAedPrice } from "@/lib/shared/products";
import { categoryLabel, dictionary, gemstoneTypeLabel, isLocale, productColorLabel } from "@/lib/storefront/i18n";

export default async function ProductsPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string; color?: string; gemstone?: string; q?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const query = await searchParams;
  const selected = categories.some((item) => item.value === query.category)
    ? (query.category as ProductCategory)
    : undefined;
  const searchText = String(query.q || "").trim();
  const selectedColor = Object.values(ProductColor).includes(query.color as ProductColor) ? (query.color as ProductColor) : undefined;
  const selectedGemstone = Object.values(GemstoneType).includes(query.gemstone as GemstoneType)
    ? (query.gemstone as GemstoneType)
    : undefined;
  const t = dictionary(locale);
  const searchWhere: Prisma.ProductWhereInput | undefined = searchText
    ? {
        OR: [
          { name: { contains: searchText } },
          { titleEn: { contains: searchText } },
          { titleAr: { contains: searchText } },
          { sku: { contains: searchText } },
          { sourceCode: { contains: searchText } },
          { legacyCode: { contains: searchText } },
          { material: { contains: searchText } },
          { collectionName: { contains: searchText } },
          { tags: { contains: searchText } }
        ]
      }
    : undefined;

  const products = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      ...(selected ? { category: selected } : {}),
      ...(selectedColor ? { color: selectedColor } : {}),
      ...(selectedGemstone ? { gemstoneType: selectedGemstone } : {}),
      ...(searchWhere || {})
    },
    include: { images: true },
    orderBy: { createdAt: "desc" }
  });

  function productsHref(category?: ProductCategory) {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (selectedColor) params.set("color", selectedColor);
    if (selectedGemstone) params.set("gemstone", selectedGemstone);
    if (searchText) params.set("q", searchText);
    const suffix = params.toString();
    return `/${locale}/products${suffix ? `?${suffix}` : ""}`;
  }

  function filterHref(overrides: { color?: ProductColor; gemstone?: GemstoneType; query?: string }) {
    const params = new URLSearchParams();
    if (selected) params.set("category", selected);
    const color = "color" in overrides ? overrides.color : selectedColor;
    const gemstone = "gemstone" in overrides ? overrides.gemstone : selectedGemstone;
    const queryText = "query" in overrides ? overrides.query : searchText;
    if (color) params.set("color", color);
    if (gemstone) params.set("gemstone", gemstone);
    if (queryText) params.set("q", queryText);
    const suffix = params.toString();
    return `/${locale}/products${suffix ? `?${suffix}` : ""}`;
  }

  return (
    <div className="page">
      <div className="page-title">
        <h1>{selected ? categoryLabel(selected, locale) : t.products.allTitle}</h1>
        <p>{t.products.helper}</p>
      </div>

      <div className="filters">
        <Link className={`pill ${!selected ? "active" : ""}`} href={productsHref()}>
          {t.nav.all}
        </Link>
        {categories.map((category) => (
          <Link
            className={`pill ${selected === category.value ? "active" : ""}`}
            href={productsHref(category.value)}
            key={category.value}
          >
            {categoryLabel(category.value, locale)}
          </Link>
        ))}
      </div>

      <div className="filters secondary-filters">
        <Link className={`pill ${!selectedColor ? "active" : ""}`} href={filterHref({ color: undefined })}>
          {t.products.allColors}
        </Link>
        {productColors.filter((color) => color.value !== "UNKNOWN").map((color) => (
          <Link className={`pill ${selectedColor === color.value ? "active" : ""}`} href={filterHref({ color: color.value })} key={color.value}>
            {productColorLabel(color.value, locale)}
          </Link>
        ))}
      </div>

      <div className="filters secondary-filters">
        <Link className={`pill ${!selectedGemstone ? "active" : ""}`} href={filterHref({ gemstone: undefined })}>
          {t.products.allGemstones}
        </Link>
        {gemstoneTypes.filter((type) => type.value !== "UNKNOWN").map((type) => (
          <Link
            className={`pill ${selectedGemstone === type.value ? "active" : ""}`}
            href={filterHref({ gemstone: type.value })}
            key={type.value}
          >
            {gemstoneTypeLabel(type.value, locale)}
          </Link>
        ))}
      </div>

      <form className="search-form" action={`/${locale}/products`}>
        {selected ? <input type="hidden" name="category" value={selected} /> : null}
        {selectedColor ? <input type="hidden" name="color" value={selectedColor} /> : null}
        {selectedGemstone ? <input type="hidden" name="gemstone" value={selectedGemstone} /> : null}
        <div className="field">
          <label>{t.products.searchLabel}</label>
          <input name="q" defaultValue={searchText} placeholder={t.products.searchPlaceholder} dir={locale === "ar" ? "rtl" : "ltr"} />
        </div>
        <button className="btn secondary" type="submit">
          {t.products.searchButton}
        </button>
        {searchText ? (
          <Link className="btn secondary" href={filterHref({ query: undefined })}>
            {t.products.clearSearch}
          </Link>
        ) : null}
      </form>

      {searchText ? <p className="muted">{t.products.searchResults.replace("{count}", String(products.length)).replace("{query}", searchText)}</p> : null}

      <div className="product-grid">
        {products.map((product) => (
          <Link className="product-card" href={`/${locale}/products/${product.id}`} key={product.id}>
            <img src={assetUrl(mainImage(product))} alt={localizedProductName(product, locale)} />
            <div className="product-card-body">
              <h3>{localizedProductName(product, locale)}</h3>
              <div className="price">{formatAed(productAedPrice(product))}</div>
            </div>
          </Link>
        ))}
      </div>

      {products.length === 0 ? <p className="notice">{t.products.empty}</p> : null}
    </div>
  );
}
