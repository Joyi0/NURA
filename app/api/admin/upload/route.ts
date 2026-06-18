import { ImageType } from "@prisma/client";
import { put } from "@vercel/blob";
import { assertAdmin } from "@/lib/admin/auth";
import { imageTypes } from "@/lib/shared/catalog";
import { prisma } from "@/lib/shared/prisma";

export async function POST(request: Request) {
  const auth = assertAdmin(request);
  if (auth) return auth;

  const form = await request.formData();
  const productId = String(form.get("productId") || "");
  const type = String(form.get("type") || "");
  const file = form.get("file");

  if (!productId) return Response.json({ error: "缺少商品 ID。" }, { status: 400 });
  if (!Object.values(ImageType).includes(type as ImageType)) return Response.json({ error: "图片类型无效。" }, { status: 400 });
  if (!(file instanceof File)) return Response.json({ error: "请选择图片文件。" }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return Response.json({ error: "图片不能超过 10MB。" }, { status: 400 });

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return Response.json({ error: "商品不存在。" }, { status: 404 });
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json({ error: "图片存储尚未配置，请设置 BLOB_READ_WRITE_TOKEN。" }, { status: 503 });
  }

  const config = imageTypes.find((item) => item.value === type);
  const ext = extensionFromFile(file.name, file.type);
  const safeName = `${product.sourceCode || product.sku}-${type.toLowerCase()}-${Date.now()}${ext}`;
  const relativePath = ["image", config?.folder || "暖白产品图", safeName].join("/");
  const imagePath = (
    await put(`nura/${relativePath.split("/").map(encodeURIComponent).join("/")}`, file, {
      access: "public",
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN
    })
  ).url;

  const image = await prisma.productImage.create({
    data: {
      productId,
      type: type as ImageType,
      path: imagePath,
      alt: product.name,
      approved: Boolean(config?.publicByDefault),
      sortOrder: Date.now()
    }
  });

  return Response.json({ image });
}

function extensionFromFile(name: string, type: string) {
  const ext = name.match(/\.[a-z0-9]+$/i)?.[0]?.toLowerCase() || "";
  if ([".jpg", ".jpeg", ".png", ".webp"].includes(ext)) return ext;
  if (type === "image/png") return ".png";
  if (type === "image/webp") return ".webp";
  return ".jpg";
}
