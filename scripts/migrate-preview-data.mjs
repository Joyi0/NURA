import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { put } from "@vercel/blob";
import { PrismaClient as TargetPrismaClient } from "@prisma/client";
import { PrismaClient as SourcePrismaClient } from "../generated/sqlite-client/index.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sqlitePath = path.join(root, "prisma", "dev.db");
const sqliteUrl = process.env.SQLITE_DATABASE_URL || `file:${sqlitePath}`;
const replace = process.argv.includes("--replace");

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
if (!process.env.DIRECT_URL) throw new Error("DIRECT_URL is required.");
if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("BLOB_READ_WRITE_TOKEN is required.");
if (!replace) throw new Error("Run with --replace to confirm replacing preview database contents.");

const source = new SourcePrismaClient({ datasources: { db: { url: sqliteUrl } } });
const target = new TargetPrismaClient();

try {
  const [products, orders] = await Promise.all([
    source.product.findMany({ include: { images: true }, orderBy: { createdAt: "asc" } }),
    source.order.findMany({ include: { items: true }, orderBy: { createdAt: "asc" } })
  ]);

  const uploadedPaths = new Map();
  for (const product of products) {
    for (const image of product.images) {
      if (isRemoteUrl(image.path) || uploadedPaths.has(image.path)) continue;
      const absolute = path.join(root, image.path);
      const bytes = await fs.readFile(absolute);
      const blob = await put(`nura/${toBlobPath(image.path)}`, bytes, {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
        token: process.env.BLOB_READ_WRITE_TOKEN
      });
      uploadedPaths.set(image.path, blob.url);
      console.log(`Uploaded ${image.path}`);
    }
  }

  await target.$transaction([
    target.orderItem.deleteMany(),
    target.order.deleteMany(),
    target.productImage.deleteMany(),
    target.product.deleteMany()
  ]);

  for (const product of products) {
    const { images, ...data } = product;
    await target.product.create({
      data: {
        ...data,
        images: {
          create: images.map(({ productId: _productId, ...image }) => ({
            ...image,
            path: uploadedPaths.get(image.path) || image.path
          }))
        }
      }
    });
  }

  for (const order of orders) {
    const { items, ...data } = order;
    await target.order.create({
      data: {
        ...data,
        items: {
          create: items.map(({ orderId: _orderId, ...item }) => item)
        }
      }
    });
  }

  const counts = await Promise.all([
    target.product.count(),
    target.productImage.count(),
    target.order.count(),
    target.orderItem.count()
  ]);
  console.log(`Migrated products=${counts[0]}, images=${counts[1]}, orders=${counts[2]}, orderItems=${counts[3]}.`);
} finally {
  await Promise.allSettled([source.$disconnect(), target.$disconnect()]);
}

function isRemoteUrl(value) {
  return /^https?:\/\//i.test(value);
}

function toBlobPath(value) {
  return value
    .split(path.sep)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}
