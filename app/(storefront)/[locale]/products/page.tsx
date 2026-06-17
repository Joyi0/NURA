import Link from "next/link";
import { notFound } from "next/navigation";
import { Prisma, ProductCategory } from "@prisma/client";
import { assetUrl, categories } from "@/lib/shared/catalog";
import { formatAed } from "@/lib/shared/money";
import { prisma } from "@/lib/shared/prisma";
import { localizedProductName, mainImage, productAedPrice } from "@/lib/shared/products";
import { categoryLabel, dictionary, isLocale } from "@/lib/storefront/i18n";

export default async function ProductsPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const query = await searchParams;
  const selected = categories.some((item) => item.value === query.category)
    ? (query.category as ProductCategory)
    : undefined;
  const searchText = String(query.q || "").trim();
  const t = dictionary(locale);
  const searchWhere: Prisma.ProductWhereInput | undefined = searchText
    ? {
        OR: [
          { name: { contains: searchText } },
          { titleEn: { contains: searchText } },
          { titleAr: { contains: searchText } },
          { sku: { contains: searchText } },
          { sourceCode: { contains: searchText } },
          { material: { contains: searchText } },
          { collectionName: { contains: searchText } },
          { tags: { contains: searchText } }
        ]
      }
    : undefined;

  const products = await prisma.product.findMany({
    where: { status: "ACTIVE", ...(selected ? { category: selected } : {}), ...(searchWhere || {}) },
    include: { images: true },
    orderBy: { createdAt: "desc" }
  });

  function productsHref(category?: ProductCategory) {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (searchText) params.set("q", searchText);
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

      <form className="search-form" action={`/${locale}/products`}>
        {selected ? <input type="hidden" name="category" value={selected} /> : null}
        <div className="field">
          <label>{t.products.searchLabel}</label>
          <input name="q" defaultValue={searchText} placeholder={t.products.searchPlaceholder} dir={locale === "ar" ? "rtl" : "ltr"} />
        </div>
        <button className="btn secondary" type="submit">
          {t.products.searchButton}
        </button>
        {searchText ? (
          <Link className="btn secondary" href={selected ? `/${locale}/products?category=${selected}` : `/${locale}/products`}>
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
