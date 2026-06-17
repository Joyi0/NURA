import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outputRoot = path.join(root, "outputs", "social-drafts");
const statePath = path.join(outputRoot, ".state.json");

const CANVAS = { width: 1080, height: 1350 };
const imageSlots = [
  {
    slug: "scene-marble-vanity",
    label: "Scene image: marble vanity",
    kind: "scene",
    pillar: "Product Desire",
    scene: "jewelry placed naturally on a warm white marble vanity with a cream silk ribbon, soft morning light, a subtle perfume bottle in the background, premium editorial product photography"
  },
  {
    slug: "scene-gift-table",
    label: "Scene image: gift-ready table",
    kind: "scene",
    pillar: "Product Desire",
    scene: "gift-ready jewelry scene on an ivory table with a small NURA-style jewelry box, soft gold wrapping detail, warm white background, elegant Middle Eastern soft luxury mood"
  },
  {
    slug: "scene-soft-neutral-outfit",
    label: "Scene image: soft neutral outfit",
    kind: "scene",
    pillar: "Everyday Luxury",
    scene: "jewelry styled beside a folded white shirt, soft beige fabric, black evening fabric accent, and warm gold details, polished fashion flat lay"
  },
  {
    slug: "model-daylight-closeup",
    label: "Model wearing image: daylight close-up",
    kind: "model",
    pillar: "Styling Guidance",
    scene: "close-up crop of a modern Middle Eastern woman wearing the jewelry in soft daylight, cream blouse, natural skin texture, elegant minimal styling, face partially cropped to focus on the accessory"
  },
  {
    slug: "model-evening-neutral",
    label: "Model wearing image: evening neutral",
    kind: "model",
    pillar: "Brand Trust",
    scene: "editorial model wearing the jewelry with a black or ivory evening outfit, warm indoor light, understated luxury, accessory clearly visible, refined and realistic"
  },
  {
    slug: "model-styling-detail",
    label: "Model wearing image: styling detail",
    kind: "model",
    pillar: "Conversion Posts",
    scene: "detail crop of the jewelry being worn while adjusting a sleeve, hair, neckline, or hand pose depending on jewelry category, soft neutral background, natural lifestyle editorial photo"
  }
];

const categoryCopy = {
  NECKLACE: { label: "Necklace", hashtags: ["#goldnecklace", "#everydayjewelry"], productName: "NURA Gemstone Necklace" },
  EARRING: { label: "Earrings", hashtags: ["#goldearrings", "#jewelryedit"], productName: "NURA Gemstone Earrings" },
  BRACELET: { label: "Bracelet", hashtags: ["#goldbracelet", "#minimaljewelry"], productName: "NURA Gold Bracelet" },
  RING: { label: "Ring", hashtags: ["#goldring", "#ringstack"], productName: "NURA Gemstone Ring" }
};

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const simulate = Number(readArg("--simulate") || 0);
const dateArg = readArg("--date");
const skuArg = readArg("--sku");
const today = dateArg || new Date().toISOString().slice(0, 10);

await loadEnv();

const { PrismaClient } = await import("@prisma/client");
const prisma = new PrismaClient();

try {
  if (dryRun) {
    const products = await loadCandidateProducts();
    const state = await readState();
    const next = products.length > 0 ? selectNextProduct(products, state) : null;
    console.log(JSON.stringify({ ok: true, candidateCount: products.length, next: next ? publicProduct(next) : null }, null, 2));
  } else if (simulate > 0) {
    await simulateSelection(simulate);
  } else {
    const result = await generateDailyDraft(today, skuArg);
    console.log(JSON.stringify(result, null, 2));
  }
} finally {
  await prisma.$disconnect();
}

