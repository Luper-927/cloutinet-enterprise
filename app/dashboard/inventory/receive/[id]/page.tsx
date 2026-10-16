import Link from "next/link";
import { notFound } from "next/navigation";
import { randomUUID } from "crypto";
import { getAccess } from "@/lib/access";
import { receiveGoods } from "../../actions";

const input = "rounded-lg border border-slate-300 px-3 py-2 text-sm";

export default async function ReceivePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const access = await getAccess();
  if (!access.can("goods_receipts.create")) notFound();
  const { supabase } = access;

  const { data: order } = await supabase
    .from("purchase_orders")
    .select("id, order_number, status")
    .eq("id", params.id)
    .single();
  if (!order) notFound();

  const open = ["sent", "confirmed", "partially_received"].includes(order.status);

  const { data: items } = await supabase
    .from("purchase_order_items")
    .select("id, product_id, ordered_quantity, received_quantity, unit_of_measure")
    .eq("purchase_order_id", params.id);
  const lines = items ?? [];

  const { data: products } = await supabase
    .from("products")
    .select("id, sku, name")
    .in("id", lines.map((l) => l.product_id as string));
  const prodName = (id: string) => {
    const p = (products ?? []).find((x) => x.id === id);
    return p ? `${p.name} (${p.sku})` : "Product";
  };

  const { data: whs } = await supabase
    .from("warehouses")
    .select("id, code, name")
    .eq("status", "active")
    .order("code");
  const warehouses = (whs ?? []) as { id: string; code: string; name: string }[];

  return (
    <div className="max-w-3xl space-y-4">
      <Link href="/dashboard/inventory" className="text-sm text-blue-600 hover:underline">
        ← Back to inventory
      </Link>
      <h1 className="text-2xl font-bold">Receive goods: {order.order_number}</h1>

      {searchParams.error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{searchParams.error}</p>}

      {!open ? (
        <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
          This order is {order.status}, so goods cannot be received against it.
        </p>
      ) : warehouses.length === 0 ? (
        <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
          Add a warehouse first (Inventory page, by a Warehouse Manager or Owner).
        </p>
      ) : (
        <form action={receiveGoods} className="space-y-4 rounded-xl bg-white p-5 shadow-sm">
          <input type="hidden" name="order_id" value={params.id} />
          <input type="hidden" name="key" value={randomUUID()} />
          <select name="warehouse_id" required defaultValue="" className={`${input} w-full`}>
            <option value="" disabled>Receive into which warehouse?</option>
            {warehouses.map((w) => <option key={w.id} value={w.id}>{w.code} {w.name}</option>)}
          </select>

          <div className="space-y-2">
            {lines.map((l) => {
              const remaining = Number(l.ordered_quantity) - Number(l.received_quantity);
              return (
                <div key={l.id as string} className="grid items-center gap-2 sm:grid-cols-[2fr_1fr]">
                  <span className="text-sm">
                    {prodName(l.product_id as string)}
                    <span className="block text-xs text-slate-500">
                      Ordered {String(l.ordered_quantity)}, received {String(l.received_quantity)}, remaining {remaining}{" "}
                      {l.unit_of_measure}
                    </span>
                  </span>
                  <input
                    name={`qty_${l.id}`}
                    type="number"
                    min="0"
                    max={remaining}
                    step="any"
                    disabled={remaining <= 0}
                    placeholder="Received now"
                    className={input}
                  />
                </div>
              );
            })}
          </div>

          <input name="notes" placeholder="Notes (optional)" className={`${input} w-full`} />
          <button type="submit" className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-500">
            Record delivery
          </button>
        </form>
      )}
    </div>
  );
}
