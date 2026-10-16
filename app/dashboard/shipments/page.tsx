import Link from "next/link";
import { getAccess } from "@/lib/access";

const badge: Record<string, string> = {
  preparing: "bg-slate-100 text-slate-600",
  dispatched: "bg-blue-50 text-blue-700",
  in_transit: "bg-indigo-50 text-indigo-700",
  customs: "bg-amber-50 text-amber-700",
  arrived: "bg-green-50 text-green-700",
  delivered: "bg-green-50 text-green-700",
  exception: "bg-red-50 text-red-700",
  cancelled: "bg-slate-100 text-slate-500",
};

export default async function ShipmentsPage() {
  const access = await getAccess();
  if (!access.can("shipments.read")) {
    return (
      <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
        You do not have access to shipments.
      </p>
    );
  }

  const { data: shipments } = await access.supabase
    .from("shipments")
    .select(
      "id, purchase_order_id, carrier, tracking_reference, expected_arrival_date, status"
    )
    .order("created_at", { ascending: false });

  const orderIds = Array.from(
    new Set((shipments ?? []).map((s) => s.purchase_order_id as string))
  );
  const { data: orders } =
    orderIds.length > 0
      ? await access.supabase
          .from("purchase_orders")
          .select("id, order_number")
          .in("id", orderIds)
      : { data: [] };
  const orderNumber = new Map(
    (orders ?? []).map((o) => [o.id as string, o.order_number as string])
  );

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Shipments</h1>
        {access.can("shipments.update") && (
          <Link
            href="/dashboard/shipments/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            New shipment
          </Link>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Carrier / tracking</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Expected</th>
            </tr>
          </thead>
          <tbody>
            {(shipments ?? []).map((s) => {
              const status = s.status as string;
              const late =
                s.expected_arrival_date &&
                (s.expected_arrival_date as string) < today &&
                !["delivered", "cancelled"].includes(status);
              return (
                <tr key={s.id as string} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/shipments/${s.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {orderNumber.get(s.purchase_order_id as string) ?? "-"}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {s.carrier ?? "-"}
                    {s.tracking_reference ? ` | ${s.tracking_reference}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${badge[status] ?? "bg-slate-100 text-slate-600"}`}
                    >
                      {status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {s.expected_arrival_date ?? "-"}
                    {late ? (
                      <span className="ml-2 text-xs font-semibold text-red-600">
                        LATE
                      </span>
                    ) : null}
                  </td>
                </tr>
              );
            })}
            {(shipments ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                  No shipments yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
