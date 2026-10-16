import Link from "next/link";
import { getAccess } from "@/lib/access";
import { createWarehouse } from "./actions";

const input = "rounded-lg border border-slate-300 px-3 py-2 text-sm";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const access = await getAccess();
  if (!access.can("inventory.read")) {
    return (
      <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
        You do not have access to inventory.
      </p>
    );
  }

  const { data: warehouses } = await access.supabase
    .from("warehouses")
    .select("id, code, name, location, status")
    .order("name");

  const { data: moves } = await access.supabase
    .from("inventory_movements")
    .select("product_id, warehouse_id, quantity_delta");

  const { data: products } = await access.supabase
    .from("products")
    .select("id, sku, name, unit_of_measure");

  const whName = new Map(
    (warehouses ?? []).map((w) => [w.id as string, w.name as string])
  );
  const prod = new Map(
    (products ?? []).map((p) => [
      p.id as string,
      `${p.sku} - ${p.name} (${p.unit_of_measure})`,
    ])
  );

  const totals = new Map<string, number>();
  for (const m of moves ?? []) {
    const key = `${m.product_id}|${m.warehouse_id}`;
    totals.set(key, (totals.get(key) ?? 0) + Number(m.quantity_delta));
  }
  const rows = Array.from(totals.entries());

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inventory</h1>
        {access.can("goods_receipts.create") && (
          <Link
            href="/dashboard/inventory/receive"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Receive goods
          </Link>
        )}
      </div>

      {searchParams.error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {searchParams.error}
        </p>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Warehouses</h2>
        {access.can("inventory.adjust") && (
          <form
            action={createWarehouse}
            className="grid gap-3 rounded-xl bg-white p-5 shadow-sm sm:grid-cols-2"
          >
            <input name="code" required placeholder="Code (e.g. WH1)" className={input} />
            <input name="name" required placeholder="Name" className={input} />
            <input name="location" placeholder="Location (optional)" className={input} />
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Add warehouse
            </button>
          </form>
        )}
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Location</th>
              </tr>
            </thead>
            <tbody>
              {(warehouses ?? []).map((w) => (
                <tr key={w.id as string} className="border-b last:border-0">
                  <td className="px-4 py-3">{w.code}</td>
                  <td className="px-4 py-3">{w.name}</td>
                  <td className="px-4 py-3">{w.location ?? "-"}</td>
                </tr>
              ))}
              {(warehouses ?? []).length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-500">
                    No warehouses yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Stock on hand</h2>
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Warehouse</th>
                <th className="px-4 py-3">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([key, qty]) => {
                const [productId, warehouseId] = key.split("|");
                return (
                  <tr key={key} className="border-b last:border-0">
                    <td className="px-4 py-3">{prod.get(productId) ?? "-"}</td>
                    <td className="px-4 py-3">{whName.get(warehouseId) ?? "-"}</td>
                    <td className="px-4 py-3">{qty}</td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-500">
                    No stock recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
