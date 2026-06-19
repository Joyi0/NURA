import type { Prisma, ProductCategory, ProductColor } from "@prisma/client";
import { categories, productColors } from "./catalog";
import { prisma } from "./prisma";

export function calculatePricing(input: {
  purchasePrice: number;
  shippingFee: number;
  packagingFee: number;
}) {
  const cost = roundMoney(input.purchasePrice + input.shippingFee + input.packagingFee);
  const rawSuggestedPrice = roundMoney(cost * 2);
  const rounded = Math.ceil(rawSuggestedPrice / 10) * 10;
  const price = Math.min(1200, Math.max(600, rounded));
  const priceReviewStatus =
    rawSuggestedPrice < 600 ? "LOWER_THAN_TARGET" : rawSuggestedPrice > 1200 ? "HIGHER_THAN_TARGET" : "TARGET";

  return { cost, rawSuggestedPrice, price, priceReviewStatus };
}

export async function generateProductCode(
  color: ProductColor,
  category: ProductCategory,
  tx: Prisma.TransactionClient | typeof prisma = prisma
) {
  const colorCode = productColors.find((item) => item.value === color)?.code;
  const styleCode = categories.find((item) => item.value === category)?.code;
  if (!colorCode || !styleCode) throw new Error("商品颜色和款式必须确认后才能生成编号。");

  const prefix = `${colorCode}${styleCode}`;
  const existing = await tx.product.findMany({
    where: {
      OR: [{ sku: { startsWith: prefix } }, { sourceCode: { startsWith: prefix } }]
    },
    select: { sku: true, sourceCode: true }
  });
  const max = existing.reduce((current, product) => {
    const values = [product.sku, product.sourceCode || ""];
    for (const value of values) {
      const match = value.match(new RegExp(`^${prefix}(\\d{2,})$`));
      if (match) current = Math.max(current, Number(match[1]));
    }
    return current;
  }, 0);
  if (max >= 99) throw new Error(`${prefix} 编号已达到两位流水上限。`);
  return `${prefix}${String(max + 1).padStart(2, "0")}`;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
