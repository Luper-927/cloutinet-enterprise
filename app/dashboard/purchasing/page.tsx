import Link from "next/link";
import { getAccess } from "@/lib/access";

const badge: Record<string, string> = {
  submitted: "bg-blue-50 text-blue-700",
  pending_approval: "bg-amber-50 text-amber-700",
  approved: "bg-green-50 text-green-700",
  sent: "bg-indigo-50 text-indigo-700",
  confirmed: "bg-indigo-50 text-indigo-700",
  partially_received: "bg-amber-50 text-amber-700",
  received: "bg-green-50 text-green-700",
  closed: "bg-slate-100 text-slate-600",
  rejected: "bg-red-50 text-red-700",
  cancelled: "bg-red-50 text-red-700",
  converted: "bg-slate-100 text-slate-600",
};

function Status({ value }: { value: string }) {
  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${badge[value] ?? "bg-slate-100 text-slate-600"}`}>
      {value.replace(/_/g, " ")}
    </span>
  );
}

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
    : { data: [] };

  const { data: orders } = canOrders
    ? await access.supabase
        .from("purchase_orders")
        .select("id, order_number, supplier_id, status, currency, total_amount, expected_delivery_date")
        .order("created_at", { ascending: false })
    : { data: [] };

  const { data: suppliers } = await access.supabase
    .from("suppliers")
    .select("id, legal_name");
  const supplierName = new Map(
    (suppliers ?? []).map((s) => [s.id as string, s.legal_name as string])
  );

  return (
    <div className="max-w-4xl space-y-8">
      <h1 className="text-2xl font-bold">Purchasing</h1>

      {canRequests && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Purchase requests</h2>
          </div>
          <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3">Number</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Required by</th>
                </tr>
              </thead>
              <tbody>
                {(requests ?? []).map((r) => (
                  <tr key={r.id as string} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/purchasing/requests/${r.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {r.request_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Status value={r.status as string} />
                    </td>
                    <td className="px-4 py-3">{r.required_by ?? "-"}</td>
                  </tr>
                ))}
                {(requests ?? []).length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-slate-500">
                      No purchase requests yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {canOrders && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Purchase orders</h2>
          <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3">Number</th>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {(orders ?? []).map((o) => (
                  <tr key={o.id as string} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/purchasing/orders/${o.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {o.order_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {supplierName.get(o.supplier_id as string) ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      <Status value={o.status as string} />
                    </td>
                    <td className="px-4 py-3">
                      {Number(o.total_amount).toLocaleString()} {o.currency}
                    </td>
                  </tr>
                ))}
                {(orders ?? []).length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                      No purchase orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
