import { AdminNav } from "@/components/admin/AdminNav";
import { CustomersClient } from "@/components/admin/CustomersClient";
import { redirect } from "next/navigation";
import { requireAdminPage } from "@/lib/admin/auth";

export default async function AdminCustomersPage() {
  const isAdmin = await requireAdminPage();
  if (!isAdmin) redirect("/nura-admin");

  return (
    <div className="page">
      <AdminNav />
      <div className="page-title">
        <h1>客户线索</h1>
        <p>按邮箱或手机号自动聚合下单客户，查看复购与消费表现。</p>
      </div>
      <CustomersClient />
    </div>
  );
}
