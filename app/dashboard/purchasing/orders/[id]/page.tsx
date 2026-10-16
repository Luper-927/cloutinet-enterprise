import Link from "next/link";
import { notFound } from "next/navigation";
import { getAccess } from "@/lib/access";
import { statusClass } from "@/lib/ui";
import { advanceOrder, decideOrder } from "../../actions";

const input = "rounded-lg border border-slate-300 px-3 py-2 text-sm";

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const access = await getAccess();
  const { supabase } = access;

  const { data: order } = await supabase
    .from("purchase_orders")
    .select("*")
    .eq("id", params.id)
    .single();
  if (!order) notFound();

  const { data: items } = await supabase
    .from("purchase_order_items")
    .select("id, product_id, ordered_quantity, unit_of_measure, unit_price, line_total")
    .eq("purchase_order_id", params.id);
  const lines = items ?? [];

  const { data: products } = await supabase
    .from("products")
    .select("id, sku, name")
    .in("id", lines.map((l) => l.product_id as string));
  const productName = (id: string) => {
    const p = (products ?? []).find((x) => x.id === id);
    return p ? `${p.name} (${p.sku})` : "Product";
  };

  const { data: supplier } = await supabase
    .from("suppliers")
    .select("legal_name, supplier_code")
    .eq("id", order.supplier_id)
    .maybeSingle();

  const { data: history } = await supabase
    .from("approval_actions")
    .select("id, actor_user_id, action, note, created_at")
    .eq("source_id", params.id)
    .order("created_at", { ascending: true });

  const personIds = Array.from(
    new Set(
      [order.created_by, order.decided_by, ...(history ?? []).map((h) => h.actor_user_id)].filter(
        Boolean
      ) as string[]
    )
  );
  const { data: people } = await supabase.rpc("member_names", {
    p_org: order.organization_id,
    p_ids: personIds,
  });
  const personName = (id: string | null) => {
    if (!id) return "-";
    const p = ((people ?? []) as { member_id: string; name: string }[]).find((x) => x.member_id === id);
    return p ? p.name : "A colleague";
  };

  const canDecide =
    order.status === "pending_approval" &&
    access.can("purchase_orders.approve") &&
    order.created_by !== access.userId;
  const canAdvance = access.can("purchase_orders.create");
  const canCancel = canAdvance && ["pending_approval", "approved", "sent", "confirmed"].includes(order.status);

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/dashboard/purchasing" className="text-sm text-blue-600 hover:underline">
        ← Back to purchasing
      </Link>
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{order.order_number}</h1>
        <span className={`rounded-full px-2 py-0.5 text-xs ${statusClass(order.status)}`}>{order.status}</span>
      </div>

      {searchParams.error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{searchParams.error}</p>
      )}

      <section className="rounded-xl bg-white p-5 shadow-sm">
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-slate-500">Supplier</dt>
          <dd>{supplier ? `${supplier.legal_name} (${supplier.supplier_code})` : "-"}</dd>
          <dt className="text-slate-500">Created by</dt>
          <dd>{personName(order.created_by)}</dd>
          <dt className="text-slate-500">Expected delivery</dt>
          <dd>{order.expected_delivery_date ?? "-"}</dd>
          <dt className="text-slate-500">Payment terms</dt>
          <dd>{order.payment_terms_days != null ? `${order.payment_terms_days} days` : "-"}</dd>
          <dt className="text-slate-500">Total</dt>
          <dd className="font-semibold">
            {String(order.total_amount)} {order.currency}
          </dd>
          {order.decided_at && (
            <>
              <dt className="text-slate-500">Decision by</dt>
              <dd>
                {personName(order.decided_by)} {order.decision_note ? `: ${order.decision_note}` : ""}
              </dd>
            </>
          )}
        </dl>
      </section>

      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold">Items</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {lines.map((l) => (
            <li key={l.id as string}>
              {productName(l.product_id as string)}: {String(l.ordered_quantity)} {l.unit_of_measure} ×{" "}
              {String(l.unit_price)} = {String(l.line_total)}
            </li>
          ))}
        </ul>
      </section>

      {(canDecide || canAdvance) && (
        <section className="space-y-3 rounded-xl bg-white p-5 shadow-sm">
          {canDecide && (
            <form action={decideOrder} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="order_id" value={params.id} />
              <input name="note" placeholder="Note (optional)" className={`${input} flex-1`} />
              <button name="decision" value="approved" type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
                Approve order
              </button>
              <button name="decision" value="rejected" type="submit" className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white">
                Reject
              </button>
            </form>
          )}
          {canAdvance && order.status === "approved" && (
            <form action={advanceOrder}>
              <input type="hidden" name="order_id" value={params.id} />
              <input type="hidden" name="to" value="sent" />
              <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
                Mark as sent to supplier
              </button>
            </form>
          )}
          {canAdvance && order.status === "sent" && (
            <form action={advanceOrder}>
              <input type="hidden" name="order_id" value={params.id} />
              <input type="hidden" name="to" value="confirmed" />
              <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
                Record supplier confirmation
              </button>
            </form>
          )}
          {canCancel && (
            <form action={advanceOrder} className="flex gap-2">
              <input type="hidden" name="order_id" value={params.id} />
              <input type="hidden" name="to" value="cancelled" />
              <input name="note" placeholder="Reason for cancelling" className={`${input} flex-1`} />
              <button type="submit" className="rounded-lg border border-slate-300 px-4 py-2 text-sm">
                Cancel order
              </button>
            </form>
          )}
        </section>
      )}

      {(history ?? []).length > 0 && (
        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="font-semibold">History</h2>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            {(history ?? []).map((h) => (
              <li key={h.id as number}>
                {String(h.created_at).slice(0, 16).replace("T", " ")} · {personName(h.actor_user_id as string)} ·{" "}
                {h.action}
                {h.note ? ` (${h.note})` : ""}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
