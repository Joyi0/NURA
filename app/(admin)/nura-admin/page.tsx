import { redirect } from "next/navigation";
import { AdminLoginClient } from "@/components/admin/AdminLoginClient";
import { AdminNav } from "@/components/admin/AdminNav";
import { assetUrl, statusLabel } from "@/lib/shared/catalog";
import { requireAdminPage } from "@/lib/admin/auth";
import { formatAed } from "@/lib/shared/money";
import { prisma } from "@/lib/shared/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const isAdmin = await requireAdminPage();
  if (!isAdmin) {
    return <AdminLoginClient />;
  }
  redirect("/nura-admin/dashboard");
}

export async function DashboardPage() {
  const isAdmin = await requireAdminPage();
  if (!isAdmin) redirect("/nura-admin");
  const dashboard = await getDashboard();

  return (
    <div className="page">
      <AdminNav />
      <div className="page-title">
        <h1>数据仪表盘</h1>
        <p>近 7 天经营数据、待办事项和热销款快速概览，默认币种 AED。</p>
      </div>
      <div className="dashboard-stack">
        <div className="metric-grid">
          <Metric label="总销售额" value={formatAed(dashboard.sales)} />
          <Metric label="有效订单数" value={String(dashboard.orderCount)} />
          <Metric label="平均客单价" value={formatAed(dashboard.avgOrderValue)} />
          <Metric label="待发货订单" value={String(dashboard.pendingShipment)} />
          <Metric label="待处理售后" value={String(dashboard.afterSales)} />
          <Metric label="低库存款" value={String(dashboard.inventory.lowStock)} />
        </div>

        <section className="admin-panel">
          <div className="section-head">
            <div>
              <h2>7 日趋势</h2>
              <p>销售额走势</p>
            </div>
          </div>
          <svg className="trend-chart" viewBox="0 0 680 250" role="img" aria-label="7 day sales trend">
            <defs>
              <linearGradient id="goldLineServer" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#d4af37" />
                <stop offset="100%" stopColor="#f0d88a" />
              </linearGradient>
            </defs>
            {dashboard.yTicks.map((tick) => (
              <g key={tick.value}>
                <line className="grid-line" x1="68" x2="644" y1={tick.y} y2={tick.y} />
                <text x="58" y={tick.y + 4} textAnchor="end">
                  {tick.label}
                </text>
              </g>
            ))}
            <line className="axis" x1="68" x2="68" y1="28" y2="188" />
            <line className="axis" x1="68" x2="644" y1="188" y2="188" />
            <polyline points={dashboard.points} fill="none" stroke="url(#goldLineServer)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            {dashboard.trendPoints.map((point) => (
              <circle className="trend-dot" cx={point.x} cy={point.y} r="4" key={point.label} />
            ))}
            {dashboard.xLabels.map((label) => (
              <text x={label.x} y="214" textAnchor="middle" key={label.label}>
                {label.label}
              </text>
            ))}
            <text x="68" y="236">
              日期
            </text>
            <text x="10" y="20">
              AED
            </text>
          </svg>
        </section>

        <section className="admin-panel">
          <div className="section-head">
            <div>
              <h2>库存看板</h2>
              <p>全部非归档商品，低库存阈值为 3 件。</p>
            </div>
          </div>
          <div className="inventory-grid">
            <InventoryMetric label="总商品" value={dashboard.inventory.total} />
            <InventoryMetric label="有库存" value={dashboard.inventory.inStock} />
            <InventoryMetric label="低库存" value={dashboard.inventory.lowStock} />
            <InventoryMetric label="缺货" value={dashboard.inventory.outOfStock} />
          </div>
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>图</th>
                  <th>商品</th>
                  <th>状态</th>
                  <th>库存</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.inventory.warningProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <img className="thumb" src={assetUrl(product.image)} alt={product.name} />
                    </td>
                    <td>
                      <strong>{product.name}</strong>
                      <p className="muted">{product.sku}</p>
                    </td>
                    <td>{statusLabel(product.status)}</td>
                    <td>
                      <span className="stock-badge">{product.stock}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {dashboard.inventory.warningProducts.length === 0 ? <p className="muted">当前没有低库存或缺货商品。</p> : null}
          </div>
        </section>

        <section className="admin-panel">
          <div className="section-head">
            <div>
              <h2>热销 Top3</h2>
              <p>按销售额排序</p>
            </div>
          </div>
          <div className="top-list">
            {dashboard.topProducts.map((product) => (
              <div className="top-row" key={product.productId}>
                <img className="thumb" src={assetUrl(product.image)} alt={product.name} />
                <div>
                  <strong>{product.name}</strong>
                  <p className="muted">销量 {product.quantity}</p>
                </div>
                <strong>{formatAed(product.sales)}</strong>
              </div>
            ))}
            {dashboard.topProducts.length === 0 ? <p className="muted">暂无销售数据。</p> : null}
          </div>
        </section>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <section className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </section>
  );
}

function InventoryMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="inventory-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

async function getDashboard() {
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
  const pendingShipment = orders.filter((order) => ["PENDING_PAYMENT", "PENDING_CONFIRMATION", "PENDING_SHIPMENT"].includes(order.fulfillmentStatus)).length;
  const afterSales = orders.filter((order) => order.fulfillmentStatus === "AFTER_SALES").length;
  const inventoryProducts = await prisma.product.findMany({
    where: { status: { not: "ARCHIVED" } },
    include: { images: { orderBy: { sortOrder: "asc" } } },
    orderBy: [{ stock: "asc" }, { createdAt: "desc" }]
  });
  const inventory = {
    total: inventoryProducts.length,
    inStock: inventoryProducts.filter((product) => product.stock > 0).length,
    lowStock: inventoryProducts.filter((product) => product.stock <= 3).length,
    outOfStock: inventoryProducts.filter((product) => product.stock === 0).length,
    warningProducts: inventoryProducts
      .filter((product) => product.stock <= 3)
      .slice(0, 8)
      .map((product) => ({
        id: product.id,
        sku: product.sku,
        name: product.name,
        status: product.status,
        stock: product.stock,
        image: product.images.find((image) => image.approved)?.path || product.images[0]?.path || null
      }))
  };

  const trend = Array.from({ length: 7 }).map((_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    const dayOrders = validOrders.filter((order) => order.createdAt.toISOString().slice(0, 10) === day.toISOString().slice(0, 10));
    return {
      sales: dayOrders.reduce((sum, order) => sum + order.total, 0),
      orders: dayOrders.length
    };
  });
  const max = Math.max(...trend.map((item) => item.sales), 1);
  const roundedMax = Math.max(Math.ceil(max / 100) * 100, 100);
  const chart = { left: 68, right: 644, top: 28, bottom: 188 };
  const trendPoints = trend.map((item, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    const x = trend.length === 1 ? (chart.left + chart.right) / 2 : chart.left + (index / (trend.length - 1)) * (chart.right - chart.left);
    const y = chart.bottom - (item.sales / roundedMax) * (chart.bottom - chart.top);
    return {
      x: Math.round(x),
      y: Math.round(y),
      label: `${day.getMonth() + 1}/${day.getDate()}`,
      sales: item.sales
    };
  });
  const points = trendPoints.map((point) => `${point.x},${point.y}`).join(" ");
  const xLabels = trendPoints.map((point) => ({ x: point.x, label: point.label }));
  const yTicks = [0, 0.5, 1].map((ratio) => {
    const value = Math.round(roundedMax * ratio);
    return {
      value,
      label: value >= 1000 ? `${Math.round(value / 100) / 10}k` : String(value),
      y: Math.round(chart.bottom - ratio * (chart.bottom - chart.top))
    };
  });

  const productMap = new Map<string, { productId: string; name: string; sales: number; quantity: number; image: string | null }>();
  for (const order of validOrders) {
    for (const item of order.items) {
      const current = productMap.get(item.productId) || {
        productId: item.productId,
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
  const topProducts = [...productMap.values()].sort((a, b) => b.sales - a.sales).slice(0, 3);

  return { sales, orderCount, avgOrderValue, pendingShipment, afterSales, inventory, points, trendPoints, xLabels, yTicks, topProducts };
}