async function generateDailyDraft(date, requestedSku = null) {
  const products = await loadCandidateProducts();
  if (products.length === 0) {
    return { ok: false, reason: "No products with images were found. No draft was generated." };
  }

  const state = await readState();
  const product = requestedSku
    ? products.find((item) => item.sku === requestedSku || item.sourceCode === requestedSku)
    : selectNextProduct(products, state);
  if (!product) {
    return { ok: false, reason: `No product with images matched ${requestedSku}. No draft was generated.` };
  }
  const sourceImage = chooseSourceImage(product);
  const productName = displayName(product);
  const category = categoryCopy[product.category] || categoryCopy.EARRING;
  const productUrl = product.id ? `/en/products/${product.id}` : "/en/products";
  const skuDir = path.join(outputRoot, date, safeSegment(product.sku));
  await fs.mkdir(skuDir, { recursive: true });

  const reviewFlags = reviewFlagsFor(product, sourceImage);
  const imageResults = [];

  for (let index = 0; index < imageSlots.length; index += 1) {
    const slot = imageSlots[index];
    const prompt = imagePrompt({ product, productName, category, slot, sourceImage });
    const filename = `image-${String(index + 1).padStart(2, "0")}-${slot.slug}.png`;
    const targetPath = path.join(skuDir, filename);
    const imageResult = await generateImage({
      product,
      productName,
      category,
      slot,
      sourceImage,
      prompt,
      targetPath,
      index
    });
    imageResults.push({ ...imageResult, filename, prompt, slot: slot.label, pillar: slot.pillar });
  }

  const instagramCaption = buildInstagramCaption({ product, productName, category, productUrl });
  const facebookCaption = buildFacebookCaption({ product, productName, category, productUrl });
  const metadata = {
    generatedAt: new Date().toISOString(),
    date,
    mode: "draft-only",
    imageProvider: imageResults.some((item) => item.provider === "openai") ? "openai" : "local-branded-renderer",
    product: publicProduct(product),
    sourceImage: sourceImage ? publicImage(sourceImage) : null,
    reviewFlags,
    publishing: {
      instagram: "Manual review required before posting.",
      facebook: "Manual review required before posting.",
      arabicNote: "Arabic short phrase is a candidate only. Human proofreading required before publishing."
    },
    productUrl,
    images: imageResults
  };

  await fs.writeFile(path.join(skuDir, "instagram-caption.md"), instagramCaption);
  await fs.writeFile(path.join(skuDir, "facebook-caption.md"), facebookCaption);
  await fs.writeFile(path.join(skuDir, "metadata.json"), `${JSON.stringify(metadata, null, 2)}\n`);

  if (!requestedSku) {
    state.history = Array.isArray(state.history) ? state.history : [];
    state.history.push({ date, productId: product.id, sku: product.sku, outputDir: path.relative(root, skuDir), generatedAt: metadata.generatedAt });
    state.history = state.history.slice(-Math.max(products.length, 120));
    await writeState(state);
  }

  return {
    ok: true,
    sku: product.sku,
    product: productName,
    outputDir: path.relative(root, skuDir),
    reviewFlags,
    files: ["instagram-caption.md", "facebook-caption.md", "metadata.json", ...imageResults.map((item) => item.filename)]
  };
}

async function loadCandidateProducts() {
  const products = await prisma.product.findMany({
    where: {
      images: {
        some: {
          type: "WARMWHITE"
        }
      }
    },
    include: { images: true },
    orderBy: [{ createdAt: "asc" }, { sku: "asc" }]
  });
  return products.filter((product) => product.images.some(isWarmwhiteProductImage));
}

function selectNextProduct(products, state) {
  const generatedIds = new Set((state.history || []).map((item) => item.productId));
  return products.find((product) => !generatedIds.has(product.id)) || products[0];
}

async function simulateSelection(count) {
  const products = await loadCandidateProducts();
  const currentState = await readState();
  const state = { history: [...(currentState.history || [])] };
  const picks = [];
  for (let index = 0; index < count; index += 1) {
    const product = selectNextProduct(products, state);
    if (!product) break;
    picks.push(publicProduct(product));
    state.history.push({ productId: product.id, sku: product.sku });
  }
  console.log(JSON.stringify({ ok: true, count: picks.length, picks }, null, 2));
}

function chooseSourceImage(product) {
  const sorted = product.images.filter(isWarmwhiteProductImage).sort((a, b) => {
    const folderWeight = warmwhiteFolderWeight(a.path) - warmwhiteFolderWeight(b.path);
    if (folderWeight) return folderWeight;
    const approved = Number(b.approved) - Number(a.approved);
    if (approved) return approved;
    return a.sortOrder - b.sortOrder;
  });
  return sorted[0] || null;
}

function isWarmwhiteProductImage(image) {
  return image.type === "WARMWHITE" && /product-warmwhite/i.test(image.path);
}

function warmwhiteFolderWeight(imagePath) {
  if (imagePath.includes("image/暖白产品图/")) return 0;
  if (imagePath.includes("image/产品提取图/")) return 1;
  return 2;
}

