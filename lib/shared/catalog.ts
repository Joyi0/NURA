import type { GemstoneType, ImageType, ProductCategory, ProductColor, ProductStatus } from "@prisma/client";

export const categories: Array<{ value: ProductCategory; label: string; code: string }> = [
  { value: "EARRING", label: "耳钉", code: "E" },
  { value: "NECKLACE", label: "项链", code: "N" },
  { value: "RING", label: "戒指", code: "R" },
  { value: "BRACELET", label: "手链", code: "B" },
  { value: "SET", label: "套装", code: "S" }
];

export const productColors: Array<{ value: ProductColor; label: string; code: string }> = [
  { value: "YELLOW", label: "黄色", code: "Y" },
  { value: "RED", label: "红色", code: "R" },
  { value: "PINK", label: "粉色", code: "P" },
  { value: "BLUE", label: "蓝色", code: "B" },
  { value: "GREEN", label: "绿色", code: "G" },
  { value: "COLORLESS", label: "无色钻石类", code: "D" },
  { value: "UNKNOWN", label: "待确认", code: "" }
];

export const gemstoneTypes: Array<{ value: GemstoneType; label: string }> = [
  { value: "LAB_GROWN_DIAMOND", label: "培育钻石" },
  { value: "MOISSANITE", label: "莫桑石" },
  { value: "LAB_GROWN_COLORED_GEMSTONE", label: "培育彩色宝石" },
  { value: "OTHER", label: "其他" },
  { value: "UNKNOWN", label: "待确认" }
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

export function productColorLabel(color: ProductColor) {
  return productColors.find((item) => item.value === color)?.label ?? color;
}

export function gemstoneTypeLabel(type: GemstoneType) {
  return gemstoneTypes.find((item) => item.value === type)?.label ?? type;
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
