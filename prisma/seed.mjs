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
  { test: /戒指/, value: "RING", code: "RIN", label: "戒指" },
  { test: /套装|组合/, value: "SET", code: "SET", label: "套装" }
];

const imageCandidates = [
  { type: "WARMWHITE", folder: "暖白产品图", suffix: "product-warmwhite", approved: true },
  { type: "WARMWHITE", folder: "产品提取图", suffix: "product-warmwhite", approved: true },
  { type: "DETAIL", folder: "产品细节图", suffix: "detail-01", approved: true },
  { type: "SCENE", folder: "场景图", suffix: "scene-01", approved: false },
  { type: "MODEL_WEAR", folder: "模特佩戴图", suffix: "model-wear-01", approved: false }
];

const rawExtensions = [".jpg", ".jpeg", ".png", ".webp"];
const requiredProductImageTypes = ["WARMWHITE", "DETAIL", "SCENE", "MODEL_WEAR"];

const source = JSON.parse(await fs.readFile(productsPath, "utf8"));

await prisma.$transaction(async (tx) => {
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
    const identity = confirmedIdentity(sourceCode);
    const sku = identity?.code || `NURA-${category.code}-SEED-${sourceCode}`;
    const images = await collectImages(sourceCode, name);
    const hasCompleteImageSet = requiredProductImageTypes.every((type) =>
      images.some((image) => image.type === type)
    );

    const existing = await tx.product.findFirst({
      where: {
        OR: [
          { legacyCode: sourceCode },
          { sourceCode },
          { sku: `NURA-${category.code}-SEED-${sourceCode}` },
          ...(identity ? [{ sku: identity.code }] : [])
        ]
      }
    });
    const data = {
        sourceCode,
        legacyCode: sourceCode,
        category: category.value,
        color: identity?.color || "UNKNOWN",
        gemstoneType: identity?.gemstoneType || "UNKNOWN",
        name,
        description: descriptionFor(name, category.label),
        ...copy,
        purchasePrice,
        shippingFee,
        packagingFee,
        ...pricing,
        status: hasCompleteImageSet ? "ACTIVE" : "DRAFT"
    };
    if (existing) {
      await tx.product.update({
        where: { id: existing.id },
        data: {
          ...data,
          sku,
          sourceCode: identity?.code || existing.sourceCode || sourceCode,
          images: {
            deleteMany: {},
            create: images
          }
        }
      });
    } else {
      await tx.product.create({
        data: {
          ...data,
          sku,
          sourceCode: identity?.code || sourceCode,
          images: { create: images }
        }
      });
    }
  }
}, { maxWait: 10_000, timeout: 60_000 });

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

