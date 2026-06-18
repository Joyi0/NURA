import type { ImageType, ProductCategory, ProductStatus } from "@prisma/client";

export const categories: Array<{ value: ProductCategory; label: string; code: string }> = [
  { value: "NECKLACE", label: "项链", code: "NEC" },
  { value: "EARRING", label: "耳环", code: "EAR" },
  { value: "BRACELET", label: "手链", code: "BRA" },
  { value: "RING", label: "戒指", code: "RIN" }
];

export const statuses: Array<{ value: ProductStatus; label: string }> = [
  { value: "DRAFT", label: "草稿" },
  { value: "REVIEW", label: "待审核" },
  { value: "ACTIVE", label: "已上架" },
  { value: "ARCHIVED", label: "下架" }
];

export const imageTypes: Array<{ value: ImageType; label: string; folder: string; publicByDefault: boolean }> = [
  { value: "RAW", label: "原始实拍图", folder: "珠宝拍摄图片", publicByDefault: false },
  { value: "ECOMMERCE_WHITE", label: "电商白底图", folder: "电商白底图", publicByDefault: true },
  { value: "WARMWHITE", label: "暖白产品图", folder: "暖白产品图", publicByDefault: true },
  { value: "SCENE", label: "场景图", folder: "场景图", publicByDefault: false },
  { value: "MODEL_WEAR", label: "模特佩戴图", folder: "模特佩戴图", publicByDefault: false },
  { value: "BANNER", label: "独立站横幅图", folder: "独立站横幅图", publicByDefault: false },
  { value: "SOCIAL", label: "社媒素材", folder: "社媒素材", publicByDefault: false },
  { value: "DETAIL", label: "详情图", folder: "产品细节图", publicByDefault: true }
];

export function categoryLabel(category: ProductCategory) {
  return categories.find((item) => item.value === category)?.label ?? category;
}

export function statusLabel(status: ProductStatus) {
  return statuses.find((item) => item.value === status)?.label ?? status;
}

export function imageTypeLabel(type: ImageType) {
  return imageTypes.find((item) => item.value === type)?.label ?? type;
}

export function assetUrl(path?: string | null) {
  if (!path) return "/placeholder.svg";
  if (/^https?:\/\//i.test(path)) return path;
  return `/api/assets?path=${encodeURIComponent(path)}`;
}
