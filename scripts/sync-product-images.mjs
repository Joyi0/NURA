import fs from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const root = process.cwd();

const sources = [
  { type: "SCENE", folder: "场景图", pattern: /^(BB\d+)-scene-(\d+)\.(jpe?g|png|webp)$/i },
  { type: "MODEL_WEAR", folder: "模特佩戴图", pattern: /^(BB\d+)-model-wear-(\d+)\.(jpe?g|png|webp)$/i }
];

let created = 0;
let updated = 0;
let skipped = 0;

for (const source of sources) {
  const folderPath = path.join(root, "image", source.folder);
  const files = await fs.readdir(folderPath).catch(() => []);

  for (const file of files.sort()) {
    const match = file.match(source.pattern);
    if (!match) continue;

    const sourceCode = match[1].toUpperCase();
    const sortOrder = Number(match[2] || 0);
    const relativePath = path.posix.join("image", source.folder, file);
    const product = await findProduct(sourceCode);

    if (!product) {
      skipped += 1;
      console.warn(`Skipped ${relativePath}: product ${sourceCode} not found.`);
      continue;
    }

    const existing = await prisma.productImage.findFirst({
      where: { productId: product.id, path: relativePath }
    });

    if (existing) {
      await prisma.productImage.update({
        where: { id: existing.id },
        data: {
          type: source.type,
          approved: true,
          sortOrder,
          alt: product.name
        }
      });
      updated += 1;
    } else {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          type: source.type,
          path: relativePath,
          approved: true,
          sortOrder,
          alt: product.name
        }
      });
      created += 1;
    }
  }
}

console.log(`Synced product images. Created: ${created}. Updated: ${updated}. Skipped: ${skipped}.`);
await prisma.$disconnect();

async function findProduct(sourceCode) {
  return prisma.product.findFirst({
    where: {
      OR: [
        { sourceCode },
        { sku: { contains: sourceCode } },
        { name: { contains: sourceCode } }
      ]
    },
    orderBy: { createdAt: "asc" }
  });
}
