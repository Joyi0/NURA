import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import sharp from "sharp";

const root = process.cwd();
const sourceCode = String(process.argv[2] || "").trim().toUpperCase();
const visualApproved = process.argv.includes("--visual-approved");
const skipSeed = process.argv.includes("--skip-seed");
const dryRun = process.argv.includes("--dry-run");
const outputRoot = path.resolve(root, process.env.NURA_IMAGE_OUTPUT_ROOT || ".");
const stagingRoot = path.resolve(
  root,
  process.env.NURA_IMAGE_STAGING_DIR || path.join("outputs", "image-staging", sourceCode)
);

if (!/^BB\d+$/i.test(sourceCode)) {
  fail("Usage: npm run images:publish-four -- BB10 --visual-approved");
}

if (!visualApproved) {
  fail("Refusing to publish without --visual-approved after comparing all four images with the RAW reference.");
}

const assets = [
  {
    key: "warmwhite",
    type: "WARMWHITE",
    suffix: "product-warmwhite",
    folder: "暖白产品图",
    width: 2000,
    height: 2000
  },
  {
    key: "detail",
    type: "DETAIL",
    suffix: "detail-01",
    folder: "产品细节图",
    width: 2000,
    height: 2000
  },
  {
    key: "scene",
    type: "SCENE",
    suffix: "scene-01",
    folder: "场景图",
    width: 2000,
    height: 2000
  },
  {
    key: "model-wear",
    type: "MODEL_WEAR",
    suffix: "model-wear-01",
    folder: "模特佩戴图",
    width: 1600,
    height: 2400
  }
];

const stagingFiles = [];
for (const asset of assets) {
  const source = await findStagedFile(asset);
  const metadata = await sharp(source).metadata();
  validateSource(asset, source, metadata);
  stagingFiles.push({ ...asset, source });
}

const transactionId = `${sourceCode}-${Date.now()}`;
const preparedRoot = path.join(root, "outputs", ".image-publish", transactionId);
const preparedFiles = [];

try {
  await fs.mkdir(preparedRoot, { recursive: true });

  for (const asset of stagingFiles) {
    const prepared = path.join(preparedRoot, `${sourceCode}-${asset.suffix}.jpg`);
    await sharp(asset.source)
      .rotate()
      .resize(asset.width, asset.height, { fit: "fill" })
      .flatten({ background: "#FAFAF7" })
      .jpeg({ quality: 94, chromaSubsampling: "4:4:4", mozjpeg: true })
      .toFile(prepared);

    const metadata = await sharp(prepared).metadata();
    const stats = await fs.stat(prepared);
    if (
      metadata.format !== "jpeg" ||
      metadata.width !== asset.width ||
      metadata.height !== asset.height ||
      stats.size < 50_000
    ) {
      fail(`Prepared image failed validation: ${prepared}`);
    }

    preparedFiles.push({ ...asset, prepared });
  }

  if (dryRun) {
    console.log(`Validated complete staged four-image set for ${sourceCode}; dry run made no changes.`);
  } else {
    await publishAtomically(preparedFiles, transactionId, async () => {
      if (!skipSeed) await run("npm", ["run", "seed"]);
    });
  }
} finally {
  await fs.rm(preparedRoot, { recursive: true, force: true });
}

if (dryRun) process.exit(0);

console.log(`Published complete four-image set for ${sourceCode}.`);
for (const asset of assets) {
  console.log(path.posix.join("image", asset.folder, `${sourceCode}-${asset.suffix}.jpg`));
}

async function findStagedFile(asset) {
  const bases = [
    `${sourceCode}-${asset.suffix}`,
    asset.key,
    asset.suffix
  ];
  const extensions = [".png", ".jpg", ".jpeg", ".webp"];

  for (const base of bases) {
    for (const extension of extensions) {
      const candidate = path.join(stagingRoot, `${base}${extension}`);
      if (await exists(candidate)) return candidate;
    }
  }

  fail(`Missing staged ${asset.type} image in ${stagingRoot}.`);
}

function validateSource(asset, source, metadata) {
  if (!["jpeg", "png", "webp"].includes(metadata.format || "")) {
    fail(`Unsupported staged image format: ${source}`);
  }
  if (!metadata.width || !metadata.height) {
    fail(`Unreadable staged image: ${source}`);
  }

  const expectedRatio = asset.width / asset.height;
  const actualRatio = metadata.width / metadata.height;
  if (Math.abs(actualRatio - expectedRatio) > 0.01) {
    fail(
      `${asset.type} must have ${asset.width}:${asset.height} aspect ratio before publishing; got ${metadata.width}x${metadata.height}.`
    );
  }
}

async function publishAtomically(files, transactionId, afterPublish) {
  const operations = [];

  try {
    for (const asset of files) {
      const folder = path.join(outputRoot, "image", asset.folder);
      const target = path.join(folder, `${sourceCode}-${asset.suffix}.jpg`);
      const incoming = `${target}.incoming-${transactionId}`;
      const backup = `${target}.backup-${transactionId}`;
      await fs.mkdir(folder, { recursive: true });
      await fs.copyFile(asset.prepared, incoming);
      operations.push({ target, incoming, backup, hadTarget: await exists(target) });
    }

    for (const operation of operations) {
      if (operation.hadTarget) await fs.rename(operation.target, operation.backup);
      await fs.rename(operation.incoming, operation.target);
    }

    await afterPublish();

    for (const operation of operations) {
      await fs.rm(operation.backup, { force: true });
    }
  } catch (error) {
    for (const operation of [...operations].reverse()) {
      if (await exists(operation.target)) await fs.rm(operation.target, { force: true });
      if (await exists(operation.backup)) await fs.rename(operation.backup, operation.target);
      await fs.rm(operation.incoming, { force: true });
    }
    throw error;
  }
}

async function run(command, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited with code ${code}.`));
    });
  });
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function fail(message) {
  throw new Error(message);
}
