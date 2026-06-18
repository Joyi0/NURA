import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import sharp from "sharp";

const root = process.cwd();
const sourceCode = String(process.argv[2] || "").trim().toUpperCase();
const dryRun = process.argv.includes("--dry-run");
const force = process.argv.includes("--force");
const userNotes = readOption("--notes");
const model = "gpt-image-2";
const quality = "high";
const imageCli =
  process.env.IMAGE_GEN_CLI ||
  path.join(
    process.env.CODEX_HOME || path.join(process.env.HOME || "", ".codex"),
    "skills",
    ".system",
    "imagegen",
    "scripts",
    "image_gen.py"
  );

if (!/^BB\d+$/i.test(sourceCode)) {
  fail('Usage: npm run images:generate-four -- BB10 [--notes "product details"] [--dry-run] [--force]');
}

const env = {
  ...process.env,
  ...(await loadEnvFile(path.join(root, ".env.local")))
};

if (!dryRun && !env.OPENAI_API_KEY) {
  fail("OPENAI_API_KEY is missing. Add it to .env.local before running a paid image generation.");
}

await assertFile(imageCli, "Bundled image_gen.py CLI");
await assertPythonDependency();

const product = await readProduct(sourceCode);
const raw = await findRaw(sourceCode);
const category = inferCategory(product["产品名称"]);
const visual = visualSpec(sourceCode, category, userNotes);
const transactionId = `${sourceCode}-${Date.now()}`;
const workRoot = path.join(root, "outputs", ".image-generation", transactionId);
const stagingRoot = path.join(root, "outputs", "image-staging", sourceCode);
const backupRoot = `${stagingRoot}.backup-${transactionId}`;

const assets = [
  {
    key: "warmwhite",
    suffix: "product-warmwhite",
    size: "2048x2048",
    prompt: warmwhitePrompt(product, visual)
  },
  {
    key: "detail",
    suffix: "detail-01",
    size: "2048x2048",
    prompt: detailPrompt(product, visual)
  },
  {
    key: "scene",
    suffix: "scene-01",
    size: "2048x2048",
    prompt: scenePrompt(product, visual)
  },
  {
    key: "model-wear",
    suffix: "model-wear-01",
    size: "1600x2400",
    prompt: modelPrompt(product, visual, category)
  }
];

try {
  await fs.mkdir(workRoot, { recursive: true });

  for (const asset of assets) {
    const output = path.join(workRoot, `${sourceCode}-${asset.suffix}.png`);
    const images =
      asset.key === "warmwhite"
        ? [raw]
        : [raw, dryRun ? raw : path.join(workRoot, `${sourceCode}-product-warmwhite.png`)];

    await runImageEdit({
      images,
      prompt: asset.prompt,
      size: asset.size,
      output,
      dryRun
    });

    if (!dryRun) await validateGeneratedImage(output, asset.size);
  }

  if (!dryRun) {
    if ((await exists(stagingRoot)) && !force) {
      fail(`Staging directory already exists: ${stagingRoot}. Review it or rerun with --force.`);
    }

    await fs.mkdir(path.dirname(stagingRoot), { recursive: true });
    if (await exists(stagingRoot)) await fs.rename(stagingRoot, backupRoot);

    try {
      await fs.rename(workRoot, stagingRoot);
      await fs.rm(backupRoot, { recursive: true, force: true });
    } catch (error) {
      await fs.rm(stagingRoot, { recursive: true, force: true });
      if (await exists(backupRoot)) await fs.rename(backupRoot, stagingRoot);
      throw error;
    }
  }
} catch (error) {
  await fs.rm(workRoot, { recursive: true, force: true });
  throw error;
}

if (dryRun) {
  await fs.rm(workRoot, { recursive: true, force: true });
  console.log(`Validated four Image API requests for ${sourceCode}; no files or API calls were made.`);
  process.exit(0);
}

console.log(`Generated complete staged four-image set for ${sourceCode}:`);
for (const asset of assets) {
  console.log(path.join(stagingRoot, `${sourceCode}-${asset.suffix}.png`));
}
console.log(`Review all four images against ${raw}, then publish with:`);
console.log(`npm run images:publish-four -- ${sourceCode} --visual-approved`);

