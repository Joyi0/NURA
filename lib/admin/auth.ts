import { cookies } from "next/headers";

export const adminSessionCookie = "nura_admin_session";
export const adminSessionValue = "admin";
export const adminUsername = "admin";
export const adminPassword = "123456";

export function assertAdmin(request: Request) {
  const session = request.headers.get("cookie") || "";
  if (session.split(";").some((item) => item.trim() === `${adminSessionCookie}=${adminSessionValue}`)) {
    return null;
  }

  const expected = process.env.ADMIN_PASSWORD || adminPassword;
  const provided = request.headers.get("x-admin-password");
  if (!provided || provided !== expected) {
    return Response.json({ error: "未授权，请先输入后台密码。" }, { status: 401 });
  }
  return null;
}

export async function requireAdminPage() {
  const store = await cookies();
  return store.get(adminSessionCookie)?.value === adminSessionValue;
}
