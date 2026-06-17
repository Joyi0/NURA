import { AdminNav } from "@/components/admin/AdminNav";
import { OrdersClient } from "@/components/admin/OrdersClient";
import { redirect } from "next/navigation";
import { requireAdminPage } from "@/lib/admin/auth";
import { formatAed } from "@/lib/shared/money";
import { fulfillmentLabel, simplifiedFulfillmentStatus } from "@/lib/shared/orders";
import { prisma } from "@/lib/shared/prisma";

export default async function AdminOrdersPage() {
  const isAdmin = await requireAdminPage();
  if (!isAdmin) redirect("/nura-admin");
  const orders = await prisma.order.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 100
  });
  const initialOrders = orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    email: order.email,
    phone: order.phone,
    shippingAddress: order.shippingAddress,
    internalNote: order.internalNote,
    fulfillmentStatus: simplifiedFulfillmentStatus(order.fulfillmentStatus),
    fulfillmentLabel: fulfillmentLabel(order.fulfillmentStatus),
    totalLabel: formatAed(order.total),
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((item) => ({
      name: item.name,
      sku: item.sku,
      quantity: item.quantity,
      priceLabel: formatAed(item.price)
    }))
  }));

  return (
    <div className="page">
      <AdminNav />
      <div className="page-title">
        <h1>订单履约</h1>
        <p>按订单号、邮箱或手机号快速检索游客订单，并维护状态与内部备注。</p>
      </div>
      <OrdersClient initialOrders={initialOrders} />
    </div>
  );
}
