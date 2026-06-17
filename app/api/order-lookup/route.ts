import { prisma } from "@/lib/shared/prisma";
import { maskEmail, maskPhone, normalizeContact, paymentLabel, fulfillmentLabel } from "@/lib/shared/orders";
import { formatAed } from "@/lib/shared/money";

export async function POST(request: Request) {
  const body = await request.json();
  const contact = normalizeContact(String(body.contact || ""));
  if (!contact) return Response.json({ error: "Missing contact" }, { status: 400 });
  const compactPhone = contact.replace(/[^\d]/g, "");
  const localPhone = compactPhone.startsWith("971") ? compactPhone.slice(3).replace(/^0+/, "") : compactPhone.replace(/^0+/, "");
  const phoneCandidates = localPhone
    ? [`+971 ${localPhone}`, `+971${localPhone}`, `971${localPhone}`, `0${localPhone}`, localPhone]
    : [];

  const orders = await prisma.order.findMany({
    where: {
      OR: [{ email: { equals: contact } }, { phone: { equals: contact } }, ...phoneCandidates.map((phone) => ({ phone: { equals: phone } }))]
    },
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 20
  });

  return Response.json({
    orders: orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      status: paymentLabel(order.status),
      fulfillmentStatus: fulfillmentLabel(order.fulfillmentStatus),
      total: order.total,
      totalFormatted: formatAed(order.total),
      currency: order.currency,
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      email: maskEmail(order.email),
      phone: maskPhone(order.phone),
      items: order.items.map((item) => ({
        sku: item.sku,
        name: item.name,
        price: item.price,
        priceFormatted: formatAed(item.price),
        quantity: item.quantity
      }))
    }))
  });
}
