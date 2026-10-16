import { getAccess } from "@/lib/access";
import { createRequest } from "./actions";

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
        You do not have permission to create purchase requests.
      </p>
    );
  }

  const { data: products } = await access.supabase
    .from("products")
    .select("id, sku, name, unit_of_measure")
    .eq("status", "active")
    .order("name");

  const { data: org } = await access.supabase
    .from("organizations")
    .select("default_currency")
    .eq("id", access.orgId)
    .single();

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">New purchase request</h1>

      {searchParams.error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {searchParams.error}
        </p>
      )}

      {(products ?? []).length === 0 ? (
        <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
          Add at least one product first, then come back.
        </p>
      ) : (
        <form
          action={createRequest}
          className="grid gap-3 rounded-xl bg-white p-5 shadow-sm"
        >
          <select name="product_id" required className={input} defaultValue="">
            <option value="" disabled>
              Choose a product
            </option>
            {(products ?? []).map((p) => (
              <option key={p.id as string} value={p.id as string}>
                {p.sku} - {p.name} ({p.unit_of_measure})
              </option>
            ))}
          </select>
          <input
            name="quantity"
            type="number"
            min={0}
            step="any"
            required
            placeholder="Quantity"
            className={input}
          />
          <input
            name="estimated_unit_cost"
            type="number"
            min={0}
            step="any"
            placeholder="Estimated unit cost (optional)"
            className={input}
          />
          <input
            name="currency"
            required
            maxLength={3}
            defaultValue={(org?.default_currency as string) ?? "USD"}
            placeholder="Currency (e.g. USD)"
            className={input}
          />
          <label className="text-sm text-slate-500">Required by (optional)</label>
          <input name="required_by" type="date" className={input} />
          <textarea
            name="justification"
            rows={3}
            placeholder="Why is this needed?"
            className={input}
          />
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Submit request
          </button>
        </form>
      )}
    </div>
  );
}
