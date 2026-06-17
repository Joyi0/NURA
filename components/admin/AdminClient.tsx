"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { assetUrl, categories, imageTypes, statuses } from "@/lib/shared/catalog";

type ProductImage = {
  id: string;
  type: string;
  path: string;
  approved: boolean;
};

type Product = {
  id: string;
  sku: string;
  sourceCode: string | null;
  category: string;
  name: string;
  description: string;
  purchasePrice: number;
  shippingFee: number;
  packagingFee: number;
  cost: number;
  rawSuggestedPrice: number;
  price: number;
  titleEn: string | null;
  titleAr: string | null;
  detailEn: string | null;
  detailAr: string | null;
  material: string | null;
  priceAed: number | null;
  stock: number;
  tags: string | null;
  collectionName: string | null;
  priceReviewStatus: string;
  status: string;
  images: ProductImage[];
};

const initialForm = {
  name: "",
  category: "EARRING",
  description: "",
  titleEn: "",
  titleAr: "",
  detailEn: "",
  detailAr: "",
  material: "",
  priceAed: "",
  stock: "0",
  tags: "",
  collectionName: "",
  purchasePrice: "0",
  shippingFee: "120",
  packagingFee: "30",
  status: "DRAFT"
};

export function AdminClient({
  initialProducts = [],
  initialEditingId = null,
  initialSearchTerm = ""
}: {
  initialProducts?: Product[];
  initialEditingId?: string | null;
  initialSearchTerm?: string;
}) {
  const initialEditingProduct = initialProducts.find((product) => product.id === initialEditingId) || null;
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [form, setForm] = useState(initialEditingProduct ? productToForm(initialEditingProduct) : initialForm);
  const [editingId, setEditingId] = useState<string | null>(initialEditingProduct?.id || null);
  const [message, setMessage] = useState(initialEditingProduct ? `正在编辑：${initialEditingProduct.sku}` : "");
  const [loading, setLoading] = useState(false);
  const selectedProduct = useMemo(() => products.find((product) => product.id === editingId), [products, editingId]);
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const filteredProducts = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return products;
    return products.filter((product) => {
      const category = categories.find((item) => item.value === product.category)?.label || product.category;
      const status = statuses.find((item) => item.value === product.status)?.label || product.status;
      const haystack = [
        product.name,
        product.titleEn,
        product.titleAr,
        product.sku,
        product.sourceCode,
        product.category,
        category,
        product.material,
        product.tags,
        product.collectionName,
        product.status,
        status
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(keyword);
    });
  }, [products, searchTerm]);

  async function loadProducts() {
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/admin/products");
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setMessage(data.error || "读取失败");
      return;
    }
    setProducts(data.products);
    setMessage(`数据库已连接，读取到 ${data.products.length} 个商品。`);
  }

  async function saveProduct(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    const payload = {
      ...form,
      purchasePrice: Number(form.purchasePrice),
      shippingFee: Number(form.shippingFee),
      packagingFee: Number(form.packagingFee),
      priceAed: form.priceAed === "" ? "" : Number(form.priceAed),
      stock: Number(form.stock)
    };
    const url = editingId ? `/api/admin/products/${editingId}` : "/api/admin/products";
    const response = await fetch(url, {
      method: editingId ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || "保存失败");
      return;
    }
    setForm(initialForm);
    setEditingId(null);
    setMessage(editingId ? "商品修改已保存。" : "商品已创建。");
    await loadProducts();
  }

  async function deleteProduct(id: string) {
    if (!window.confirm("确认删除该商品？")) return;
    const response = await fetch(`/api/admin/products/${id}`, {
      method: "DELETE"
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || "删除失败");
      return;
    }
    setProducts((current) => current.filter((product) => product.id !== id));
    setMessage(data.archived ? "商品已有订单记录，已归档并从列表移除。" : "商品已删除。");
  }

  async function updateStatus(product: Product, status: string) {
    const response = await fetch(`/api/admin/products/${product.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status })
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || "状态更新失败");
      return;
    }
    await loadProducts();
  }

  async function uploadImage(event: FormEvent<HTMLFormElement>, productId: string) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("productId", productId);
    const response = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || "上传失败");
      return;
    }
    event.currentTarget.reset();
    setMessage("图片已上传。");
    await loadProducts();
  }

  function edit(product: Product) {
    setEditingId(product.id);
    setForm(productToForm(product));
    setMessage(`正在编辑：${product.sku}`);
    document.getElementById("product-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="admin-grid">
      <section className="admin-panel" id="product-editor">
        <h2 style={{ marginTop: 28 }}>{editingId ? "编辑商品" : "新增商品"}</h2>
        <form className="form-grid" onSubmit={saveProduct}>
          <div className="field">
            <label>商品名称</label>
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </div>
          <div className="field">
            <label>英文标题</label>
            <input value={form.titleEn} onChange={(event) => setForm({ ...form, titleEn: event.target.value })} />
          </div>
          <div className="field">
            <label>阿文标题</label>
            <input dir="rtl" value={form.titleAr} onChange={(event) => setForm({ ...form, titleAr: event.target.value })} />
          </div>
          <div className="field">
            <label>分类</label>
            <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
              {categories.map((category) => (
                <option value={category.value} key={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>进货价</label>
            <input type="number" min="0" step="0.01" value={form.purchasePrice} onChange={(event) => setForm({ ...form, purchasePrice: event.target.value })} />
          </div>
          <div className="field">
            <label>运费</label>
            <input type="number" min="0" step="0.01" value={form.shippingFee} onChange={(event) => setForm({ ...form, shippingFee: event.target.value })} />
          </div>
          <div className="field">
            <label>包装费</label>
            <input type="number" min="0" step="0.01" value={form.packagingFee} onChange={(event) => setForm({ ...form, packagingFee: event.target.value })} />
          </div>
          <div className="field">
            <label>AED 售价</label>
            <input type="number" min="0" step="1" value={form.priceAed} onChange={(event) => setForm({ ...form, priceAed: event.target.value })} placeholder="不填则自动换算" />
          </div>
          <div className="field">
            <label>库存数量</label>
            <input type="number" min="0" step="1" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} />
          </div>
          <div className="field">
            <label>材质</label>
            <input value={form.material} onChange={(event) => setForm({ ...form, material: event.target.value })} placeholder="例如 18K gold plated" />
          </div>
          <div className="field">
            <label>商品标签</label>
            <input value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} placeholder="新品, 日常款, 送礼款" />
          </div>
          <div className="field">
            <label>系列分组</label>
            <input value={form.collectionName} onChange={(event) => setForm({ ...form, collectionName: event.target.value })} />
          </div>
          <div className="field">
            <label>描述</label>
            <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </div>
          <div className="field">
            <label>英文描述</label>
            <textarea value={form.detailEn} onChange={(event) => setForm({ ...form, detailEn: event.target.value })} />
          </div>
          <div className="field">
            <label>阿文描述</label>
            <textarea dir="rtl" value={form.detailAr} onChange={(event) => setForm({ ...form, detailAr: event.target.value })} />
          </div>
          <div className="field">
            <label>状态</label>
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
              {statuses.map((status) => (
                <option value={status.value} key={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
          <button className="btn" type="submit">
            {editingId ? "保存修改" : "创建商品"}
          </button>
          {editingId ? (
            <button
              className="btn secondary"
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(initialForm);
              }}
            >
              取消编辑
            </button>
          ) : null}
        </form>

        {selectedProduct ? (
          <form className="form-grid" style={{ marginTop: 28 }} onSubmit={(event) => uploadImage(event, selectedProduct.id)}>
            <h2>上传图片</h2>
            <p className="muted">{selectedProduct.name}</p>
            <div className="field">
              <label>图片类型</label>
              <select name="type" defaultValue="ECOMMERCE_WHITE">
                {imageTypes.map((type) => (
                  <option value={type.value} key={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>图片文件</label>
              <input name="file" type="file" accept="image/*" required />
            </div>
            <button className="btn secondary" type="submit">
              上传到素材库
            </button>
          </form>
        ) : null}

        {message ? <p className="notice">{message}</p> : null}
      </section>

      <section className="admin-panel">
        <div className="section-head">
          <div>
            <h2>商品列表</h2>
            <p>
              {loading ? "读取中..." : `数据库已连接，共 ${products.length} 个商品，当前匹配 ${filteredProducts.length} 个`}
            </p>
          </div>
          <button className="btn secondary" onClick={() => loadProducts()}>
            刷新列表
          </button>
        </div>
        <form className="admin-search-row" action="/nura-admin/products">
          <div className="field">
            <label>搜索商品</label>
            <input name="q" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="商品名 / SKU / 材质 / 系列 / 状态" />
          </div>
          <button className="btn secondary" type="submit">
            搜索
          </button>
          {searchTerm ? (
            <a className="btn secondary" href="/nura-admin/products" onClick={() => setSearchTerm("")}>
              清空
            </a>
          ) : null}
        </form>
        <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>图</th>
                  <th>商品</th>
                  <th>成本</th>
                  <th>售价</th>
                  <th>状态</th>
                  <th>图片</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const image = product.images.find((item) => item.approved)?.path || product.images[0]?.path || null;
                  return (
                    <tr key={product.id}>
                      <td>
                        <img className="thumb" src={assetUrl(image)} alt={product.name} />
                      </td>
                      <td>
                        <strong>{product.name}</strong>
                        <p className="muted">{product.titleEn || "未填写英文标题"}</p>
                        <p className="muted">{product.sku}</p>
                      </td>
                      <td>
                        <div>进货 ¥{product.purchasePrice}</div>
                        <div>总成本 ¥{product.cost}</div>
                      </td>
                      <td>
                        <div>AED {Math.round(product.priceAed || product.price * 0.51).toLocaleString("en-US")}</div>
                        <div className="muted">库存 {product.stock}</div>
                        <div className="muted">{product.priceReviewStatus === "TARGET" ? "目标内" : "需复核"}</div>
                      </td>
                      <td>
                        <select value={product.status} onChange={(event) => updateStatus(product, event.target.value)}>
                          {statuses.map((status) => (
                            <option value={status.value} key={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>{product.images.length}</td>
                      <td>
                        <a className="btn secondary" href={`/nura-admin/products?edit=${product.id}`} onClick={() => edit(product)}>
                          编辑/上传
                        </a>{" "}
                        <button className="btn secondary" onClick={() => deleteProduct(product.id)}>
                          删除
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredProducts.length === 0 ? <p className="muted">没有匹配的商品。</p> : null}
        </div>
      </section>
    </div>
  );
}

function productToForm(product: Product) {
  return {
    name: product.name,
    category: product.category,
    description: product.description,
    titleEn: product.titleEn || "",
    titleAr: product.titleAr || "",
    detailEn: product.detailEn || "",
    detailAr: product.detailAr || "",
    material: product.material || "",
    priceAed: product.priceAed === null ? "" : String(product.priceAed),
    stock: String(product.stock),
    tags: product.tags || "",
    collectionName: product.collectionName || "",
    purchasePrice: String(product.purchasePrice),
    shippingFee: String(product.shippingFee),
    packagingFee: String(product.packagingFee),
    status: product.status
  };
}