async function runImageEdit({ images, prompt, size, output, dryRun }) {
  const args = [
    imageCli,
    "edit",
    "--model",
    model,
    "--quality",
    quality,
    "--size",
    size,
    "--output-format",
    "png",
    "--prompt",
    prompt,
    "--out",
    output,
    "--force",
    "--no-augment"
  ];

  for (const image of images) args.push("--image", image);
  if (dryRun) args.push("--dry-run");

  await run("python3", args, env);
}

async function validateGeneratedImage(file, size) {
  const [width, height] = size.split("x").map(Number);
  const metadata = await sharp(file).metadata();
  const stats = await fs.stat(file);

  if (
    metadata.format !== "png" ||
    metadata.width !== width ||
    metadata.height !== height ||
    stats.size < 100_000
  ) {
    fail(`Generated file failed validation: ${file}`);
  }
}

async function readProduct(code) {
  const productsPath = path.join(root, "outputs", "bb-pricing", "products.json");
  const products = JSON.parse(await fs.readFile(productsPath, "utf8"));
  const product = products.find((item) => String(item["款号"] || "").trim().toUpperCase() === code);
  if (!product) fail(`Product ${code} was not found in ${productsPath}.`);
  return product;
}

async function findRaw(code) {
  const folder = path.join(root, "image", "珠宝拍摄图片");
  for (const extension of [".png", ".jpg", ".jpeg", ".webp"]) {
    const file = path.join(folder, `${code}${extension}`);
    if (await exists(file)) return file;
  }
  fail(`RAW reference image not found for ${code} in ${folder}.`);
}

function inferCategory(name) {
  const value = String(name || "");
  if (/项链/.test(value)) return "necklace";
  if (/手链/.test(value)) return "bracelet";
  if (/戒指/.test(value)) return "ring";
  return "earrings";
}

function visualSpec(code, category, notes) {
  const known = {
    BB10:
      "A matching pair of S925 silver stud earrings. Each earring has one vivid golden-yellow square cushion/princess-cut center gemstone, clear elongated baguette-cut stones along all four sides, and small round clear-stone clusters at the four corners. Preserve the compact geometric square silhouette.",
    BB24:
      "An S925 silver necklace with a pale blush-pink pear-cut center gemstone pointing downward, a rose-gold-tone scalloped inner halo set with small pink stones, a larger clear round-stone outer halo in silver, and a compact three-clear-stone floral connector above the pendant. Preserve the delicate silver chain and layered pear silhouette.",
    BB66:
      "A polished silver ring with one vivid aqua-blue oval-to-round brilliant center gemstone, a single halo of clear round stones, and slim split/double pavé shoulders that merge into the silver band. Preserve the raised four-prong center setting, bright blue-green gemstone color, compact halo, symmetrical pavé shoulders, and exact ring proportions.",
    BB84:
      "A polished silver ring with one large clear colorless elongated oval brilliant center gemstone, a fine single halo of small clear round stones, and slim pavé-set shoulders that merge into a plain polished lower band. Preserve the four-prong center setting, vertically oriented oval silhouette, delicate halo, single-row pavé shoulders, and realistic two-carat visual proportions.",
    BB54:
      "A matching pair of polished silver drop earrings. Each earring has a deep royal-blue pear-cut center gemstone pointing downward, a close inner surround of small clear round stones, a larger pear-shaped outer frame set with clear round stones, and visible structural bridges joining the inner and outer sections into one rigid connected pendant. Above it are a small clear-stone connector and a vertically stacked clear-stone stud top. Preserve the articulated three-part drop construction, connection points, and mirrored pair proportions.",
    BB65:
      "A delicate polished silver adjustable bracelet with a narrow central decorative section made from a dense continuous zigzag line of clear round stones. Preserve the irregular rhythm of slightly larger stones alternating with smaller offset paired stones, minimal gaps, slim width, flexible articulated construction, fine chain sections on both ends, lobster clasp, extension chain, and small round end charm."
  };
  const base =
    known[code] ||
    `The exact ${category} shown in Image 1. Preserve every recognizable gemstone shape, color, setting, metal tone, proportion, connector, chain or fastening detail.`;
  return notes ? `${base} Additional authoritative product notes: ${notes}` : base;
}

function commonReference(product, visual) {
  return `Product: ${sourceCode}, ${product["产品名称"]}. Image 1 is the authoritative RAW product reference. ${visual}`;
}

