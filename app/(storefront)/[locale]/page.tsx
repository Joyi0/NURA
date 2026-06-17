import Link from "next/link";
import { HeroCarousel } from "@/components/storefront/HeroCarousel";
import { categories } from "@/lib/shared/catalog";
import { prisma } from "@/lib/shared/prisma";
import { formatAed } from "@/lib/shared/money";
import { localizedProductName, mainImage, productAedPrice } from "@/lib/shared/products";
import { homeBanners } from "@/lib/storefront/home";
import { categoryLabel, dictionary, isLocale } from "@/lib/storefront/i18n";
import { assetUrl } from "@/lib/shared/catalog";
import { notFound } from "next/navigation";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const t = dictionary(locale);
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    include: { images: true },
    orderBy: { createdAt: "desc" },
    take: 8
  });

  return (
    <>
      <HeroCarousel banners={homeBanners(locale)} productsHref={`/${locale}/products`} />

      <section className="section intro-band">
        <div>
          <span className="eyebrow">{t.home.eyebrow}</span>
          <h1>{t.home.title}</h1>
        </div>
        <p>{t.home.intro}</p>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <h2>{t.home.collectionsTitle}</h2>
            <p>{t.home.collectionsText}</p>
          </div>
        </div>
        <div className="category-grid">
          {categories.map((category) => (
            <Link className="category-tile" href={`/${locale}/products?category=${category.value}`} key={category.value}>
              <strong>{categoryLabel(category.value, locale)}</strong>
              <span>{category.code}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <h2>{t.home.arrivalsTitle}</h2>
            <p>{t.home.arrivalsText}</p>
          </div>
          <Link className="pill" href={`/${locale}/products`}>
            {t.home.viewAll}
          </Link>
        </div>
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
      </section>
    </>
  );
}
