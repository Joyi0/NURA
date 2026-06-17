import { categories } from "./catalog";
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

export async function generateSku(category: string) {
  const code = categories.find((item) => item.value === category)?.code ?? "JWL";
  const date = new Date();
  const stamp = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("");
  const prefix = `NURA-${code}-${stamp}`;
  const count = await prisma.product.count({ where: { sku: { startsWith: prefix } } });
  return `${prefix}-${String(count + 1).padStart(3, "0")}`;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
