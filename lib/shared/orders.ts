import type { FulfillmentStatus, OrderStatus } from "@prisma/client";

export const fulfillmentStatuses: Array<{ value: FulfillmentStatus; label: string }> = [
  { value: "PENDING_SHIPMENT", label: "待发货" },
  { value: "SHIPPED", label: "已发货" },
  { value: "COMPLETED", label: "已完成" },
  { value: "AFTER_SALES", label: "售后" }
];

export function fulfillmentLabel(status: FulfillmentStatus | string) {
  return fulfillmentStatuses.find((item) => item.value === simplifiedFulfillmentStatus(status))?.label ?? String(status);
}

export function simplifiedFulfillmentStatus(status: FulfillmentStatus | string): FulfillmentStatus {
  if (status === "SHIPPED" || status === "COMPLETED" || status === "AFTER_SALES") return status;
  return "PENDING_SHIPMENT";
}

export function paymentLabel(status: OrderStatus | string) {
  const labels: Record<string, string> = {
    PENDING: "待付款",
    PAID_SIMULATED: "已支付",
    CANCELLED: "已取消"
  };
  return labels[String(status)] ?? String(status);
}

export function maskEmail(email?: string | null) {
  if (!email) return "";
  const [name, domain] = email.split("@");
  if (!domain) return email;
  return `${name.slice(0, 2)}***@${domain}`;
}

export function maskPhone(phone?: string | null) {
  if (!phone) return "";
  const compact = phone.replace(/\s+/g, "");
  if (compact.length <= 5) return `${compact.slice(0, 1)}***`;
  return `${compact.slice(0, 3)}****${compact.slice(-2)}`;
}

export function normalizeContact(value: string) {
  return value.trim().toLowerCase();
}