async function generateImage({ product, productName, category, slot, sourceImage, prompt, targetPath, index }) {
  const useOpenAi = process.env.NURA_SOCIAL_IMAGE_PROVIDER === "openai" && Boolean(process.env.OPENAI_API_KEY);
  if (useOpenAi && sourceImage) {
    try {
      await generateOpenAiImage({ sourceImage, prompt, targetPath });
      return { path: path.relative(root, targetPath), provider: "openai", needsReview: true };
    } catch (error) {
      console.warn(`OpenAI image generation failed for ${slot.slug}; using local renderer. ${error.message}`);
    }
  }

  const supportingImage = chooseSupportingImage(product, slot, index);
  const provider = await renderLocalImage({ product, slot, sourceImage, supportingImage, targetPath, index });
  return {
    path: path.relative(root, targetPath),
    provider,
    needsReview: true,
    supportingImage: supportingImage ? publicImage(supportingImage) : null
  };
}

async function generateOpenAiImage({ sourceImage, prompt, targetPath }) {
  const absoluteSource = path.join(root, sourceImage.path);
  const bytes = await fs.readFile(absoluteSource);
  const form = new FormData();
  form.append("model", process.env.OPENAI_IMAGE_MODEL || "gpt-image-1");
  form.append("prompt", prompt);
  form.append("size", process.env.OPENAI_IMAGE_SIZE || "1024x1536");
  form.append("image", new Blob([bytes]), path.basename(absoluteSource));

  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: form
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text.slice(0, 240)}`);
  }
  const data = await response.json();
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI response did not include b64_json image data.");
  await sharp(Buffer.from(b64, "base64")).resize(CANVAS.width, CANVAS.height, { fit: "cover" }).png().toFile(targetPath);
}

function chooseSupportingImage(product, slot, index) {
  if (slot.kind === "model") {
    const modelImages = product.images
      .filter((image) => image.type === "MODEL_WEAR")
      .sort((a, b) => a.sortOrder - b.sortOrder || a.path.localeCompare(b.path));
    return modelImages.length > 0 ? modelImages[(index - 3) % modelImages.length] : null;
  }
  const sceneImages = product.images
    .filter((image) => image.type === "SCENE")
    .sort((a, b) => a.sortOrder - b.sortOrder || a.path.localeCompare(b.path));
  return sceneImages.length > 0 ? sceneImages[index % sceneImages.length] : null;
}

async function renderLocalImage({ product, slot, sourceImage, supportingImage, targetPath, index }) {
  if (slot.kind === "model" && supportingImage) {
    await renderExistingPhoto({ supportingImage, targetPath });
    return "existing-model-wear";
  }

  const bg = supportingImage
    ? await scenePhotoBackdrop(supportingImage)
    : sceneBackdropSvg(index);
  const imageBuffer = sourceImage ? await fs.readFile(path.join(root, sourceImage.path)) : null;
  const placement = productPlacement(product.category, slot.kind, index);
  const productComposite = imageBuffer
    ? await createProductCutout(imageBuffer, placement)
    : null;

  const overlays = [
    { input: Buffer.from(bg), top: 0, left: 0 },
    ...(productComposite ? [{ input: productComposite, top: placement.top, left: placement.left }] : [])
  ];

  await sharp({
    create: {
      width: CANVAS.width,
      height: CANVAS.height,
      channels: 4,
      background: "#FAFAF7"
    }
  })
    .composite(overlays)
    .png()
    .toFile(targetPath);
  return supportingImage ? "warmwhite-cutout-on-existing-scene" : "warmwhite-cutout-local-scene";
}

async function renderExistingPhoto({ supportingImage, targetPath }) {
  await sharp(path.join(root, supportingImage.path))
    .rotate()
    .resize(CANVAS.width, CANVAS.height, { fit: "cover", position: "attention" })
    .modulate({ brightness: 1.02, saturation: 0.96 })
    .png()
    .toFile(targetPath);
}

async function scenePhotoBackdrop(supportingImage) {
  const photo = await sharp(path.join(root, supportingImage.path))
    .rotate()
    .resize(CANVAS.width, CANVAS.height, { fit: "cover", position: "attention" })
    .blur(5)
    .modulate({ brightness: 1.08, saturation: 0.84 })
    .png()
    .toBuffer();

  const veil = Buffer.from(`
<svg width="${CANVAS.width}" height="${CANVAS.height}" viewBox="0 0 ${CANVAS.width} ${CANVAS.height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="1080" height="1350" fill="#FAFAF7" opacity="0.48"/>
  <rect x="80" y="95" width="920" height="1160" fill="#FFFFFF" opacity="0.20"/>
  <circle cx="830" cy="270" r="145" fill="#D4AF37" opacity="0.08"/>
