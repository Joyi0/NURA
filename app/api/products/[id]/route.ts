import { prisma } from "@/lib/shared/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findFirst({
    where: { id, status: "ACTIVE" },
    include: { images: true }
  });

  if (!product) return Response.json({ error: "商品不存在" }, { status: 404 });
  return Response.json({ product });
}
