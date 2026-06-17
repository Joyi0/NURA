import { ProductCategory, ProductStatus } from "@prisma/client";
import { assertAdmin } from "@/lib/admin/auth";
import { cnyToAed } from "@/lib/shared/money";
import { calculatePricing } from "@/lib/shared/pricing";
import { prisma } from "@/lib/shared/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = assertAdmin(request);
  if (auth) return auth;

  const { id } = await params;
  const body = await request.json();
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return Response.json({ error: "商品不存在。" }, { status: 404 });

  const purchasePrice = numberOr(body.purchasePrice, product.purchasePrice);
  const shippingFee = numberOr(body.shippingFee, product.shippingFee);
  const packagingFee = numberOr(body.packagingFee, product.packagingFee);
  const pricing = calculatePricing({ purchasePrice, shippingFee, packagingFee });
  const category = body.category ? String(body.category) : product.category;
  const status = body.status ? String(body.status) : product.status;
  const priceAed = body.priceAed === "" || body.priceAed === undefined ? product.priceAed : numberOr(body.priceAed, -1);
  const stock = body.stock === "" || body.stock === undefined ? product.stock : numberOr(body.stock, -1);

  if (!Object.values(ProductCategory).includes(category as ProductCategory)) return Response.json({ error: "分类无效。" }, { status: 400 });
  if (!Object.values(ProductStatus).includes(status as ProductStatus)) return Response.json({ error: "状态无效。" }, { status: 400 });
  if (priceAed !== null && priceAed < 0) return Response.json({ error: "AED 售价无效。" }, { status: 400 });
  if (stock < 0) return Response.json({ error: "库存无效。" }, { status: 400 });

  const updated = await prisma.product.update({
    where: { id },
    data: {
      category: category as ProductCategory,
      status: status as ProductStatus,
      name: body.name ? String(body.name).trim() : product.name,
      description: body.description ? String(body.description).trim() : product.description,
      purchasePrice,
      shippingFee,
      packagingFee,
      ...pricing,
      titleEn: optionalText(body.titleEn, product.titleEn),
      titleAr: optionalText(body.titleAr, product.titleAr),
      shortDescriptionEn: optionalText(body.shortDescriptionEn, product.shortDescriptionEn),
      shortDescriptionAr: optionalText(body.shortDescriptionAr, product.shortDescriptionAr),
      detailEn: optionalText(body.detailEn, product.detailEn),
      detailAr: optionalText(body.detailAr, product.detailAr),
      material: optionalText(body.material, product.material),
      priceAed: priceAed ?? cnyToAed(pricing.price),
      stock: Math.floor(stock),
      tags: optionalText(body.tags, product.tags),
      collectionName: optionalText(body.collectionName, product.collectionName)
    },
    include: { images: { orderBy: { sortOrder: "asc" } } }
  });

  return Response.json({ product: updated });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = assertAdmin(request);
  if (auth) return auth;

  const { id } = await params;
  const orderItemCount = await prisma.orderItem.count({ where: { productId: id } });
  if (orderItemCount > 0) {
    await prisma.product.update({ where: { id }, data: { status: "ARCHIVED" } });
    return Response.json({ ok: true, archived: true });
  }
  await prisma.productImage.deleteMany({ where: { productId: id } });
  await prisma.product.delete({ where: { id } });
  return Response.json({ ok: true, archived: false });
}

function numberOr(value: unknown, fallback: number) {
  const next = Number(value);
  return Number.isFinite(next) && next >= 0 ? next : fallback;
}

function optionalText(value: unknown, fallback: string | null) {
  if (value === undefined) return fallback;
  const next = String(value || "").trim();
  return next || null;
}
