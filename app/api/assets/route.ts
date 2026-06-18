import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

const allowedRoot = path.join(process.cwd(), "image");

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requested = url.searchParams.get("path");
  if (!requested) return new Response("Missing path", { status: 400 });
  if (/^https?:\/\//i.test(requested)) return Response.redirect(requested);

  if (!requested.startsWith("image/")) return new Response("Forbidden", { status: 403 });

  const relativeInsideImage = requested.slice("image/".length);
  const absolute = path.resolve(allowedRoot, relativeInsideImage);
  if (!absolute.startsWith(allowedRoot + path.sep)) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    await stat(absolute);
    const stream = Readable.toWeb(createReadStream(absolute)) as ReadableStream;
    return new Response(stream, {
      headers: {
        "content-type": contentType(absolute),
        "cache-control": "public, max-age=3600"
      }
    });
  } catch {
    return Response.redirect(new URL("/placeholder.svg", request.url));
  }
}

function contentType(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".svg") return "image/svg+xml";
  return "image/jpeg";
}
