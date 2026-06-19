import { GemstoneType, Prisma, ProductCategory, ProductColor, ProductStatus } from "@prisma/client";
import { assertAdmin } from "@/lib/admin/auth";
import { cnyToAed } from "@/lib/shared/money";
import { calculatePricing, generateProductCode } from "@/lib/shared/pricing";
import { prisma } from "@/lib/shared/prisma";

export async function GET(request: Request) {
  const auth = assertAdmin(request);
  if (auth) return auth;

  const products = await prisma.product.findMany({
    where: { status: { not: "ARCHIVED" } },
    include: { images: { orderBy: { sortOrder: "asc" } } },
    orderBy: { createdAt: "desc" }
  });
  return Response.json({ products });
}

export async function POST(request: Request) {
  const auth = assertAdmin(request);
  if (auth) return auth;

  const body = await request.json();
  const parsed = parseProductInput(body);
  if ("error" in parsed) return Response.json({ error: parsed.error }, { status: 400 });

  const pricing = calculatePricing(parsed);
  const product = await createProductWithCode(parsed, pricing);

  return Response.json({ product }, { status: 201 });
}

function parseProductInput(body: Record<string, unknown>) {
  const category = String(body.category || "");
  const color = String(body.color || "");
  const gemstoneType = String(body.gemstoneType || "");
  const status = String(body.status || "DRAFT");
  const name = String(body.name || "").trim();
  const description = String(body.description || "").trim();
  const purchasePrice = Number(body.purchasePrice);
  const shippingFee = Number(body.shippingFee ?? 120);
  const packagingFee = Number(body.packagingFee ?? 30);
  const priceAed = optionalNumber(body.priceAed);
  const stock = optionalNumber(body.stock) ?? 0;

  if (!Object.values(ProductCategory).includes(category as ProductCategory)) return { error: "请选择有效分类。" };
  if (!Object.values(ProductColor).includes(color as ProductColor) || color === "UNKNOWN") return { error: "请选择商品颜色。" };
  if (!Object.values(GemstoneType).includes(gemstoneType as GemstoneType) || gemstoneType === "UNKNOWN") {
    return { error: "请选择宝石类型。" };
  }
  if (!Object.values(ProductStatus).includes(status as ProductStatus)) return { error: "请选择有效状态。" };
  if (!name) return { error: "请填写商品名称。" };
  if (!Number.isFinite(purchasePrice) || purchasePrice < 0) return { error: "请填写有效进货价。" };
  if (!Number.isFinite(shippingFee) || shippingFee < 0) return { error: "请填写有效运费。" };
  if (!Number.isFinite(packagingFee) || packagingFee < 0) return { error: "请填写有效包装费。" };
  if (priceAed !== undefined && priceAed < 0) return { error: "请填写有效 AED 售价。" };
  if (stock < 0) return { error: "请填写有效库存。" };

  return {
    category: category as ProductCategory,
    color: color as ProductColor,
    gemstoneType: gemstoneType as GemstoneType,
    status: status as ProductStatus,
    name,
    description: description || "NURA 轻奢珠宝，适合日常佩戴与精致场合。",
    purchasePrice,
    shippingFee,
    packagingFee,
    titleEn: cleanOptional(body.titleEn),
    titleAr: cleanOptional(body.titleAr),
    shortDescriptionEn: cleanOptional(body.shortDescriptionEn),
    shortDescriptionAr: cleanOptional(body.shortDescriptionAr),
    detailEn: cleanOptional(body.detailEn),
    detailAr: cleanOptional(body.detailAr),
    material: cleanOptional(body.material),
    priceAed,
    stock: Math.floor(stock),
    tags: cleanOptional(body.tags),
    collectionName: cleanOptional(body.collectionName),
    certificateAuthority: cleanOptional(body.certificateAuthority),
    certificateNumber: cleanOptional(body.certificateNumber),
    certificateUrl: validCertificateUrl(body.certificateUrl)
  };
}

async function createProductWithCode(
  parsed: Exclude<ReturnType<typeof parseProductInput>, { error: string }>,
  pricing: ReturnType<typeof calculatePricing>
) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(async (tx) => {
        const sku = await generateProductCode(parsed.color, parsed.category, tx);
        return tx.product.create({
          data: {
            sku,
            sourceCode: sku,
            category: parsed.category,
            color: parsed.color,
            gemstoneType: parsed.gemstoneType,
            name: parsed.name,
            description: parsed.description,
            purchasePrice: parsed.purchasePrice,
            shippingFee: parsed.shippingFee,
            packagingFee: parsed.packagingFee,
            ...pricing,
            titleEn: parsed.titleEn,
            titleAr: parsed.titleAr,
            detailEn: parsed.detailEn,
            detailAr: parsed.detailAr,
            material: parsed.material,
            priceAed: parsed.priceAed ?? cnyToAed(pricing.price),
            stock: parsed.stock,
            tags: parsed.tags,
            collectionName: parsed.collectionName,
            certificateAuthority: parsed.certificateAuthority,
            certificateNumber: parsed.certificateNumber,
            certificateUrl: parsed.certificateUrl,
            status: parsed.status
          },
          include: { images: true }
        });
      });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002" || attempt === 2) throw error;
    }
  }
  throw new Error("商品编号生成失败。");
}

function cleanOptional(value: unknown) {
  const next = String(value || "").trim();
  return next || null;
}

function optionalNumber(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  const next = Number(value);
  return Number.isFinite(next) ? next : -1;
}

function validCertificateUrl(value: unknown) {
  const next = cleanOptional(value);
  if (!next) return null;
  try {
    const url = new URL(next);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