function confirmedIdentity(sourceCode) {
  return {
    BB01: { code: "BE01", color: "BLUE", gemstoneType: "LAB_GROWN_COLORED_GEMSTONE" },
    BB02: { code: "GE01", color: "GREEN", gemstoneType: "LAB_GROWN_COLORED_GEMSTONE" },
    BB22: { code: "PN01", color: "PINK", gemstoneType: "LAB_GROWN_COLORED_GEMSTONE" },
    BB24: { code: "PN02", color: "PINK", gemstoneType: "LAB_GROWN_COLORED_GEMSTONE" },
    BB30: { code: "BN01", color: "BLUE", gemstoneType: "LAB_GROWN_COLORED_GEMSTONE" },
    BB54: { code: "BE02", color: "BLUE", gemstoneType: "LAB_GROWN_COLORED_GEMSTONE" },
    BB65: { code: "DB01", color: "COLORLESS", gemstoneType: "UNKNOWN" },
    BB66: { code: "BR01", color: "BLUE", gemstoneType: "LAB_GROWN_COLORED_GEMSTONE" },
    BB69: { code: "RB01", color: "RED", gemstoneType: "LAB_GROWN_COLORED_GEMSTONE" },
    BB84: { code: "DR01", color: "COLORLESS", gemstoneType: "UNKNOWN" }
  }[sourceCode] || null;
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
  if (/BB10/.test(sourceCode)) {
    return {
      enTitle: "Golden Yellow Geometric Gemstone",
      arTitle: "بحجر أصفر ذهبي بتصميم هندسي",
      enShort: "Square golden-yellow gemstones are framed by clear baguette and round stones for a crisp geometric shine.",
      arShort: "أحجار مربعة بلون أصفر ذهبي تحيط بها فصوص باغيت ودائرية شفافة لبريق هندسي أنيق.",
      enDetail: "square golden-yellow center stones, clear baguette side accents, round corner clusters, and polished silver settings",
      arDetail: "أحجاراً مركزية مربعة باللون الأصفر الذهبي مع فصوص باغيت جانبية وتجمعات دائرية عند الزوايا ضمن إطار فضي مصقول"
    };
  }
  if (/BB24/.test(sourceCode)) {
    return {
      enTitle: "Blush Pink Pear Halo Gemstone",
      arTitle: "بحجر وردي كمثري وهالة مزدوجة",
      enShort: "A blush-pink pear gemstone is framed by a rose-gold pink inner halo and a clear silver outer halo.",
      arShort: "حجر وردي ناعم بقصة كمثرية تحيط به هالة داخلية وردية بلون الذهب الوردي وهالة خارجية شفافة فضية.",
      enDetail: "a blush-pink pear-cut center stone, a scalloped rose-gold pink inner halo, a clear round-stone outer halo, and a three-stone connector",
      arDetail: "حجراً مركزياً وردياً بقصة كمثرية وهالة داخلية وردية متعرجة بلون الذهب الوردي وهالة خارجية من الفصوص الشفافة مع وصلة ثلاثية الأحجار"
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
  if (/BB66/.test(sourceCode)) {
    return {
      enTitle: "Aqua Blue Halo Gemstone",
      arTitle: "بحجر أزرق مائي محاط بفصوص لامعة",
      enShort: "A vivid aqua-blue center gemstone is framed by a clear halo and refined pavé shoulders.",
      arShort: "حجر مركزي أزرق مائي لافت تحيط به هالة شفافة مع جوانب مرصعة بفصوص دقيقة.",
      enDetail: "an aqua-blue oval-round center stone, a clear round-stone halo, split pavé shoulders, and a polished silver band",
      arDetail: "حجراً مركزياً أزرق مائياً بقصة بيضاوية مستديرة وهالة من الفصوص الشفافة مع جوانب مزدوجة مرصعة وإطار فضي مصقول"
    };
  }
  if (/BB84/.test(sourceCode)) {
    return {
      enTitle: "Oval Clear Halo Gemstone",
      arTitle: "بحجر شفاف بيضاوي وهالة لامعة",
      enShort: "An elongated clear oval center stone is framed by a delicate halo and refined pavé shoulders.",
      arShort: "حجر مركزي شفاف بقصة بيضاوية طويلة تحيط به هالة ناعمة مع جوانب مرصعة بفصوص دقيقة.",
      enDetail: "an elongated clear oval center stone, a fine round-stone halo, slim pavé shoulders, and a polished silver-tone band",
      arDetail: "حجراً مركزياً شفافاً بقصة بيضاوية طويلة وهالة دقيقة من الفصوص الدائرية مع جوانب مرصعة وإطار مصقول بلون فضي"
    };
  }
  if (/BB54/.test(sourceCode)) {
    return {
      enTitle: "Royal Blue Pear Double-Halo Drop",
      arTitle: "متدلية بحجر أزرق ملكي كمثري وهالة مزدوجة",
      enShort: "Deep royal-blue pear gemstones are framed by connected clear-stone drop settings for an elegant evening accent.",
      arShort: "أحجار زرقاء ملكية بقصة كمثرية تحيط بها طبقات من الفصوص الشفافة لإطلالة مسائية أنيقة.",
      enDetail: "deep royal-blue pear-cut center stones, connected clear-stone inner and outer pear settings, articulated connectors, and clear-stone stud tops",
      arDetail: "أحجاراً مركزية زرقاء ملكية بقصة كمثرية وإطارات داخلية وخارجية مترابطة مرصعة بفصوص شفافة مع وصلات متحركة وأجزاء علوية مرصعة"
    };
  }
  if (/BB65/.test(sourceCode)) {
    return {
      enTitle: "Clear Pavé Cluster",
      arTitle: "مرصع بتجمعات من الفصوص الشفافة",
      enShort: "A dense line of clear stones creates a delicate textured brilliance for everyday styling.",
      arShort: "صف كثيف من الفصوص الشفافة يمنح لمعاناً ناعماً وملمساً أنيقاً للإطلالات اليومية.",
      enDetail: "a dense alternating line of clear round stones, a flexible central section, fine chain ends, and an adjustable extension",
      arDetail: "صفاً كثيفاً ومتدرجاً من الفصوص الدائرية الشفافة وقسماً مركزياً مرناً مع أطراف سلسلة رفيعة ووصلة قابلة للتعديل"
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
  if (sourceCode === "BB84") {
    const currentReference = path.join("image", "珠宝拍摄图片", "BB84.png");
    if (await exists(path.join(root, currentReference))) return currentReference;
  }
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
