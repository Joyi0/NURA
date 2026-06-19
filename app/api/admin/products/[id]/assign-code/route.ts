import { GemstoneType, Prisma, ProductCategory, ProductColor } from "@prisma/client";
import { assertAdmin } from "@/lib/admin/auth";
import { generateProductCode } from "@/lib/shared/pricing";
import { prisma } from "@/lib/shared/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = assertAdmin(request);
  if (auth) return auth;

  const { id } = await params;
  const body = await request.json();
  const color = String(body.color || "");
  const category = String(body.category || "");
  const gemstoneType = String(body.gemstoneType || "");
  if (!Object.values(ProductColor).includes(color as ProductColor) || color === "UNKNOWN") {
    return Response.json({ error: "请选择商品颜色。" }, { status: 400 });
  }
  if (!Object.values(ProductCategory).includes(category as ProductCategory)) {
    return Response.json({ error: "请选择有效款式。" }, { status: 400 });
  }
  if (!Object.values(GemstoneType).includes(gemstoneType as GemstoneType) || gemstoneType === "UNKNOWN") {
    return Response.json({ error: "请选择宝石类型。" }, { status: 400 });
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const product = await prisma.$transaction(async (tx) => {
        const current = await tx.product.findUnique({ where: { id } });
        if (!current) throw new Error("商品不存在。");
        const code = await generateProductCode(color as ProductColor, category as ProductCategory, tx);
        const legacyCode = current.legacyCode || (/^BB\d+$/i.test(current.sourceCode || "") ? current.sourceCode : null);
        return tx.product.update({
          where: { id },
          data: {
            sku: code,
            sourceCode: code,
            legacyCode,
            color: color as ProductColor,
            category: category as ProductCategory,
            gemstoneType: gemstoneType as GemstoneType
          },
          include: { images: { orderBy: { sortOrder: "asc" } } }
        });
      });
      return Response.json({ product });
    } catch (error) {
      if (error instanceof Error && error.message === "商品不存在。") {
        return Response.json({ error: error.message }, { status: 404 });
      }
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002" || attempt === 2) throw error;
    }
  }
  return Response.json({ error: "编号生成失败，请重试。" }, { status: 409 });
}
