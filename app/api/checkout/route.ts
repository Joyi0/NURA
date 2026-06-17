import { prisma } from "@/lib/shared/prisma";
import { localizedProductName, productAedPrice } from "@/lib/shared/products";

type CheckoutItem = {
  id: unknown;
  quantity: unknown;
};

const uaeEmirates = new Set(["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain"]);

function requiredText(value: unknown) {
  return String(value || "").trim();
}

function normalizeUaePhone(countryCode: string, value: string) {
  let digits = value.replace(/[^\d]/g, "");
  if (digits.startsWith("971")) digits = digits.slice(3);
  digits = digits.replace(/^0+/, "");
  return `${countryCode} ${digits}`;
}

export async function POST(request: Request) {
  const body = await request.json();
  const items: CheckoutItem[] = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) return Response.json({ error: "购物车为空。" }, { status: 400 });

  const customerName = requiredText(body.customerName);
  const email = requiredText(body.email).toLowerCase();
  const phoneCountryCode = requiredText(body.phoneCountryCode) || "+971";
  const phoneInput = requiredText(body.phone);
  const emirate = requiredText(body.emirate);
  const cityArea = requiredText(body.cityArea);
  const addressLine1 = requiredText(body.addressLine1);
  const addressLine2 = requiredText(body.addressLine2);

  if (!customerName || !email || !phoneInput || !emirate || !cityArea || !addressLine1) {
    return Response.json({ error: "请填写姓名、邮箱、电话和阿联酋配送地址。" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "请填写有效邮箱。" }, { status: 400 });
  }
  if (phoneCountryCode !== "+971") {
    return Response.json({ error: "当前仅支持阿联酋 +971 电话区号。" }, { status: 400 });
  }
  if (!uaeEmirates.has(emirate)) {
    return Response.json({ error: "配送地址仅支持阿联酋境内。" }, { status: 400 });
  }

  const phone = normalizeUaePhone(phoneCountryCode, phoneInput);
  const phoneDigits = phone.replace(/[^\d]/g, "");
  if (phoneDigits.length < 10 || phoneDigits.length > 12) {
    return Response.json({ error: "请填写有效阿联酋手机号。" }, { status: 400 });
  }
  const shippingAddress = [addressLine1, addressLine2, cityArea, emirate, "United Arab Emirates"].filter(Boolean).join(", ");

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
      customerName,
      email,
      phone,
      shippingName: customerName,
      shippingEmail: email || null,
      shippingPhone: phone || null,
      shippingAddress,
      currency: "AED",
      paymentMethod: "SIMULATED",
      total,
      status: "PAID_SIMULATED",
      items: { create: orderItems }
    }
  });

  return Response.json({ orderId: order.id, orderNumber: order.orderNumber, status: order.status });
}
