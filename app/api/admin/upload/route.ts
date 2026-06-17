import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { ImageType } from "@prisma/client";
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

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return Response.json({ error: "商品不存在。" }, { status: 404 });

  const config = imageTypes.find((item) => item.value === type);
  const ext = extensionFromFile(file.name, file.type);
  const safeName = `${product.sourceCode || product.sku}-${type.toLowerCase()}-${Date.now()}${ext}`;
  const relativePath = path.join("image", config?.folder || "暖白产品图", safeName);
  const absolutePath = path.join(process.cwd(), relativePath);

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, Buffer.from(await file.arrayBuffer()));

  const image = await prisma.productImage.create({
    data: {
      productId,
      type: type as ImageType,
      path: relativePath,
      alt: product.name,
      approved: Boolean(config?.publicByDefault),
      sortOrder: Date.now()
    }
  });

  return Response.json({ image });
}

function extensionFromFile(name: string, type: string) {
  const ext = path.extname(name).toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".webp"].includes(ext)) return ext;
  if (type === "image/png") return ".png";
  if (type === "image/webp") return ".webp";
  return ".jpg";
}
