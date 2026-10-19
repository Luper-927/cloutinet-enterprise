import Link from "next/link";
import { getAccess } from "@/lib/access";

type Row = {
  supplier_id: string;
  supplier_name: string;
  orders_counted: number;
  completed_orders: number;
  on_time_orders: number;
  on_time_rate: number | null;
  avg_delay_days: number | null;
  fulfilment_rate: number | null;
  enough_data: boolean;
};

export default async function SupplierPerformancePage() {
  const access = await getAccess();
  if (!access.can("suppliers.read") || !access.can("purchase_orders.read")) {
    return (
      <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
        You do not have access to supplier performance.
      </p>
    );
  }

  const { data } = await access.supabase.rpc("supplier_performance", { p_org: access.orgId });
  const rows = (data ?? []) as Row[];

  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/dashboard/suppliers" className="text-sm text-blue-600 hover:underline">
        ← Back to suppliers
      </Link>
      <h1 className="text-2xl font-bold">Supplier performance</h1>

      <section className="rounded-xl bg-white p-5 text-sm text-slate-600 shadow-sm">
        <p className="font-semibold text-slate-900">How these are calculated (all time)</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <b>On-time rate:</b> completed orders whose last goods receipt was on or before the expected delivery date,
            divided by completed orders that had an expected date.
          </li>
          <li>
            <b>Average delay:</b> average days late across those orders, counting on-time orders as 0.
          </li>
          <li>
            <b>Fulfilment:</b> quantity received divided by quantity ordered, across sent, confirmed, partly received and
            completed orders.
          </li>
          <li>A rate is only shown as a score once a supplier has at least 3 completed orders.</li>
        </ul>
      </section>

      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.supplier_id} className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link href={`/dashboard/suppliers/${r.supplier_id}`} className="font-semibold text-blue-600 hover:underline">
                {r.supplier_name}
              </Link>
              <span className="text-xs text-slate-500">
                {r.completed_orders} completed of {r.orders_counted} orders
              </span>
            </div>
            {r.orders_counted === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No orders yet.</p>
            ) : (
              <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <div>
                  <dt className="text-xs text-slate-500">On-time rate</dt>
                  <dd className="font-semibold">
                    {r.enough_data && r.on_time_rate !== null ? `${r.on_time_rate}%` : "Not enough data"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Average delay</dt>
                  <dd className="font-semibold">
                    {r.enough_data && r.avg_delay_days !== null ? `${r.avg_delay_days} days` : "Not enough data"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Fulfilment</dt>
                  <dd className="font-semibold">
                    {r.enough_data && r.fulfilment_rate !== null ? `${r.fulfilment_rate}%` : "Not enough data"}
                  </dd>
                </div>
              </dl>
            )}
          </div>
        ))}
        {rows.length === 0 && <p className="text-sm text-slate-500">No suppliers yet.</p>}
      </div>
    </div>
  );
}
