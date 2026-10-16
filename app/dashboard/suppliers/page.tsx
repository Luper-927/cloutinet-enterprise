import Link from "next/link";
import { getAccess } from "@/lib/access";
import { createSupplier } from "./actions";

const input = "rounded-lg border border-slate-300 px-3 py-2 text-sm";

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const access = await getAccess();
  if (!access.can("suppliers.read")) {
    return (
      <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
        You do not have access to suppliers.
      </p>
    );
  }

  const { data: suppliers } = await access.supabase
    .from("suppliers")
    .select("id, supplier_code, legal_name, local_name, status, payment_terms_days, currency")
    .order("legal_name");

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold">Suppliers</h1>

      {searchParams.error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{searchParams.error}</p>
      )}

      {access.can("suppliers.create") && (
        <form action={createSupplier} className="grid gap-3 rounded-xl bg-white p-5 shadow-sm sm:grid-cols-2">
          <input name="supplier_code" required placeholder="Supplier code (e.g. S001)" className={input} />
          <input name="legal_name" required placeholder="Legal name" className={input} />
          <input name="local_name" placeholder="Chinese / local name (optional)" className={input} />
          <input name="currency" maxLength={3} placeholder="Currency (e.g. CNY)" className={input} />
          <input name="payment_terms_days" type="number" min={0} max={365} placeholder="Payment terms (days)" className={input} />
          <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">
            Add supplier
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Terms</th>
            </tr>
          </thead>
          <tbody>
            {(suppliers ?? []).map((s) => (
              <tr key={s.id as string} className="border-b last:border-0">
                <td className="px-4 py-3">{s.supplier_code}</td>
                <td className="px-4 py-3">
                  <Link href={`/dashboard/suppliers/${s.id}`} className="font-medium text-blue-600 hover:underline">
                    {s.legal_name}
                  </Link>
                  {s.local_name ? <span className="ml-2 text-slate-500">{s.local_name}</span> : null}
                </td>
                <td className="px-4 py-3">{s.status}</td>
                <td className="px-4 py-3">
                  {s.payment_terms_days != null ? `${s.payment_terms_days} days` : "-"} {s.currency ?? ""}
                </td>
              </tr>
            ))}
            {(suppliers ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                  No suppliers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
