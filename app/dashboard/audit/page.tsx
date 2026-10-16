import { getAccess } from "@/lib/access";

type Entry = {
  id: number;
  created_at: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  actor_email: string | null;
  change_summary: Record<string, unknown>;
};

export default async function AuditPage() {
  const access = await getAccess();
  if (!access.can("audit_logs.read")) {
    return (
      <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
        You do not have access to the activity log.
      </p>
    );
  }

  const { data } = await access.supabase.rpc("list_audit_log", {
    p_org: access.orgId,
    p_limit: 200,
  });
  const entries = (data ?? []) as Entry[];

  return (
    <div className="max-w-4xl space-y-4">
      <h1 className="text-2xl font-bold">Activity log</h1>
      <p className="text-sm text-slate-500">
        Every change, and every time someone views protected contact details. Entries cannot be edited or deleted. Times are UTC.
      </p>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Who</th>
              <th className="px-4 py-3">What</th>
              <th className="px-4 py-3">Record</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-b align-top last:border-0">
                <td className="whitespace-nowrap px-4 py-3">
                  {new Date(e.created_at).toISOString().replace("T", " ").slice(0, 16)}
                </td>
                <td className="px-4 py-3">{e.actor_email ?? "system"}</td>
                <td className="px-4 py-3">{e.action}</td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {e.resource_type} {e.resource_id ? e.resource_id.slice(0, 8) : ""}
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                  Nothing recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
