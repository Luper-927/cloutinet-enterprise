import { getAccess } from "@/lib/access";
import DashboardNav from "@/app/components/DashboardNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const access = await getAccess();

  const links = [
    { href: "/dashboard", label: "Dashboard", show: true },
    {
      href: "/dashboard/reports",
      label: "Overview and reports",
      show:
        access.can("reports.export") ||
        access.can("purchase_requests.read") ||
        access.can("purchase_orders.read") ||
        access.can("inventory.read") ||
        access.can("shipments.read"),
    },
    {
      href: "/dashboard/purchasing",
      label: "Purchasing",
      show: access.can("purchase_requests.read") || access.can("purchase_orders.read"),
    },
    {
      href: "/dashboard/inventory",
      label: "Inventory",
      show: access.can("inventory.read"),
    },
    {
      href: "/dashboard/shipments",
      label: "Shipments",
      show: access.can("shipments.read"),
    },
    { href: "/dashboard/suppliers", label: "Suppliers", show: access.can("suppliers.read") },
    {
      href: "/dashboard/suppliers/performance",
      label: "Supplier performance",
      show: access.can("suppliers.read") && access.can("purchase_orders.read"),
    },
    { href: "/dashboard/customers", label: "Customers", show: access.can("customers.read") },
    { href: "/dashboard/products", label: "Products", show: access.can("products.read") },
    { href: "/dashboard/team", label: "Team", show: access.can("organization.members.manage") },
    { href: "/dashboard/audit", label: "Activity log", show: access.can("audit_logs.read") },
  ]
    .filter((l) => l.show)
    .map(({ href, label }) => ({ href, label }));

  return (
    <div className="min-h-screen md:flex">
      <DashboardNav links={links} orgName={access.orgName ?? ""} />
      <main className="min-w-0 flex-1 p-6">{children}</main>
    </div>
  );
}
