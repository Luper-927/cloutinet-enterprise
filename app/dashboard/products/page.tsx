import { getAccess } from "@/lib/access";
import { createProduct } from "./actions";

const input = "rounded-lg border border-slate-300 px-3 py-2 text-sm";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const access = await getAccess();
  if (!access.can("products.read")) {
    return (
      <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
        You do not have access to products.
      </p>
    );
  }

  const { data: products } = await access.supabase
    .from("products")
    .select("id, sku, name, local_name, category, unit_of_measure, reorder_threshold, status")
    .order("name");

  const showCost = access.can("products.cost.read");
  const costs = new Map<string, { currency: string; unit_cost: string }>();
  if (showCost) {
    const { data: rows } = await access.supabase
      .from("product_costs")
      .select("product_id, currency, unit_cost, effective_from")
      .order("effective_from", { ascending: false });
    for (const r of rows ?? []) {
      if (!costs.has(r.product_id as string)) {
        costs.set(r.product_id as string, {
          currency: r.currency as string,
          unit_cost: String(r.unit_cost),
        });
      }
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold">Products</h1>

      {searchParams.error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{searchParams.error}</p>
      )}

      {access.can("products.manage") && (
        <form action={createProduct} className="grid gap-3 rounded-xl bg-white p-5 shadow-sm sm:grid-cols-2">
          <input name="sku" required placeholder="SKU (e.g. P-1001)" className={input} />
          <input name="name" required placeholder="Product name" className={input} />
          <input name="local_name" placeholder="Chinese / local name (optional)" className={input} />
          <input name="category" placeholder="Category" className={input} />
          <input name="unit_of_measure" placeholder="Unit (each, kg, box...)" className={input} />
          <input name="reorder_threshold" type="number" min={0} step="any" placeholder="Reorder level" className={input} />
          {access.can("products.cost.manage") && (
            <>
              <input name="unit_cost" type="number" min={0} step="any" placeholder="Unit cost (optional)" className={input} />
              <input name="currency" maxLength={3} placeholder="Cost currency (e.g. CNY)" className={input} />
            </>
          )}
          <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">
            Add product
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Unit</th>
              <th className="px-4 py-3">Reorder at</th>
              {showCost && <th className="px-4 py-3">Cost</th>}
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {(products ?? []).map((p) => {
              const cost = costs.get(p.id as string);
              return (
                <tr key={p.id as string} className="border-b last:border-0">
                  <td className="px-4 py-3">{p.sku}</td>
                  <td className="px-4 py-3">
                    {p.name}
                    {p.local_name ? <span className="ml-2 text-slate-500">{p.local_name}</span> : null}
                  </td>
                  <td className="px-4 py-3">{p.unit_of_measure}</td>
                  <td className="px-4 py-3">{String(p.reorder_threshold)}</td>
                  {showCost && (
                    <td className="px-4 py-3">{cost ? `${cost.unit_cost} ${cost.currency}` : "-"}</td>
                  )}
                  <td className="px-4 py-3">{p.status}</td>
                </tr>
              );
            })}
            {(products ?? []).length === 0 && (
              <tr>
                <td colSpan={showCost ? 6 : 5} className="px-4 py-6 text-center text-slate-500">
                  No products yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
