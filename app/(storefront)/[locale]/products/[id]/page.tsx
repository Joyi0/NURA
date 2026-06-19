import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/storefront/AddToCartButton";
import { assetUrl } from "@/lib/shared/catalog";
import { formatAed } from "@/lib/shared/money";
import { prisma } from "@/lib/shared/prisma";
import { detailGalleryImages, localizedProductDescription, localizedProductName, mainImage, productAedPrice } from "@/lib/shared/products";
import { categoryLabel, dictionary, gemstoneTypeLabel, isLocale, productColorLabel } from "@/lib/storefront/i18n";

export default async function ProductDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();

  const product = await prisma.product.findFirst({
    where: { id, status: "ACTIVE" },
    include: { images: true }
  });

  if (!product) notFound();

  const galleryImages = detailGalleryImages(product);
  const t = dictionary(locale);
  const displayName = localizedProductName(product, locale);
  const price = productAedPrice(product);

  return (
    <div className="page detail-layout">
      <div className="gallery">
        {galleryImages.map((image) => (
          <img src={assetUrl(image.path)} alt={displayName} key={image.type} />
        ))}
      </div>

      <aside className="detail-copy">
        <h1>{displayName}</h1>
        <div className="price">{formatAed(price)}</div>
        <p>{localizedProductDescription(product, locale) || t.products.descriptionFallback}</p>
        <div className="meta-list">
          <div>
            <span className="muted">{t.products.sku}</span>
            <span>{product.sku}</span>
          </div>
          <div>
            <span className="muted">{t.products.category}</span>
            <span>{categoryLabel(product.category, locale)}</span>
          </div>
          <div>
            <span className="muted">{t.products.color}</span>
            <span>{productColorLabel(product.color, locale)}</span>
          </div>
          <div>
            <span className="muted">{t.products.gemstone}</span>
            <span>{gemstoneTypeLabel(product.gemstoneType, locale)}</span>
          </div>
        </div>
        {product.certificateAuthority?.toUpperCase() === "IGI" && product.certificateNumber && product.certificateUrl ? (
          <a className="certificate-link" href={product.certificateUrl} target="_blank" rel="noreferrer">
            IGI Certified · {product.certificateNumber}
          </a>
        ) : null}
        <AddToCartButton
          label={t.products.addToCart}
          addedLabel={t.products.addedToCart}
          cartHref={`/${locale}/cart`}
          product={{
            id: product.id,
            sku: product.sku,
            name: displayName,
            price,
            image: mainImage(product)
          }}
        />
      </aside>
    </div>
  );
}