</svg>`);

  return await sharp({
    create: {
      width: CANVAS.width,
      height: CANVAS.height,
      channels: 4,
      background: "#FAFAF7"
    }
  })
    .composite([{ input: photo, top: 0, left: 0 }, { input: veil, top: 0, left: 0 }])
    .png()
    .toBuffer();
}

async function createProductCutout(imageBuffer, placement) {
  const normalized = sharp(imageBuffer).rotate().ensureAlpha();
  const { data, info } = await normalized.raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.from(data);

  for (let index = 0; index < out.length; index += 4) {
    const r = out[index];
    const g = out[index + 1];
    const b = out[index + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const isWhiteBackground = min > 244 && max - min < 12;
    const isNearWhiteBackground = min > 250;

    if (isWhiteBackground || isNearWhiteBackground) {
      out[index + 3] = 0;
    } else if (min > 235 && max - min < 18) {
      out[index + 3] = Math.min(out[index + 3], 90);
    }
  }

  return sharp(out, { raw: info })
    .trim({ background: { r: 255, g: 255, b: 255, alpha: 0 }, threshold: 8 })
    .resize({ width: placement.width, height: placement.height, fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer();
}

function sceneBackdropSvg(index) {
  const palette = [
    { base: "#FAFAF7", surface: "#FFFFFF", accent: "#D4AF37", prop: "perfume" },
    { base: "#F8F4EA", surface: "#FFFDF8", accent: "#C8A96A", prop: "gift" },
    { base: "#F6F0E6", surface: "#FFFFFF", accent: "#1A1A1A", prop: "outfit" }
  ][index] || { base: "#FAFAF7", surface: "#FFFFFF", accent: "#D4AF37", prop: "perfume" };
  return `
<svg width="${CANVAS.width}" height="${CANVAS.height}" viewBox="0 0 ${CANVAS.width} ${CANVAS.height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="20" stdDeviation="28" flood-color="#7B6A4E" flood-opacity="0.16"/>
    </filter>
    <linearGradient id="silk" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FFFFFF"/>
      <stop offset="1" stop-color="#EFE5D4"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1350" fill="${palette.base}"/>
  <rect x="88" y="120" width="904" height="1090" rx="0" fill="${palette.surface}" filter="url(#shadow)"/>
  <path d="M80 760 C250 610 390 710 520 570 C650 430 840 470 1005 330 L1005 1230 L80 1230 Z" fill="url(#silk)" opacity="0.58"/>
  <circle cx="825" cy="265" r="142" fill="${palette.accent}" opacity="0.08"/>
  <circle cx="245" cy="1060" r="118" fill="#C8A96A" opacity="0.07"/>
  ${scenePropSvg(palette.prop)}
</svg>`;
}

function scenePropSvg(prop) {
  if (prop === "gift") {
    return `
  <rect x="650" y="238" width="238" height="155" rx="10" fill="#F8F1E6" stroke="#D8C7A1" stroke-width="3" opacity="0.9"/>
  <line x1="650" y1="314" x2="888" y2="314" stroke="#C8A96A" stroke-width="5" opacity="0.72"/>
  <line x1="769" y1="238" x2="769" y2="393" stroke="#C8A96A" stroke-width="5" opacity="0.72"/>`;
  }
  if (prop === "outfit") {
    return `
  <path d="M135 245 L520 190 L558 470 L170 525 Z" fill="#FFFFFF" stroke="#E6DDCF" stroke-width="3" opacity="0.95"/>
  <path d="M708 780 C806 690 910 735 960 850 L960 1180 L690 1180 Z" fill="#1A1A1A" opacity="0.9"/>`;
  }
  return `
  <rect x="705" y="250" width="128" height="220" rx="34" fill="#EFE8DC" stroke="#D8C7A1" stroke-width="3" opacity="0.94"/>
  <rect x="735" y="210" width="68" height="58" rx="14" fill="#D8C7A1" opacity="0.62"/>
  <circle cx="806" cy="500" r="74" fill="#FFFFFF" opacity="0.5"/>`;
}

function modelBackdropSvg(category, index) {
  const skin = index === 3 ? "#C98F72" : index === 4 ? "#B77B60" : "#D1A082";
  const fabric = index === 4 ? "#1A1A1A" : "#F6F0E6";
  const accessoryGuide = modelAccessoryGuideSvg(category, index);
  return `