function warmwhitePrompt(product, visual) {
  return `Use case: product-mockup
Asset type: NURA ecommerce warm-white product image
Primary request: Transform the referenced real product into a photorealistic premium catalog image.
Input images: Image 1 is the authoritative RAW identity and construction reference.
Subject: ${commonReference(product, visual)}
Scene/backdrop: Seamless warm-white #FAFAF7 studio background with only a subtle realistic contact shadow.
Composition/framing: Square image, complete product fully visible, centered, large enough to inspect, generous clean margin.
Lighting/mood: Soft diffused luxury jewelry studio light, accurate gemstone colors and polished metal reflections.
Constraints: Remove hands, fingers, nails, tags, barcode, SKU labels, prices, plastic ties, fabric and clutter. Preserve the exact product category, silhouette, stone layout, colors, metal and proportions. No text, logo or watermark.
Avoid: redesigning the product, changing gemstone cuts or colors, adding stones, changing jewelry category, unrelated jewelry.`;
}

function detailPrompt(product, visual) {
  return `Use case: product-mockup
Asset type: NURA ecommerce macro detail image
Primary request: Create a photorealistic macro detail photograph of the exact referenced product.
Input images: Image 1 is the authoritative RAW reference. Image 2 is the approved warm-white identity reference.
Subject: ${commonReference(product, visual)}
Scene/backdrop: Clean warm-white matte stone surface.
Composition/framing: Square macro close-up showing the most distinctive gemstone cuts, prongs, settings and construction while keeping the product recognizable.
Lighting/mood: Precise softbox macro lighting, crisp facets, realistic reflections and depth.
Constraints: Preserve exact structure and color. No hands, labels, text, logo or watermark.
Avoid: generic halo substitutions, altered stone shapes, extra jewelry, product redesign.`;
}

function scenePrompt(product, visual) {
  return `Use case: product-mockup
Asset type: NURA ecommerce lifestyle scene image
Primary request: Create a photorealistic restrained luxury scene featuring the exact referenced product.
Input images: Image 1 is the authoritative RAW reference. Image 2 is the approved warm-white identity reference.
Subject: ${commonReference(product, visual)}
Scene/backdrop: Warm ivory silk and pale cream stone with minimal styling; no other jewelry.
Composition/framing: Square ecommerce scene, complete product clearly visible and still the primary subject.
Lighting/mood: Soft warm natural window light, delicate shadows, premium editorial jewelry photography.
Constraints: Preserve exact product identity, color, metal and proportions. No text, logo, watermark, packaging or unrelated objects.
Avoid: product deformation, excessive props, different jewelry, dark promotional backgrounds.`;
}

function modelPrompt(product, visual, category) {
  const placement = {
    earrings: "ear and side-neck close-up; one matching earring worn naturally",
    necklace: "neckline and collarbone close-up; necklace centered at a realistic length",
    bracelet: "wrist and hand close-up; bracelet fitted naturally",
    ring: "hand close-up; ring worn on one finger at realistic scale"
  }[category];

  return `Use case: identity-preserve
Asset type: NURA ecommerce model-wear image
Primary request: Create a photorealistic partial model crop wearing the exact referenced product.
Input images: Image 1 is the authoritative RAW product reference. Image 2 is the approved warm-white identity reference.
Subject: ${commonReference(product, visual)} Show a modern adult Middle Eastern woman with natural skin texture and a distinct model, hairstyle, angle and crop from other products.
Composition/framing: Vertical 2:3 image, ${placement}. Do not show a complete front-facing face.
Lighting/mood: Soft natural daylight, warm-neutral interior, realistic editorial photography.
Constraints: Product must be clearly visible, correctly placed, correctly scaled and structurally identical to the references. No other jewelry, text, logo or watermark.
Avoid: duplicated accessories, malformed anatomy, generic substitute jewelry, altered gemstone colors or cuts, plastic skin.`;
}

async function loadEnvFile(file) {
  if (!(await exists(file))) return {};
  const values = {};
  const content = await fs.readFile(file, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[match[1]] = value;
  }

  return values;
}

async function assertPythonDependency() {
  await run("python3", ["-c", "import openai"], env, "Python package 'openai' is not installed.");
}

async function assertFile(file, label) {
  if (!(await exists(file))) fail(`${label} not found: ${file}`);
}

async function run(command, args, childEnv, customError) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env: childEnv,
      stdio: "inherit"
    });
    child.on("error", (error) => reject(new Error(customError || error.message)));
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(customError || `${command} exited with code ${code}.`));
    });
  });
}

function readOption(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return "";
  return String(process.argv[index + 1] || "").trim();
}

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

function fail(message) {
  throw new Error(message);
}
