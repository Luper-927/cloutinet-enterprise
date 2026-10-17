import { notFound } from "next/navigation";
import { getAccess } from "@/lib/access";
import { addShipmentUpdate } from "./actions";

const input = "rounded-lg border border-slate-300 px-3 py-2 text-sm";

const statuses = [
  "dispatched",
  "in_transit",
  "customs",
  "arrived",
  "delivered",
  "exception",
  "cancelled",
];

export default async function ShipmentPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const access = await getAccess();
  if (!access.can("shipments.read")) {
    return (
      <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
        You do not have access to shipments.
      </p>
    );
  }

  const { data: shipment } = await access.supabase
    .from("shipments")
    .select(
      "id, purchase_order_id, carrier, tracking_reference, origin, destination, expected_arrival_date, actual_arrival_date, status, notes"
    )
    .eq("id", params.id)
    .maybeSingle();
  if (!shipment) notFound();

  const { data: order } = await access.supabase
    .from("purchase_orders")
    .select("order_number")
    .eq("id", shipment.purchase_order_id as string)
    .maybeSingle();

  const { data: events } = await access.supabase
    .from("shipment_events")
    .select("id, status, description, source, event_at")
    .eq("shipment_id", params.id)
    .order("event_at", { ascending: false });

  const status = shipment.status as string;
  const closed = ["delivered", "cancelled"].includes(status);
  const canUpdate = access.can("shipments.update") && !closed;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Shipment for {order?.order_number ?? "order"}
        </h1>
        <p className="text-sm text-slate-500">
          Status: {status.replace(/_/g, " ")}
        </p>
      </div>

      {searchParams.error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {searchParams.error}
        </p>
      )}

      <div className="space-y-1 rounded-xl bg-white p-5 text-sm shadow-sm">
        <p>Carrier: {shipment.carrier ?? "-"}</p>
        <p>Tracking: {shipment.tracking_reference ?? "-"}</p>
        <p>
          Route: {shipment.origin ?? "-"} to {shipment.destination ?? "-"}
        </p>
        <p>Expected: {shipment.expected_arrival_date ?? "-"}</p>
        <p>Arrived: {shipment.actual_arrival_date ?? "-"}</p>
        {shipment.notes ? <p>Notes: {shipment.notes}</p> : null}
      </div>

      {canUpdate && (
        <form
          action={addShipmentUpdate}
          className="grid gap-3 rounded-xl bg-white p-5 shadow-sm"
        >
          <h2 className="text-lg font-semibold">Add an update</h2>
          <input type="hidden" name="id" value={shipment.id as string} />
          <select name="status" required defaultValue="" className={input}>
            <option value="" disabled>
              New status
            </option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <input
            name="description"
            placeholder="What happened? (optional)"
            className={input}
          />
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Save update
          </button>
        </form>
      )}

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">History</h2>
        <ul className="space-y-2 text-sm">
          {(events ?? []).map((e) => (
            <li key={e.id as string}>
              {String(e.event_at).slice(0, 16).replace("T", " ")} |{" "}
              {String(e.status).replace(/_/g, " ")}
              {e.description ? ` | ${e.description}` : ""}
              <span className="ml-2 text-xs text-slate-400">({e.source})</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
