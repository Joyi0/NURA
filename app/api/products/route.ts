import { GemstoneType, ProductCategory, ProductColor } from "@prisma/client";
import { prisma } from "@/lib/shared/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const category = url.searchParams.get("category");
  const whereCategory = Object.values(ProductCategory).includes(category as ProductCategory)
    ? (category as ProductCategory)
    : undefined;
  const color = url.searchParams.get("color");
  const gemstone = url.searchParams.get("gemstone");
  const whereColor = Object.values(ProductColor).includes(color as ProductColor) ? (color as ProductColor) : undefined;
  const whereGemstone = Object.values(GemstoneType).includes(gemstone as GemstoneType) ? (gemstone as GemstoneType) : undefined;

  const products = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      ...(whereCategory ? { category: whereCategory } : {}),
      ...(whereColor ? { color: whereColor } : {}),
      ...(whereGemstone ? { gemstoneType: whereGemstone } : {})
    },
    include: { images: true },
    orderBy: { createdAt: "desc" }
  });

  return Response.json({ products });
}
