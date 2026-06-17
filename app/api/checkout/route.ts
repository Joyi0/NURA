import { prisma } from "@/lib/shared/prisma";
import { localizedProductName, productAedPrice } from "@/lib/shared/products";

type CheckoutItem = {
  id: unknown;
  quantity: unknown;
};

export async function POST(request: Request) {
  const body = await request.json();
  const items: CheckoutItem[] = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) return Response.json({ error: "购物车为空。" }, { status: 400 });
  const email = String(body.email || "").trim().toLowerCase();
  const phone = String(body.phone || "").trim();
  if (!email && !phone) return Response.json({ error: "请至少填写邮箱或手机号。" }, { status: 400 });

  const ids = items.map((item) => String(item.id));
  const products = await prisma.product.findMany({ where: { id: { in: ids }, status: "ACTIVE" } });
  const productMap = new Map(products.map((product) => [product.id, product]));
  const orderItems: Array<{ productId: string; sku: string; name: string; price: number; quantity: number }> = [];

  for (const item of items) {
    const product = productMap.get(String(item.id));
    const quantity = Math.max(1, Number(item.quantity) || 1);
    if (!product) return Response.json({ error: "购物车中包含已下架或不存在的商品。" }, { status: 400 });
    orderItems.push({
      productId: product.id,
      sku: product.sku,
      name: localizedProductName(product, "en"),
      price: productAedPrice(product),
      quantity
    });
  }

  const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const orderNumber = `NURA-${Date.now()}`;
  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerName: String(body.customerName || "").trim() || null,
      email: email || null,
      phone: phone || null,
      shippingName: String(body.customerName || "").trim() || null,
      shippingEmail: email || null,
      shippingPhone: phone || null,
      currency: "AED",
      paymentMethod: "SIMULATED",
      total,
      status: "PAID_SIMULATED",
      items: { create: orderItems }
    }
  });

  return Response.json({ orderId: order.id, orderNumber: order.orderNumber, status: order.status });
}
