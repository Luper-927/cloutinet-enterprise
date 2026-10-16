import Link from "next/link";
import { notFound } from "next/navigation";
import { getAccess } from "@/lib/access";
import { addCustomerContact, setCustomerStatus } from "../actions";

const input = "rounded-lg border border-slate-300 px-3 py-2 text-sm";

type Contact = {
  id: string;
  contact_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  is_primary: boolean;
};

export default async function CustomerDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { reveal?: string; error?: string; saved?: string };
}) {
  const access = await getAccess();
  if (!access.can("customers.read")) notFound();

  const { data: customer } = await access.supabase
    .from("customers")
    .select("*")
    .eq("id", params.id)
    .single();
  if (!customer) notFound();

  const canView = access.can("customer_contacts.view");
  const canManage = access.can("customer_contacts.manage");

  let contacts: Contact[] = [];
  let revealError: string | null = null;
  if (canView && searchParams.reveal === "1") {
    const { data, error } = await access.supabase.rpc("reveal_customer_contacts", {
      p_customer: params.id,
    });
    if (error) revealError = error.message;
    else contacts = (data ?? []) as Contact[];
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/dashboard/customers" className="text-sm text-blue-600 hover:underline">
        ← Back to customers
      </Link>
      <h1 className="text-2xl font-bold">{customer.legal_name}</h1>

      {searchParams.error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{searchParams.error}</p>
      )}
      {searchParams.saved && (
        <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">Contact saved.</p>
      )}

      <section className="rounded-xl bg-white p-5 shadow-sm">
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-slate-500">Code</dt>
          <dd>{customer.customer_code}</dd>
          <dt className="text-slate-500">Local name</dt>
          <dd>{customer.local_name ?? "-"}</dd>
          <dt className="text-slate-500">Status</dt>
          <dd>{customer.status}</dd>
        </dl>

        {access.can("customers.manage") && (
          <form action={setCustomerStatus} className="mt-4 flex gap-2">
            <input type="hidden" name="id" value={params.id} />
            <select name="status" defaultValue={customer.status} className={input}>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
            <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              Update status
            </button>
          </form>
        )}
      </section>

      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold">Contact details</h2>
        {!canView ? (
          <p className="mt-2 text-sm text-slate-500">
            Customer contact details are restricted to authorized managers.
          </p>
        ) : searchParams.reveal === "1" ? (
          <div className="mt-3 space-y-3 text-sm">
            {revealError && <p className="text-red-600">{revealError}</p>}
            {contacts.length === 0 && !revealError && <p className="text-slate-500">No contacts saved.</p>}
            {contacts.map((c) => (
              <div key={c.id} className="rounded-lg border p-3">
                <p className="font-medium">
                  {c.contact_name} {c.is_primary ? <span className="text-xs text-emerald-700">(primary)</span> : null}
                </p>
                <p>{c.phone ?? "-"}</p>
                <p>{c.email ?? "-"}</p>
                <p>{c.address ?? "-"}</p>
              </div>
            ))}
            <p className="text-xs text-slate-400">This view was recorded in the audit log.</p>
          </div>
        ) : (
          <form method="get" className="mt-3">
            <input type="hidden" name="reveal" value="1" />
            <button type="submit" className="rounded-lg border border-slate-300 px-4 py-2 text-sm">
              Show contact details (recorded in the audit log)
            </button>
          </form>
        )}

        {canManage && (
          <form action={addCustomerContact} className="mt-5 grid gap-3 border-t pt-4 sm:grid-cols-2">
            <input type="hidden" name="customer_id" value={params.id} />
            <input name="contact_name" required placeholder="Contact name" className={input} />
            <input name="phone" placeholder="Phone" className={input} />
            <input name="email" type="email" placeholder="Email" className={input} />
            <input name="address" placeholder="Address" className={input} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="is_primary" /> Primary contact
            </label>
            <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
              Save contact
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
