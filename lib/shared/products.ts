import type { Product, ProductImage } from "@prisma/client";
import type { Locale } from "@/lib/storefront/i18n";
import { productDescription, productDisplayName } from "@/lib/storefront/i18n";
import { cnyToAed } from "./money";

export type ProductWithImages = Product & { images: ProductImage[] };

export function publicImages(product: ProductWithImages) {
  const visible = product.images
    .filter((image) => image.approved)
    .sort((a, b) => {
      const weight = imageWeight(a.type) - imageWeight(b.type);
      return weight || a.sortOrder - b.sortOrder;
    });
  return visible;
}

export function mainImage(product: ProductWithImages) {
  return preferredImage(product, "WARMWHITE")?.path ?? publicImages(product)[0]?.path ?? null;
}

export function preferredImage(product: ProductWithImages, type: string) {
  return publicImages(product).find((image) => image.type === type) ?? null;
}

export function detailGalleryImages(product: ProductWithImages) {
  return ["WARMWHITE", "DETAIL", "SCENE", "MODEL_WEAR"].map((type) => ({
    type,
    path: preferredImage(product, type)?.path ?? fallbackImagePath(product, type)
  }));
}

export function localizedProductName(product: Product, locale: Locale) {
  if (locale === "ar" && product.titleAr) return product.titleAr;
  if (locale === "en" && product.titleEn) return product.titleEn;
  return productDisplayName(product, locale);
}

export function localizedProductDescription(product: Product, locale: Locale) {
  if (locale === "ar" && (product.detailAr || product.shortDescriptionAr)) return product.detailAr || product.shortDescriptionAr || "";
  if (locale === "en" && (product.detailEn || product.shortDescriptionEn)) return product.detailEn || product.shortDescriptionEn || "";
  return productDescription(product, locale);
}

export function productAedPrice(product: Product) {
  return Math.round(product.priceAed ?? cnyToAed(product.price));
}

function imageWeight(type: string) {
  const order = ["WARMWHITE", "ECOMMERCE_WHITE", "DETAIL", "SCENE", "MODEL_WEAR", "BANNER", "SOCIAL", "RAW"];
  const index = order.indexOf(type);
  return index === -1 ? 99 : index;
}

function fallbackImagePath(product: Product, type: string) {
  const code = product.sourceCode || product.sku.match(/BB\d+/i)?.[0] || product.name.match(/BB\d+/i)?.[0];
  if (!code) return null;
  const sourceCode = code.toUpperCase();
  const paths: Record<string, string> = {
    WARMWHITE: `image/暖白产品图/${sourceCode}-product-warmwhite.jpg`,
    DETAIL: `image/产品细节图/${sourceCode}-detail-01.jpg`,
    SCENE: `image/场景图/${sourceCode}-scene-01.jpg`,
    MODEL_WEAR: `image/模特佩戴图/${sourceCode}-model-wear-01.jpg`
  };
  return paths[type] ?? null;
}
