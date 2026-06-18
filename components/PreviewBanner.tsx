export function PreviewBanner() {
  if (process.env.NEXT_PUBLIC_APP_ENV !== "preview") return null;

  return (
    <div className="preview-banner" role="status">
      TEST PREVIEW · DEMO ORDERS AND SIMULATED PAYMENT ONLY · بيئة تجريبية
    </div>
  );
}
