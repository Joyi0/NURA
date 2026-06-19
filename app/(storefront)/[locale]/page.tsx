import Link from "next/link";
import { HeroCarousel } from "@/components/storefront/HeroCarousel";
import { prisma } from "@/lib/shared/prisma";
import { formatAed } from "@/lib/shared/money";
import { localizedProductName, mainImage, productAedPrice } from "@/lib/shared/products";
import { brandStoryImages, homeBanners } from "@/lib/storefront/home";
import { dictionary, isLocale } from "@/lib/storefront/i18n";
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

      <section className="section brand-story">
        <div className="brand-story-copy">
          <span className="eyebrow">{t.home.brandStoryEyebrow}</span>
          <h2>{t.home.brandStoryTitle}</h2>
          <p>{t.home.brandStoryText}</p>
          <div className="brand-story-points">
            {t.home.brandStoryStats.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <Link className="btn secondary" href={`/${locale}/about`}>
            {t.nav.about}
          </Link>
        </div>
        <div className="brand-story-images">
          {brandStoryImages.map((image, index) => (
            <img src={assetUrl(image)} alt={`${t.home.brandStoryEyebrow} ${index + 1}`} key={image} />
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
