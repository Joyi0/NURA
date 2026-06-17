import { FulfillmentStatus, Prisma } from "@prisma/client";
import { assertAdmin } from "@/lib/admin/auth";
import { formatAed } from "@/lib/shared/money";
import { fulfillmentLabel, simplifiedFulfillmentStatus } from "@/lib/shared/orders";
import { prisma } from "@/lib/shared/prisma";

const editableStatuses: FulfillmentStatus[] = ["PENDING_SHIPMENT", "SHIPPED", "COMPLETED", "AFTER_SALES"];

export async function GET(request: Request) {
  const auth = assertAdmin(request);
  if (auth) return auth;

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();
  const status = (url.searchParams.get("status") || "").trim();

  const where: Prisma.OrderWhereInput = {};
  if (q) {
    where.OR = [
      { orderNumber: { contains: q } },
      { email: { contains: q.toLowerCase() } },
      { phone: { contains: q } }
    ];
  }
  if (status) {
    if (!editableStatuses.includes(status as FulfillmentStatus)) {
      return Response.json({ error: "状态无效。" }, { status: 400 });
    }
    where.fulfillmentStatus =
      status === "PENDING_SHIPMENT"
        ? { in: ["PENDING_PAYMENT", "PENDING_CONFIRMATION", "PENDING_SHIPMENT"] }
        : (status as FulfillmentStatus);
  }

  const orders = await prisma.order.findMany({
    where,
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return Response.json({
    orders: orders.map((order) => ({
      ...order,
      fulfillmentStatus: simplifiedFulfillmentStatus(order.fulfillmentStatus),
      fulfillmentLabel: fulfillmentLabel(order.fulfillmentStatus),
      totalLabel: formatAed(order.total),
      items: order.items.map((item) => ({ ...item, priceLabel: formatAed(item.price) }))
    }))
  });
}
