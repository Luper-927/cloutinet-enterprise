import Link from "next/link";
import { randomUUID } from "crypto";
import { getAccess } from "@/lib/access";
import { statusClass } from "@/lib/ui";
import { adjustStock, createWarehouse, transferStock } from "./actions";

const input = "rounded-lg border border-slate-300 px-3 py-2 text-sm";
const card = "rounded-xl bg-white p-5 shadow-sm";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: { error?: string; saved?: string };
}) {
  const access = await getAccess();
  if (!access.can("inventory.read") && !access.can("goods_receipts.read")) {
    return (
      <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
        You do not have access to inventory.
      </p>
    );
  }
  const { supabase } = access;
  const canAdjust = access.can("inventory.adjust");

  const [whRes, balRes, prodRes, movRes] = await Promise.all([
    supabase.from("warehouses").select("id, code, name, status").order("code"),
    supabase.from("inventory_balances").select("product_id, warehouse_id, quantity"),
    supabase.from("products").select("id, sku, name, unit_of_measure, reorder_threshold").order("name"),
    supabase
      .from("inventory_movements")
      .select("id, created_at, movement_type, quantity_delta, product_id, warehouse_id, reason")
      .order("created_at", { ascending: false })
      .limit(15),
  ]);
  const warehouses = (whRes.data ?? []) as { id: string; code: string; name: string; status: string }[];
  const active = warehouses.filter((w) => w.status === "active");
  const balances = (balRes.data ?? []) as { product_id: string; warehouse_id: string; quantity: number }[];
  const products = (prodRes.data ?? []) as {
    id: string; sku: string; name: string; unit_of_measure: string; reorder_threshold: number;
  }[];
  const movements = (movRes.data ?? []) as {
    id: string; created_at: string; movement_type: string; quantity_delta: number;
    product_id: string; warehouse_id: string; reason: string | null;
  }[];

  const whName = (id: string) => warehouses.find((w) => w.id === id)?.code ?? "?";
  const prodName = (id: string) => products.find((p) => p.id === id)?.name ?? "Product";
  const totals = new Map<string, number>();
  for (const b of balances) totals.set(b.product_id, (totals.get(b.product_id) ?? 0) + Number(b.quantity));

  const low = products.filter((p) => Number(p.reorder_threshold) > 0 && (totals.get(p.id) ?? 0) <= Number(p.reorder_threshold));

  let openOrders: { id: string; order_number: string; status: string }[] = [];
  if (access.can("goods_receipts.create")) {
    const { data } = await supabase
      .from("purchase_orders")
      .select("id, order_number, status")
      .in("status", ["sent", "confirmed", "partially_received"])
      .order("created_at", { ascending: false });
    openOrders = (data ?? []) as { id: string; order_number: string; status: string }[];
  }

  const key = randomUUID();

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold">Inventory</h1>
      {searchParams.error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{searchParams.error}</p>}
      {searchParams.saved && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">Saved.</p>}

      {low.length > 0 && (
        <section className="rounded-xl bg-amber-50 p-5">
          <h2 className="font-semibold text-amber-900">Low stock</h2>
          <ul className="mt-2 space-y-1 text-sm text-amber-900">
            {low.map((p) => (
              <li key={p.id}>
                {p.name} ({p.sku}): {totals.get(p.id) ?? 0} left, reorder at {String(p.reorder_threshold)}
              </li>
            ))}
          </ul>
        </section>
      )}

      {openOrders.length > 0 && (
        <section className={card}>
          <h2 className="font-semibold">Orders waiting to be received</h2>
          <div className="mt-3 space-y-2">
            {openOrders.map((o) => (
              <Link
                key={o.id}
                href={`/dashboard/inventory/receive/${o.id}`}
                className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
              >
                <span className="font-medium">{o.order_number}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${statusClass(o.status)}`}>{o.status}</span>
                <span className="text-blue-600">Receive goods</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className={card}>
        <h2 className="font-semibold">Stock</h2>
        <div className="mt-3 space-y-2 text-sm">
          {products.map((p) => {
            const rows = balances.filter((b) => b.product_id === p.id && Number(b.quantity) !== 0);
            return (
              <div key={p.id} className="flex flex-wrap items-center justify-between rounded-lg border px-3 py-2">
                <span className="font-medium">
                  {p.name} <span className="text-slate-400">({p.sku})</span>
                </span>
                <span>
                  {totals.get(p.id) ?? 0} {p.unit_of_measure}
                </span>
                <span className="w-full text-xs text-slate-500">
                  {rows.map((r) => `${whName(r.warehouse_id)}: ${r.quantity}`).join(" · ") || "No stock"}
                </span>
              </div>
            );
          })}
          {products.length === 0 && <p className="text-slate-500">No products yet.</p>}
        </div>
      </section>

      {canAdjust && (
        <section className={card}>
          <h2 className="font-semibold">Warehouses</h2>
          <p className="mt-1 text-sm text-slate-500">
            {warehouses.map((w) => `${w.code} (${w.name})`).join(", ") || "None yet."}
          </p>
          <form action={createWarehouse} className="mt-3 grid gap-3 sm:grid-cols-4">
            <input name="code" required placeholder="Code (W1)" className={input} />
            <input name="name" required placeholder="Name" className={input} />
            <input name="location" placeholder="Location" className={input} />
            <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
              Add warehouse
            </button>
          </form>
        </section>
      )}

      {canAdjust && active.length > 0 && (
        <>
          <section className={card}>
            <h2 className="font-semibold">Adjust stock</h2>
            <p className="mt-1 text-xs text-slate-500">Use a negative number to remove stock. A reason is required and recorded.</p>
            <form action={adjustStock} className="mt-3 grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="key" value={`${key}-a`} />
              <select name="product_id" required defaultValue="" className={input}>
                <option value="" disabled>Product</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
              </select>
              <select name="warehouse_id" required defaultValue="" className={input}>
                <option value="" disabled>Warehouse</option>
                {active.map((w) => <option key={w.id} value={w.id}>{w.code} {w.name}</option>)}
              </select>
              <input name="delta" type="number" step="any" required placeholder="Change (e.g. -3 or 5)" className={input} />
              <input name="reason" required placeholder="Reason" className={input} />
              <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                Save adjustment
              </button>
            </form>
          </section>

          <section className={card}>
            <h2 className="font-semibold">Transfer between warehouses</h2>
            <form action={transferStock} className="mt-3 grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="key" value={`${key}-t`} />
              <select name="product_id" required defaultValue="" className={input}>
                <option value="" disabled>Product</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
              </select>
              <input name="qty" type="number" min="0" step="any" required placeholder="Quantity" className={input} />
              <select name="from_id" required defaultValue="" className={input}>
                <option value="" disabled>From</option>
                {active.map((w) => <option key={w.id} value={w.id}>{w.code} {w.name}</option>)}
              </select>
              <select name="to_id" required defaultValue="" className={input}>
                <option value="" disabled>To</option>
                {active.map((w) => <option key={w.id} value={w.id}>{w.code} {w.name}</option>)}
              </select>
              <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                Transfer
              </button>
            </form>
          </section>
        </>
      )}

      <section className={card}>
        <h2 className="font-semibold">Recent stock movements</h2>
        <ul className="mt-2 space-y-1 text-sm text-slate-600">
          {movements.map((m) => (
            <li key={m.id}>
              {String(m.created_at).slice(0, 16).replace("T", " ")} · {prodName(m.product_id)} ·{" "}
              {Number(m.quantity_delta) > 0 ? "+" : ""}
              {String(m.quantity_delta)} at {whName(m.warehouse_id)} · {m.movement_type}
              {m.reason ? ` (${m.reason})` : ""}
            </li>
          ))}
          {movements.length === 0 && <li>No movements yet.</li>}
        </ul>
      </section>
    </div>
  );
}
