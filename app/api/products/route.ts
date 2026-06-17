import { ProductCategory } from "@prisma/client";
import { prisma } from "@/lib/shared/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const category = url.searchParams.get("category");
  const whereCategory = Object.values(ProductCategory).includes(category as ProductCategory)
    ? (category as ProductCategory)
    : undefined;

  const products = await prisma.product.findMany({
    where: { status: "ACTIVE", ...(whereCategory ? { category: whereCategory } : {}) },
    include: { images: true },
    orderBy: { createdAt: "desc" }
  });

  return Response.json({ products });
}
