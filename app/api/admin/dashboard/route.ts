import { assertAdmin } from "@/lib/admin/auth";
import { formatAed } from "@/lib/shared/money";
import { prisma } from "@/lib/shared/prisma";

export async function GET(request: Request) {
  const auth = assertAdmin(request);
  if (auth) return auth;

  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: start }, status: { not: "CANCELLED" } },
    include: { items: { include: { product: { include: { images: true } } } } },
    orderBy: { createdAt: "asc" }
  });

  const validOrders = orders.filter((order) => order.status === "PAID_SIMULATED");
  const sales = validOrders.reduce((sum, order) => sum + order.total, 0);
  const orderCount = validOrders.length;
  const avgOrderValue = orderCount ? Math.round(sales / orderCount) : 0;
  const pendingShipment = orders.filter((order) => order.fulfillmentStatus === "PENDING_SHIPMENT").length;
  const afterSales = orders.filter((order) => order.fulfillmentStatus === "AFTER_SALES").length;
  const lowStock = await prisma.product.count({ where: { stock: { lte: 3 }, status: "ACTIVE" } });

  const trend = Array.from({ length: 7 }).map((_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    const key = day.toISOString().slice(5, 10);
    const dayOrders = validOrders.filter((order) => order.createdAt.toISOString().slice(0, 10) === day.toISOString().slice(0, 10));
    return {
      label: key,
      sales: dayOrders.reduce((sum, order) => sum + order.total, 0),
      orders: dayOrders.length
    };
  });

  const productMap = new Map<string, { name: string; sales: number; quantity: number; image: string | null }>();
  for (const order of validOrders) {
    for (const item of order.items) {
      const current = productMap.get(item.productId) || {
        name: item.name,
        sales: 0,
        quantity: 0,
        image: item.product.images.find((image) => image.approved)?.path || item.product.images[0]?.path || null
      };
      current.sales += item.price * item.quantity;
      current.quantity += item.quantity;
      productMap.set(item.productId, current);
    }
  }

  const topProducts = [...productMap.entries()]
    .sort((a, b) => b[1].sales - a[1].sales)
    .slice(0, 3)
    .map(([productId, item]) => ({ productId, ...item, salesLabel: formatAed(item.sales) }));

  return Response.json({
    currency: "AED",
    metrics: {
      totalSales: formatAed(sales),
      validOrders: orderCount,
      averageOrderValue: formatAed(avgOrderValue),
      pendingShipment,
      afterSales,
      lowStock
    },
    trend,
    topProducts
  });
}
