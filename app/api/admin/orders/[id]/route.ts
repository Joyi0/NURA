import { FulfillmentStatus } from "@prisma/client";
import { assertAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/shared/prisma";

const editableStatuses: FulfillmentStatus[] = ["PENDING_SHIPMENT", "SHIPPED", "COMPLETED", "AFTER_SALES"];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = assertAdmin(request);
  if (auth) return auth;

  const { id } = await params;
  const body = await request.json();
  const data: { fulfillmentStatus?: FulfillmentStatus; internalNote?: string; shippingAddress?: string } = {};
  if (body.fulfillmentStatus && editableStatuses.includes(body.fulfillmentStatus)) {
    data.fulfillmentStatus = body.fulfillmentStatus;
  } else if (body.fulfillmentStatus) {
    return Response.json({ error: "状态无效。" }, { status: 400 });
  }
  if (typeof body.internalNote === "string") data.internalNote = body.internalNote;
  if (typeof body.shippingAddress === "string") data.shippingAddress = body.shippingAddress;

  const order = await prisma.order.update({
    where: { id },
    data,
    include: { items: true }
  });

  return Response.json({ order });
}
