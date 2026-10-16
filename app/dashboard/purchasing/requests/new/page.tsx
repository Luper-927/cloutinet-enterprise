import Link from "next/link";
import { getAccess } from "@/lib/access";
import { createRequest } from "../../actions";

const input = "rounded-lg border border-slate-300 px-3 py-2 text-sm";

export default async function NewRequestPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const access = await getAccess();
  if (!access.can("purchase_requests.create")) {
    return (
      <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
        You do not have permission to create requests.
      </p>
    );
  }

  const { data: products } = await access.supabase
    .from("products")
    .select("id, sku, name, unit_of_measure")
    .eq("status", "active")
    .order("name");

  return (
    <div className="max-w-3xl space-y-4">
      <Link href="/dashboard/purchasing" className="text-sm text-blue-600 hover:underline">
        ← Back to purchasing
      </Link>
      <h1 className="text-2xl font-bold">New purchase request</h1>

      {searchParams.error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{searchParams.error}</p>
      )}

      <form action={createRequest} className="space-y-4 rounded-xl bg-white p-5 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <input name="currency" maxLength={3} defaultValue="CNY" placeholder="Currency" className={input} />
          <input name="required_by" type="date" className={input} />
        </div>
        <textarea name="justification" rows={2} placeholder="Why is this needed?" className={`${input} w-full`} />

        <div className="space-y-2">
          <p className="text-sm font-semibold">Items (up to 5)</p>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr]">
              <select name={`product_${i}`} defaultValue="" className={input}>
                <option value="">Choose product</option>
                {(products ?? []).map((p) => (
                  <option key={p.id as string} value={p.id as string}>
                    {p.name} ({p.sku}) · {p.unit_of_measure}
                  </option>
                ))}
              </select>
              <input name={`quantity_${i}`} type="number" min="0" step="any" placeholder="Quantity" className={input} />
              <input name={`cost_${i}`} type="number" min="0" step="any" placeholder="Est. unit cost" className={input} />
            </div>
          ))}
        </div>

        <button type="submit" className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-500">
          Submit request
        </button>
      </form>
    </div>
  );
}
