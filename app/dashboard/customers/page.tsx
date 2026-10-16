import Link from "next/link";
import { getAccess } from "@/lib/access";
import { createCustomer } from "./actions";

const input = "rounded-lg border border-slate-300 px-3 py-2 text-sm";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const access = await getAccess();
  if (!access.can("customers.read")) {
    return (
      <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
        You do not have access to customers.
      </p>
    );
  }

  const { data: customers } = await access.supabase
    .from("customers")
    .select("id, customer_code, legal_name, local_name, status")
    .order("legal_name");

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold">Customers</h1>
      <p className="text-sm text-slate-500">
        Contact details are hidden from most staff and every view is recorded.
      </p>

      {searchParams.error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{searchParams.error}</p>
      )}

      {access.can("customers.manage") && (
        <form action={createCustomer} className="grid gap-3 rounded-xl bg-white p-5 shadow-sm sm:grid-cols-2">
          <input name="customer_code" required placeholder="Customer code (e.g. C001)" className={input} />
          <input name="legal_name" required placeholder="Legal name" className={input} />
          <input name="local_name" placeholder="Chinese / local name (optional)" className={input} />
          <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">
            Add customer
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
            </tr>
          </thead>
          <tbody>
            {(customers ?? []).map((c) => (
              <tr key={c.id as string} className="border-b last:border-0">
                <td className="px-4 py-3">{c.customer_code}</td>
                <td className="px-4 py-3">
                  <Link href={`/dashboard/customers/${c.id}`} className="font-medium text-blue-600 hover:underline">
                    {c.legal_name}
                  </Link>
                  {c.local_name ? <span className="ml-2 text-slate-500">{c.local_name}</span> : null}
                </td>
                <td className="px-4 py-3">{c.status}</td>
              </tr>
            ))}
            {(customers ?? []).length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-500">
                  No customers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