<svg width="${CANVAS.width}" height="${CANVAS.height}" viewBox="0 0 ${CANVAS.width} ${CANVAS.height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="24" flood-color="#5D4636" flood-opacity="0.18"/>
    </filter>
  </defs>
  <rect width="1080" height="1350" fill="#FAFAF7"/>
  <rect x="70" y="70" width="940" height="1210" fill="#F8F4EA"/>
  <circle cx="760" cy="250" r="170" fill="#D4AF37" opacity="0.08"/>
  <path d="M335 228 C470 92 690 148 760 328 C833 515 698 674 526 660 C342 645 216 470 258 320 C274 276 297 250 335 228 Z" fill="${skin}" opacity="0.98" filter="url(#softShadow)"/>
  <path d="M306 215 C430 66 702 118 797 300 C714 246 590 240 508 292 C416 350 350 344 266 296 C272 266 285 238 306 215 Z" fill="#2B211C" opacity="0.9"/>
  <path d="M252 700 C408 620 676 620 828 700 C910 760 968 940 978 1280 L112 1280 C126 940 178 760 252 700 Z" fill="${fabric}" opacity="0.96"/>
  <path d="M400 648 C470 735 608 734 682 648 L700 850 C622 918 456 918 382 850 Z" fill="${skin}" opacity="0.98"/>
  ${accessoryGuide}
</svg>`;
}

function modelAccessoryGuideSvg(category, index) {
  if (category === "NECKLACE") {
    return `<path d="M408 650 C478 770 610 772 680 650" fill="none" stroke="#D4AF37" stroke-width="8" opacity="0.42"/>`;
  }
  if (category === "BRACELET") {
    return `<path d="M740 815 C815 858 870 930 895 1018" fill="none" stroke="#D1A082" stroke-width="62" stroke-linecap="round" opacity="0.98"/>
    <ellipse cx="856" cy="950" rx="58" ry="24" fill="none" stroke="#D4AF37" stroke-width="9" opacity="0.45"/>`;
  }
  if (category === "RING") {
    return `<path d="M742 838 C820 890 880 976 910 1075" fill="none" stroke="#D1A082" stroke-width="58" stroke-linecap="round" opacity="0.98"/>
    <circle cx="894" cy="1050" r="20" fill="none" stroke="#D4AF37" stroke-width="7" opacity="0.5"/>`;
  }
  return `<circle cx="762" cy="438" r="28" fill="none" stroke="#D4AF37" stroke-width="8" opacity="0.42"/>`;
}

function productPlacement(category, kind, index) {
  if (kind === "scene") {
    return [
      { width: 560, height: 560, top: 430, left: 260 },
      { width: 500, height: 500, top: 520, left: 292 },
      { width: 520, height: 520, top: 440, left: 278 }
    ][index] || { width: 520, height: 520, top: 430, left: 280 };
  }

  if (category === "NECKLACE") return { width: 360, height: 360, top: 618, left: 360 };
  if (category === "BRACELET") return { width: 300, height: 300, top: 820, left: 700 };
  if (category === "RING") return { width: 220, height: 220, top: 940, left: 770 };
  return [
    { width: 210, height: 210, top: 372, left: 682 },
    { width: 220, height: 220, top: 390, left: 684 },
    { width: 200, height: 200, top: 382, left: 692 }
  ][index - 3] || { width: 210, height: 210, top: 382, left: 690 };
}

function imagePrompt({ product, productName, category, slot, sourceImage }) {
  const status = product.status === "ACTIVE" ? "published product" : "draft product requiring manual review";
  return [
    "Use case: ads-marketing",
    "Asset type: Instagram and Facebook 4:5 feed image, 1080x1350 final crop",
    `Primary request: Create a photorealistic NURA soft-luxury jewelry ${slot.kind === "model" ? "model wearing image" : "lifestyle scene image"} for ${slot.label}.`,
    `Input image: ${sourceImage?.path || "none"} is the exact product identity reference. Preserve the jewelry category, silhouette, gemstone placement, metal tone, proportions, and recognisable product details.`,
    `Subject: ${productName}, ${category.label}, SKU ${product.sku}, ${status}.`,
    `Scene/backdrop: ${slot.scene}.`,
    "Brand style: warm white, ivory, soft beige, clean gold accents, modern Middle Eastern feminine elegance, realistic editorial photography, premium but understated.",
    "Composition: no headline, no caption text, no discount badge, no watermark. The image should look like a real Instagram feed photo, not a graphic poster.",
    "Model requirements when applicable: realistic adult model, tasteful close crop, accessory clearly worn in the correct place for its category, natural skin texture, no exaggerated glam retouching.",
    "Scene requirements when applicable: varied props and environments across the set, product naturally integrated into the scene, not pasted onto a blank square.",
    "Avoid: black heavy luxury background, saturated colors, red discount visuals, cheap collage, sparkle rain, exaggerated filters, product deformation, fake extra stones, incorrect jewelry category, unreadable hands, distorted ears, distorted neck, distorted jewelry."
  ].join("\n");
}

function buildInstagramCaption({ product, productName, category, productUrl }) {
  const hashtags = ["#NURAJewelry", ...category.hashtags, "#softluxury", "#dubaistyle"].slice(0, 5);
  return `${firstHook(product.category)} ${productName} is made for quiet daily shine.\n\n${sentenceStart(category)} for soft neutrals, clean lines, and everyday elegance. Wear it from morning coffee to evening plans.\n\nArabic short phrase candidate: فخامة ناعمة\nPublishing note: Arabic copy requires human proofreading before posting.\n\nCTA: Tap the link in bio to discover the piece.\nProduct link: ${productUrl}\n\n${hashtags.join(" ")}\n`;
}

function buildFacebookCaption({ productName, category, productUrl }) {
  return `Everyday gold, softly refined.\n\n${productName} brings a quiet golden detail to daily styling. It is designed for polished outfits, soft neutral palettes, and moments that do not need to feel loud.\n\nWhy it works:\n- Refined ${category.label.toLowerCase()} styling for everyday wear\n- Warm gold-toned presence with a clean NURA visual finish\n- Gift-ready mood for simple, elegant occasions\n\nPlease review product availability, material notes, and Arabic copy before publishing.\n\nExplore NURA online: ${productUrl}\n\n#NURAJewelry #softluxury\n`;
}

