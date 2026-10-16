import Link from "next/link";
import { notFound } from "next/navigation";
import { getAccess } from "@/lib/access";
import { addSupplierContact, setSupplierStatus } from "../actions";

const input = "rounded-lg border border-slate-300 px-3 py-2 text-sm";

type Contact = {
  id: string;
  contact_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  is_primary: boolean;
};

export default async function SupplierDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { reveal?: string; error?: string; saved?: string };
}) {
  const access = await getAccess();
  if (!access.can("suppliers.read")) notFound();

  const { data: supplier } = await access.supabase
    .from("suppliers")
    .select("*")
    .eq("id", params.id)
    .single();
  if (!supplier) notFound();

  const canView = access.can("supplier_contacts.view");
  const canManage = access.can("supplier_contacts.manage");

  let contacts: Contact[] = [];
  let revealError: string | null = null;
  if (canView && searchParams.reveal === "1") {
    const { data, error } = await access.supabase.rpc("reveal_supplier_contacts", {
      p_supplier: params.id,
    });
    if (error) revealError = error.message;
    else contacts = (data ?? []) as Contact[];
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/dashboard/suppliers" className="text-sm text-blue-600 hover:underline">
        ← Back to suppliers
      </Link>
      <h1 className="text-2xl font-bold">{supplier.legal_name}</h1>

      {searchParams.error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{searchParams.error}</p>
      )}
      {searchParams.saved && (
        <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">Contact saved.</p>
      )}

      <section className="rounded-xl bg-white p-5 shadow-sm">
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-slate-500">Code</dt>
          <dd>{supplier.supplier_code}</dd>
          <dt className="text-slate-500">Local name</dt>
          <dd>{supplier.local_name ?? "-"}</dd>
          <dt className="text-slate-500">Status</dt>
          <dd>{supplier.status}</dd>
          <dt className="text-slate-500">Payment terms</dt>
          <dd>{supplier.payment_terms_days != null ? `${supplier.payment_terms_days} days` : "-"}</dd>
        </dl>

        {access.can("suppliers.update") && (
          <form action={setSupplierStatus} className="mt-4 flex gap-2">
            <input type="hidden" name="id" value={params.id} />
            <select name="status" defaultValue={supplier.status} className={input}>
              <option value="registered">registered</option>
              <option value="approved">approved</option>
              <option value="suspended">suspended</option>
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
            Contact details are restricted. Ask a manager if you need them.
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
          <form action={addSupplierContact} className="mt-5 grid gap-3 border-t pt-4 sm:grid-cols-2">
            <input type="hidden" name="supplier_id" value={params.id} />
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
