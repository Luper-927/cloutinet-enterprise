import Link from "next/link";
import { notFound } from "next/navigation";
import { getAccess } from "@/lib/access";
import { statusClass } from "@/lib/ui";
import { cancelRequest, convertRequest, decideRequest } from "../../actions";

const input = "rounded-lg border border-slate-300 px-3 py-2 text-sm";

export default async function RequestDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const access = await getAccess();
  const { supabase } = access;

  const { data: request } = await supabase
    .from("purchase_requests")
    .select("*")
    .eq("id", params.id)
    .single();
  if (!request) notFound();

  const { data: items } = await supabase
    .from("purchase_request_items")
    .select("id, product_id, quantity, unit_of_measure, estimated_unit_cost")
    .eq("purchase_request_id", params.id);
  const lines = items ?? [];

  const { data: products } = await supabase
    .from("products")
    .select("id, sku, name")
    .in("id", lines.map((l) => l.product_id as string));
  const productName = (id: string) => {
    const p = (products ?? []).find((x) => x.id === id);
    return p ? `${p.name} (${p.sku})` : "Product";
  };

  const { data: history } = await supabase
    .from("approval_actions")
    .select("id, actor_user_id, action, note, created_at")
    .eq("source_id", params.id)
    .order("created_at", { ascending: true });

  const personIds = Array.from(
    new Set(
      [request.requester_user_id, request.decided_by, ...(history ?? []).map((h) => h.actor_user_id)].filter(
        Boolean
      ) as string[]
    )
  );
  const { data: people } = await supabase.rpc("member_names", {
    p_org: request.organization_id,
    p_ids: personIds,
  });
  const personName = (id: string | null) => {
    if (!id) return "-";
    const p = ((people ?? []) as { member_id: string; name: string }[]).find((x) => x.member_id === id);
    return p ? p.name : "A colleague";
  };

  const isMine = request.requester_user_id === access.userId;
  const canDecide = request.status === "submitted" && access.can("purchase_requests.approve") && !isMine;
  const canCancel =
    (request.status === "submitted" || request.status === "approved") &&
    (isMine || access.can("purchase_requests.approve"));
  const canConvert = request.status === "approved" && access.can("purchase_orders.create");

  let suppliers: { id: string; legal_name: string }[] = [];
  if (canConvert) {
    const { data } = await supabase
      .from("suppliers")
      .select("id, legal_name")
      .eq("status", "approved")
      .order("legal_name");
    suppliers = (data ?? []) as { id: string; legal_name: string }[];
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/dashboard/purchasing" className="text-sm text-blue-600 hover:underline">
        ← Back to purchasing
      </Link>
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{request.request_number}</h1>
        <span className={`rounded-full px-2 py-0.5 text-xs ${statusClass(request.status)}`}>{request.status}</span>
      </div>

      {searchParams.error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{searchParams.error}</p>
      )}

      <section className="rounded-xl bg-white p-5 shadow-sm">
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-slate-500">Requested by</dt>
          <dd>{personName(request.requester_user_id)}</dd>
          <dt className="text-slate-500">Needed by</dt>
          <dd>{request.required_by ?? "-"}</dd>
          <dt className="text-slate-500">Currency</dt>
          <dd>{request.currency}</dd>
          <dt className="text-slate-500">Reason</dt>
          <dd>{request.justification ?? "-"}</dd>
          {request.decided_at && (
            <>
              <dt className="text-slate-500">Decision by</dt>
              <dd>
                {personName(request.decided_by)} {request.decision_note ? `: ${request.decision_note}` : ""}
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
              {productName(l.product_id as string)}: {String(l.quantity)} {l.unit_of_measure}
              {l.estimated_unit_cost != null ? ` at about ${String(l.estimated_unit_cost)}` : ""}
            </li>
          ))}
        </ul>
      </section>

      {(canDecide || canCancel) && (
        <section className="space-y-3 rounded-xl bg-white p-5 shadow-sm">
          {canDecide && (
            <form action={decideRequest} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="request_id" value={params.id} />
              <input name="note" placeholder="Note (optional)" className={`${input} flex-1`} />
              <button name="decision" value="approved" type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
                Approve
              </button>
              <button name="decision" value="rejected" type="submit" className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white">
                Reject
              </button>
            </form>
          )}
          {canCancel && (
            <form action={cancelRequest}>
              <input type="hidden" name="request_id" value={params.id} />
              <button type="submit" className="rounded-lg border border-slate-300 px-4 py-2 text-sm">
                Cancel this request
              </button>
            </form>
          )}
        </section>
      )}

      {canConvert && (
        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Create the purchase order</h2>
          <p className="mt-1 text-xs text-slate-500">Only suppliers with status approved are listed.</p>
          <form action={convertRequest} className="mt-3 space-y-3">
            <input type="hidden" name="request_id" value={params.id} />
            <select name="supplier_id" required defaultValue="" className={`${input} w-full`}>
              <option value="" disabled>
                Choose supplier
              </option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.legal_name}
                </option>
              ))}
            </select>
            <div className="grid gap-3 sm:grid-cols-2">
              <input name="expected" type="date" className={input} />
              <input name="terms" type="number" min={0} max={365} placeholder="Payment terms (days)" className={input} />
            </div>
            {lines.map((l) => (
              <div key={l.id as string} className="grid items-center gap-2 sm:grid-cols-[2fr_1fr]">
                <span className="text-sm">
                  {productName(l.product_id as string)} × {String(l.quantity)}
                </span>
                <input
                  name={`price_${l.id}`}
                  type="number"
                  min="0"
                  step="any"
                  required
                  defaultValue={l.estimated_unit_cost != null ? String(l.estimated_unit_cost) : ""}
                  placeholder="Unit price"
                  className={input}
                />
              </div>
            ))}
            <button type="submit" className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white">
              Create order
            </button>
          </form>
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
