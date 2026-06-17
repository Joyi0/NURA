import { AdminClient } from "@/components/admin/AdminClient";
import { AdminNav } from "@/components/admin/AdminNav";
import { redirect } from "next/navigation";
import { requireAdminPage } from "@/lib/admin/auth";
import { prisma } from "@/lib/shared/prisma";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ edit?: string; q?: string }> }) {
  const isAdmin = await requireAdminPage();
  if (!isAdmin) redirect("/nura-admin");
  const query = await searchParams;

  const products = await prisma.product.findMany({
    where: { status: { not: "ARCHIVED" } },
    include: { images: { orderBy: { sortOrder: "asc" } } },
    orderBy: { createdAt: "desc" }
  });
  const initialProducts = products.map((product) => ({
    id: product.id,
    sku: product.sku,
    sourceCode: product.sourceCode,
    category: product.category,
    name: product.name,
    description: product.description,
    purchasePrice: product.purchasePrice,
    shippingFee: product.shippingFee,
    packagingFee: product.packagingFee,
    cost: product.cost,
    rawSuggestedPrice: product.rawSuggestedPrice,
    price: product.price,
    titleEn: product.titleEn,
    titleAr: product.titleAr,
    shortDescriptionEn: product.shortDescriptionEn,
    shortDescriptionAr: product.shortDescriptionAr,
    detailEn: product.detailEn,
    detailAr: product.detailAr,
    material: product.material,
    priceAed: product.priceAed,
    stock: product.stock,
    tags: product.tags,
    collectionName: product.collectionName,
    priceReviewStatus: product.priceReviewStatus,
    status: product.status,
    images: product.images.map((image) => ({
      id: image.id,
      type: image.type,
      path: image.path,
      approved: image.approved
    }))
  }));

  return (
    <div className="page">
      <AdminNav />
      <div className="page-title">
        <h1>商品管理</h1>
        <p>维护双语商品档案、AED 售价、库存、素材和上架状态。</p>
      </div>
      <AdminClient initialProducts={initialProducts} initialEditingId={query.edit || null} initialSearchTerm={String(query.q || "")} />
    </div>
  );
}
