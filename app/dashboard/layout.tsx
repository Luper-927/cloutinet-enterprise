import Link from "next/link";
import { getAccess } from "@/lib/access";

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
    { href: "/dashboard/customers", label: "Customers", show: access.can("customers.read") },
    { href: "/dashboard/products", label: "Products", show: access.can("products.read") },
    { href: "/dashboard/team", label: "Team", show: access.can("organization.members.manage") },
    { href: "/dashboard/audit", label: "Activity log", show: access.can("audit_logs.read") },
  ].filter((l) => l.show);

  return (
    <div className="min-h-screen md:flex">
      <aside className="bg-[#0A0E27] p-4 text-white md:min-h-screen md:w-60">
        <p className="text-lg font-black">Cloutinet Enterprise</p>
        <p className="mt-1 truncate text-xs text-slate-400">{access.orgName}</p>
        <nav className="mt-6 space-y-1 text-sm">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="block rounded-lg px-3 py-2 hover:bg-white/10">
              {l.label}
            </Link>
          ))}
        </nav>
        <form action="/auth/signout" method="post" className="mt-6">
          <button type="submit" className="text-sm text-slate-300 hover:text-white">
            Sign out
          </button>
        </form>
      </main>
    </div>
  );
}
