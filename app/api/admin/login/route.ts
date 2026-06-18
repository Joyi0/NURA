import {
  adminCredentials,
  adminSessionCookieHeader,
  clearAdminSessionCookieHeader,
  createAdminSession
} from "@/lib/admin/auth";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  const body =
    contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")
      ? Object.fromEntries(await request.formData())
      : await request.json().catch(() => ({}));
  const username = String(body.username || "").trim();
  const password = String(body.password || "");
  const wantsHtml = contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data");

  const credentials = adminCredentials();
  if (username !== credentials.username || password !== credentials.password) {
    if (wantsHtml) return Response.redirect(new URL("/nura-admin?error=1", request.url), 303);
    return Response.json({ error: "账号或密码错误。" }, { status: 401 });
  }

  const cookie = adminSessionCookieHeader(createAdminSession(username));
  if (wantsHtml) {
    return new Response(null, {
      status: 303,
      headers: {
        Location: "/nura-admin/dashboard",
        "Set-Cookie": cookie
      }
    });
  }

  const response = Response.json({ ok: true });
  response.headers.append("Set-Cookie", cookie);
  return response;
}

export async function DELETE() {
  const response = Response.json({ ok: true });
  response.headers.append("Set-Cookie", clearAdminSessionCookieHeader());
  return response;
}
