import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const adminSessionCookie = "nura_admin_session";
const sessionLifetimeSeconds = 24 * 60 * 60;

export function adminCredentials() {
  const username = process.env.ADMIN_USERNAME || (process.env.NODE_ENV === "production" ? "" : "admin");
  const password = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === "production" ? "" : "123456");
  if (!username || !password) throw new Error("ADMIN_USERNAME and ADMIN_PASSWORD must be configured.");
  return { username, password };
}

export function createAdminSession(username: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + sessionLifetimeSeconds;
  const payload = `${username}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

export function adminSessionCookieHeader(value: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${adminSessionCookie}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${sessionLifetimeSeconds}${secure}`;
}

export function clearAdminSessionCookieHeader() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${adminSessionCookie}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

export function assertAdmin(request: Request) {
  const session = readCookie(request.headers.get("cookie") || "", adminSessionCookie);
  if (session && verifyAdminSession(session)) return null;

  const provided = request.headers.get("x-admin-password");
  if (provided && safeEqual(provided, adminCredentials().password)) return null;
  return Response.json({ error: "未授权，请先登录后台。" }, { status: 401 });
}

export async function requireAdminPage() {
  const store = await cookies();
  const session = store.get(adminSessionCookie)?.value;
  return Boolean(session && verifyAdminSession(session));
}

function verifyAdminSession(value: string) {
  const [username, expiresAtRaw, signature] = value.split(".");
  if (!username || !expiresAtRaw || !signature) return false;
  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) return false;
  const expectedUsername = adminCredentials().username;
  if (!safeEqual(username, expectedUsername)) return false;
  return safeEqual(signature, sign(`${username}.${expiresAtRaw}`));
}

function sign(payload: string) {
  const secret = process.env.AUTH_SECRET || (process.env.NODE_ENV === "production" ? "" : "nura-local-development-secret");
  if (!secret) throw new Error("AUTH_SECRET must be configured.");
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function readCookie(header: string, name: string) {
  for (const part of header.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return value.join("=");
  }
  return null;
}