function firstHook(category) {
  if (category === "NECKLACE") return "Your everyday gold starts here.";
  if (category === "BRACELET") return "Soft luxury, made wearable.";
  if (category === "RING") return "A small golden detail finishes the look.";
  return "A soft gold accent for polished everyday dressing.";
}

function sentenceStart(category) {
  if (category.label === "Earrings") return "A polished pair of earrings";
  return `A polished ${category.label.toLowerCase()}`;
}

function reviewFlagsFor(product, sourceImage) {
  const flags = [];
  if (product.status !== "ACTIVE") flags.push(`Product status is ${product.status}; confirm it should be promoted.`);
  if (!sourceImage) flags.push("No warmwhite product image was found; do not publish until a warmwhite extraction exists.");
  if (sourceImage && !sourceImage?.approved) flags.push("Warmwhite source image is not approved/public; check product accuracy before publishing.");
  if (!product.titleEn && !product.detailEn) flags.push("English product copy is sparse; caption uses generated brand copy.");
  if (product.stock <= 0) flags.push("Stock is 0 or not set; confirm availability before publishing.");
  flags.push("Images are generated from the warmwhite product extraction and require visual review before Instagram/Facebook posting.");
  flags.push("Arabic phrase is a candidate only; human proofreading required.");
  return flags;
}

function displayName(product) {
  if (product.titleEn) return product.titleEn;
  const category = categoryCopy[product.category] || categoryCopy.EARRING;
  return product.sourceCode ? `${category.productName} ${product.sourceCode}` : product.name;
}

function publicProduct(product) {
  return {
    id: product.id,
    sku: product.sku,
    sourceCode: product.sourceCode,
    category: product.category,
    name: product.name,
    titleEn: product.titleEn,
    status: product.status,
    stock: product.stock,
    imageCount: product.images?.length ?? undefined
  };
}

function publicImage(image) {
  return { id: image.id, type: image.type, path: image.path, approved: image.approved, sortOrder: image.sortOrder };
}

async function readState() {
  try {
    return JSON.parse(await fs.readFile(statePath, "utf8"));
  } catch {
    return { history: [] };
  }
}

async function writeState(state) {
  await fs.mkdir(outputRoot, { recursive: true });
  await fs.writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`);
}

async function loadEnv() {
  const envPath = path.join(root, ".env");
  try {
    const content = await fs.readFile(envPath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (process.env[key] !== undefined) continue;
      process.env[key] = rawValue.replace(/^["']|["']$/g, "");
    }
  } catch {
    // The script can still run if DATABASE_URL is provided by the environment.
  }
}

function readArg(name) {
  const direct = process.argv.find((arg) => arg.startsWith(`${name}=`));
  if (direct) return direct.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1] || null;
}

function safeSegment(value) {
  return String(value).replace(/[^A-Za-z0-9._-]+/g, "-");
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
