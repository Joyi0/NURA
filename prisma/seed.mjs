import fs from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const root = process.cwd();
const productsPath = path.join(root, "outputs", "bb-pricing", "products.json");

const categoryMap = [
  { test: /项链/, value: "NECKLACE", code: "NEC", label: "项链" },
  { test: /耳|耳钉|耳环/, value: "EARRING", code: "EAR", label: "耳环" },
  { test: /手链/, value: "BRACELET", code: "BRA", label: "手链" },
  { test: /戒指/, value: "RING", code: "RIN", label: "戒指" }
];

const imageCandidates = [
  { type: "WARMWHITE", folder: "暖白产品图", suffix: "product-warmwhite", approved: true },
  { type: "WARMWHITE", folder: "产品提取图", suffix: "product-warmwhite", approved: true },
  { type: "DETAIL", folder: "产品细节图", suffix: "detail-01", approved: true },
  { type: "SCENE", folder: "场景图", suffix: "scene-01", approved: false },
  { type: "MODEL_WEAR", folder: "模特佩戴图", suffix: "model-wear-01", approved: false }
];

const rawExtensions = [".jpg", ".jpeg", ".png", ".webp"];

const source = JSON.parse(await fs.readFile(productsPath, "utf8"));

for (const item of source) {
  const sourceCode = String(item["款号"] || "").trim();
  if (!sourceCode) continue;

  const name = String(item["产品名称"] || inferName(sourceCode)).trim();
  const category = inferCategory(name);
  const purchasePrice = Number(item["成本价"] || 0);
  const shippingFee = 120;
  const packagingFee = 30;
  const pricing = calculatePricing({ purchasePrice, shippingFee, packagingFee });
  const copy = copyForProduct({ sourceCode, name, category });
  const sku = `NURA-${category.code}-SEED-${sourceCode}`;
  const images = await collectImages(sourceCode, name);
  const hasPublicProductImage = images.some((image) => image.approved);

  await prisma.product.upsert({
    where: { sku },
    update: {
      sourceCode,
      category: category.value,
      name,
      description: descriptionFor(name, category.label),
      ...copy,
      purchasePrice,
      shippingFee,
      packagingFee,
      ...pricing,
      status: hasPublicProductImage ? "ACTIVE" : "DRAFT",
      images: {
        deleteMany: {},
        create: images
      }
    },
    create: {
      sku,
      sourceCode,
      category: category.value,
      name,
      description: descriptionFor(name, category.label),
      ...copy,
      purchasePrice,
      shippingFee,
      packagingFee,
      ...pricing,
      status: hasPublicProductImage ? "ACTIVE" : "DRAFT",
      images: { create: images }
    }
  });
}

console.log(`Seeded ${source.length} NURA products.`);
await prisma.$disconnect();

function calculatePricing({ purchasePrice, shippingFee, packagingFee }) {
  const cost = roundMoney(purchasePrice + shippingFee + packagingFee);
  const rawSuggestedPrice = roundMoney(cost * 2);
  const price = Math.min(1200, Math.max(600, Math.ceil(rawSuggestedPrice / 10) * 10));
  const priceReviewStatus =
    rawSuggestedPrice < 600 ? "LOWER_THAN_TARGET" : rawSuggestedPrice > 1200 ? "HIGHER_THAN_TARGET" : "TARGET";
  return { cost, rawSuggestedPrice, price, priceReviewStatus };
}

function roundMoney(value) {
  return Math.round(value * 100) / 100;
}

function inferCategory(name) {
  return categoryMap.find((item) => item.test.test(name)) || categoryMap[1];
}

function inferName(sourceCode) {
  return `${sourceCode} NURA 轻奢珠宝`;
}

function descriptionFor(name, category) {
  return `${name}，采用 NURA 轻奢视觉标准收录，适合日常佩戴与精致场合。分类：${category}。`;
}

function copyForProduct({ sourceCode, name, category }) {
  const materialPrefix = /S925|925/.test(name) ? "925 Silver" : "Silver-Tone";
  const arabicMaterial = /S925|925/.test(name) ? "من فضة 925" : "بلون فضي";
  const design = designCopy(name, sourceCode);
  const type = productTypeCopy(category.value);

  const titleEn = `${materialPrefix} ${design.enTitle} ${type.en}`;
  const titleAr = `${type.ar} ${arabicMaterial} ${design.arTitle}`;
  const shortDescriptionEn = `${design.enShort} Designed with a refined silver setting for polished everyday styling.`;
  const shortDescriptionAr = `${design.arShort} بتفاصيل فضية ناعمة تناسب الإطلالات اليومية الراقية.`;
  const detailEn = `${titleEn} brings a soft-luxury accent to minimal dressing. The piece highlights ${design.enDetail}, making it easy to style from daytime looks to evening plans.`;
  const detailAr = `${titleAr} يضيف لمسة فاخرة ناعمة إلى الإطلالات البسيطة. يبرز التصميم ${design.arDetail} ليكون مناسباً من النهار إلى المساء.`;

  return {
    titleEn,
    titleAr,
    shortDescriptionEn,
    shortDescriptionAr,
    detailEn,
    detailAr,
    material: /S925|925/.test(name) ? "925 silver" : "silver-tone jewelry"
  };
}

function productTypeCopy(category) {
  switch (category) {
    case "NECKLACE":
      return { en: "Necklace", ar: "قلادة" };
    case "BRACELET":
      return { en: "Bracelet", ar: "سوار" };
    case "RING":
      return { en: "Ring", ar: "خاتم" };
    default:
      return { en: "Earrings", ar: "أقراط" };
  }
}

