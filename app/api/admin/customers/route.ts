import { assertAdmin } from "@/lib/admin/auth";
import { formatAed } from "@/lib/shared/money";
import { prisma } from "@/lib/shared/prisma";

export async function GET(request: Request) {
  const auth = assertAdmin(request);
  if (auth) return auth;

  const orders = await prisma.order.findMany({
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "desc" }
  });
  const contacts = new Map<string, {
    contact: string;
    email: string | null;
    phone: string | null;
    orderCount: number;
    totalSpend: number;
    lastOrderAt: Date;
    categories: Map<string, number>;
  }>();

  for (const order of orders) {
    const key = order.email || order.phone;
    if (!key) continue;
    const current = contacts.get(key) || {
      contact: key,
      email: order.email,
      phone: order.phone,
      orderCount: 0,
      totalSpend: 0,
      lastOrderAt: order.createdAt,
      categories: new Map<string, number>()
    };
    current.orderCount += 1;
    current.totalSpend += order.total;
    if (order.createdAt > current.lastOrderAt) current.lastOrderAt = order.createdAt;
    for (const item of order.items) {
      const category = item.product.category;
      current.categories.set(category, (current.categories.get(category) || 0) + item.quantity);
    }
    contacts.set(key, current);
  }

  return Response.json({
    customers: [...contacts.values()].map((customer) => ({
      key: customer.contact,
      email: customer.email,
      phone: customer.phone,
      orderCount: customer.orderCount,
      totalSpend: formatAed(customer.totalSpend),
      lastOrderAt: customer.lastOrderAt,
      preferredCategory: [...customer.categories.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "-",
      tags: customer.orderCount > 1 ? ["已下单", "复购用户"] : ["已下单"]
    }))
  });
}
