import { getAccess } from "@/lib/access";
import { createShipment } from "./actions";

const input = "rounded-lg border border-slate-300 px-3 py-2 text-sm";

export default async function NewShipmentPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const access = await getAccess();
  if (!access.can("shipments.update")) {
    return (
      <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
        You do not have permission to create shipments.
      </p>
    );
  }

  const { data: orders } = await access.supabase
    .from("purchase_orders")
    .select("id, order_number, supplier_id")
    .in("status", ["sent", "confirmed", "partially_received"])
    .order("created_at", { ascending: false });

  const { data: suppliers } = await access.supabase
    .from("suppliers")
    .select("id, legal_name");
  const supplierName = new Map(
    (suppliers ?? []).map((s) => [s.id as string, s.legal_name as string])
  );

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">New shipment</h1>

      {searchParams.error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {searchParams.error}
        </p>
      )}

      {(orders ?? []).length === 0 ? (
        <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
          No orders are ready. An order must be marked as sent to the supplier
          first.
        </p>
      ) : (
        <form
          action={createShipment}
          className="grid gap-3 rounded-xl bg-white p-5 shadow-sm"
        >
          <select name="order_id" required defaultValue="" className={input}>
            <option value="" disabled>
              Choose order
            </option>
            {(orders ?? []).map((o) => (
              <option key={o.id as string} value={o.id as string}>
                {o.order_number} - {supplierName.get(o.supplier_id as string) ?? ""}
              </option>
            ))}
          </select>
          <input name="carrier" placeholder="Carrier (optional)" className={input} />
          <input
            name="tracking"
            placeholder="Tracking reference (optional)"
            className={input}
          />
          <input name="origin" placeholder="Origin (optional)" className={input} />
          <input
            name="destination"
            placeholder="Destination (optional)"
            className={input}
          />
          <label className="text-sm text-slate-500">
            Expected arrival (optional)
          </label>
          <input name="expected" type="date" className={input} />
          <textarea name="notes" rows={2} placeholder="Notes (optional)" className={input} />
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Create shipment
          </button>
        </form>
      )}
    </div>
  );
}
