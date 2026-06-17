import type { Locale } from "./i18n";
import { dictionary } from "./i18n";

const bannerPaths = [
  "image/独立站横幅图/NURA-banner-01-soft-luxury-model.jpg",
  "image/独立站横幅图/NURA-banner-02-gold-jewelry-closeup.jpg",
  "image/独立站横幅图/NURA-banner-03-desert-light-editorial.jpg",
  "image/独立站横幅图/NURA-banner-04-vanity-scene.jpg",
  "image/独立站横幅图/NURA-banner-05-evening-wear-jewelry.jpg"
];

export const brandStoryImages = [
  "image/品牌介绍图/NURA-brand-01-soft-gold-lifestyle.jpg",
  "image/品牌介绍图/NURA-brand-02-jewelry-vanity-editorial.jpg",
  "image/品牌介绍图/NURA-brand-03-evening-gift-scene.jpg"
];

export function homeBanners(locale: Locale) {
  const copy = dictionary(locale).banners;
  return bannerPaths.map((image, index) => ({
    image,
    title: copy[index].title,
    text: copy[index].text,
    cta: copy[index].cta
  }));
}
