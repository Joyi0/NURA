export const AED_RATE_FROM_CNY = 0.51;

export function cnyToAed(value: number) {
  return Math.round(value * AED_RATE_FROM_CNY);
}

export function formatAed(value: number | null | undefined) {
  return `AED ${Math.round(Number(value || 0)).toLocaleString("en-US")}`;
}
