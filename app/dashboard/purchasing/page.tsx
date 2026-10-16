import Link from "next/link";
import { getAccess } from "@/lib/access";
import { statusClass } from "@/lib/ui";

export default async function PurchasingPage() {
  const access = await getAccess();
  const canRequests = access.can("purchase_requests.read");
  const canOrders = access.can("purchase_orders.read");
  if (!canRequests && !canOrders) {
    return (
      <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
        You do not have access to purchasing.
      </p>
    );
  }

  const { data: requests } = canRequests
    ? await access.supabase
        .from("purchase_requests")
        .select("id, request_number, status, required_by, currency, created_at")
        .order("created_at", { ascending: false })
        .limit(50)
    : { data: [] as { id: string; request_number: string; status: string; required_by: string | null; currency: string; created_at: string }[] };

  const { data: orders } = canOrders
    ? await access.supabase
        .from("purchase_orders")
        .select("id, order_number, status, total_amount, currency, created_at")
        .order("created_at", { ascending: false })
        .limit(50)
    : { data: [] as { id: string; order_number: string; status: string; total_amount: string; currency: string; created_at: string }[] };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Purchasing</h1>
        {access.can("purchase_requests.create") && (
          <Link
            href="/dashboard/purchasing/requests/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            New request
          </Link>
        )}
      </div>

      {canRequests && (
        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Purchase requests</h2>
          <div className="mt-3 space-y-2">
            {(requests ?? []).map((r) => (
              <Link
                key={r.id}
                href={`/dashboard/purchasing/requests/${r.id}`}
                className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
              >
                <span className="font-medium">{r.request_number}</span>
                <span className="text-slate-500">{String(r.created_at).slice(0, 10)}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${statusClass(r.status)}`}>{r.status}</span>
              </Link>
            ))}
            {(requests ?? []).length === 0 && <p className="text-sm text-slate-500">No requests yet.</p>}
          </div>
        </section>
      )}

      {canOrders && (
        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Purchase orders</h2>
          <div className="mt-3 space-y-2">
            {(orders ?? []).map((o) => (
              <Link
                key={o.id}
                href={`/dashboard/purchasing/orders/${o.id}`}
                className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
              >
                <span className="font-medium">{o.order_number}</span>
                <span className="text-slate-500">
                  {String(o.total_amount)} {o.currency}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${statusClass(o.status)}`}>{o.status}</span>
              </Link>
            ))}
            {(orders ?? []).length === 0 && <p className="text-sm text-slate-500">No orders yet.</p>}
          </div>
        </section>
      )}
    </div>
  );
}