function designCopy(name, sourceCode) {
  if (/BB01/.test(sourceCode)) {
    return {
      enTitle: "Royal Blue Halo Gemstone",
      arTitle: "بحجر أزرق ملكي محاط بفصوص لامعة",
      enShort: "Deep royal-blue gemstones are framed by clear stones for a polished feminine shine.",
      arShort: "أحجار زرقاء ملكية عميقة تحيط بها فصوص شفافة لإطلالة أنثوية مصقولة.",
      enDetail: "deep blue center stones, clear halos, and polished silver settings",
      arDetail: "أحجاراً زرقاء عميقة محاطة بفصوص شفافة ضمن إطار فضي مصقول"
    };
  }
  if (/BB02/.test(sourceCode)) {
    return {
      enTitle: "Emerald Green Halo Gemstone",
      arTitle: "بحجر أخضر زمردي محاط بفصوص لامعة",
      enShort: "Emerald-green gemstones are framed by clear stones for a refined everyday accent.",
      arShort: "أحجار خضراء زمردية تحيط بها فصوص شفافة لإطلالة يومية راقية.",
      enDetail: "emerald-green center stones, clear halos, and polished silver settings",
      arDetail: "أحجاراً خضراء زمردية محاطة بفصوص شفافة ضمن إطار فضي مصقول"
    };
  }
  if (/BB30/.test(sourceCode)) {
    return {
      enTitle: "Royal Blue Halo Gemstone",
      arTitle: "بحجر أزرق ملكي محاط بفصوص لامعة",
      enShort: "A deep royal-blue gemstone is framed by clear stones for a polished feminine shine.",
      arShort: "حجر أزرق ملكي عميق تحيط به فصوص شفافة لإطلالة أنثوية مصقولة.",
      enDetail: "a deep blue center stone, a clear halo, and a delicate chain",
      arDetail: "حجراً أزرق عميقاً محاطاً بفصوص شفافة مع سلسلة رقيقة"
    };
  }
  if (/红钻|red/i.test(name)) {
    return {
      enTitle: "Red and Clear Stone Tennis",
      arTitle: "بتصميم تنس وأحجار حمراء وشفافة",
      enShort: "Alternating red and clear stones create a vivid yet refined jewelry accent.",
      arShort: "تمنح الأحجار الحمراء والشفافة المتناوبة لمسة لافتة وراقية.",
      enDetail: "alternating red and clear stones in a slim silver setting",
      arDetail: "أحجاراً حمراء وشفافة متناوبة ضمن إطار فضي رفيع"
    };
  }
  if (/蝴蝶|bow/i.test(name) || /BB22/.test(sourceCode)) {
    return {
      enTitle: "Pink Bow Gemstone",
      arTitle: "بفيونكة وحجر وردي",
      enShort: "A bow-shaped pendant with a pale pink center stone brings a soft feminine detail.",
      arShort: "تمنح الفيونكة مع الحجر الوردي الناعم لمسة أنثوية رقيقة.",
      enDetail: "a bow silhouette, clear stone accents, and a pale pink center stone",
      arDetail: "شكل الفيونكة وفصوصاً شفافة مع حجر وردي ناعم في الوسط"
    };
  }
  if (/蓝|blue/i.test(name)) {
    return {
      enTitle: "Blue Gemstone",
      arTitle: "بحجر أزرق",
      enShort: "A blue gemstone detail adds a polished accent to everyday dressing.",
      arShort: "يضفي الحجر الأزرق لمسة مصقولة على الإطلالات اليومية.",
      enDetail: "a blue gemstone detail in a refined silver setting",
      arDetail: "تفصيلاً بحجر أزرق ضمن إطار فضي أنيق"
    };
  }
  return {
    enTitle: "Refined Gemstone",
    arTitle: "بتصميم أحجار راق",
    enShort: "A refined gemstone piece made for soft everyday shine.",
    arShort: "قطعة مرصعة بتفاصيل ناعمة لإطلالة يومية راقية.",
    enDetail: "a balanced gemstone design with a polished jewelry finish",
    arDetail: "تصميماً متوازناً بالأحجار مع لمسة مصقولة"
  };
}

async function collectImages(sourceCode, name) {
  const images = [];
  let sortOrder = 0;

  for (const candidate of imageCandidates) {
    if (images.some((image) => image.type === candidate.type)) continue;
    const found = await findFirstExisting(path.join("image", candidate.folder), `${sourceCode}-${candidate.suffix}`);
    if (found) {
      images.push({
        type: candidate.type,
        path: found,
        alt: name,
        approved: candidate.approved,
        sortOrder: sortOrder++
      });
    }
  }

  const raw = await findRaw(sourceCode);
  if (raw) {
    images.push({
      type: "RAW",
      path: raw,
      alt: `${name} 原始实拍图`,
      approved: false,
      sortOrder: sortOrder++
    });
  }

  return images;
}

async function findRaw(sourceCode) {
  for (const ext of rawExtensions) {
    const relative = path.join("image", "珠宝拍摄图片", `${sourceCode}${ext}`);
    if (await exists(path.join(root, relative))) return relative;
  }
  return null;
}

async function findFirstExisting(folder, base) {
  for (const ext of rawExtensions) {
    const relative = path.join(folder, `${base}${ext}`);
    if (await exists(path.join(root, relative))) return relative;
  }
  return null;
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
