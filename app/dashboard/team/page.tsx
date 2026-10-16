import { getAccess } from "@/lib/access";
import { addMember, changeMemberRole, changeMemberStatus } from "./actions";

const input = "rounded-lg border border-slate-300 px-3 py-2 text-sm";

type Member = {
  membership_id: string;
  member_user_id: string;
  email: string | null;
  display_name: string | null;
  status: string;
  roles: string[];
};

type Role = { id: string; name: string; description: string | null };

export default async function TeamPage({
  searchParams,
}: {
  searchParams: { error?: string; saved?: string };
}) {
  const access = await getAccess();
  if (!access.can("organization.members.manage")) {
    return (
      <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
        You do not have access to team management.
      </p>
    );
  }

  const [teamRes, rolesRes] = await Promise.all([
    access.supabase.rpc("list_team", { p_org: access.orgId }),
    access.supabase.from("roles").select("id, name, description").order("name"),
  ]);
  const members = (teamRes.data ?? []) as Member[];
  const roles = (rolesRes.data ?? []) as Role[];
  const canAssign = access.can("organization.roles.manage");

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold">Team</h1>

      {searchParams.error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{searchParams.error}</p>
      )}
      {searchParams.saved && (
        <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">Saved.</p>
      )}

      {canAssign && (
        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Add a team member</h2>
          <p className="mt-1 text-xs text-slate-500">
            The person must sign up on this app first. Then enter the email they used.
          </p>
          <form action={addMember} className="mt-3 grid gap-3 sm:grid-cols-3">
            <input name="email" type="email" required placeholder="Their email" className={input} />
            <select name="role_id" required className={input} defaultValue="">
              <option value="" disabled>
                Choose a role
              </option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
              Add member
            </button>
          </form>
        </section>
      )}

      <section className="space-y-3">
        {members.map((m) => {
          const isMe = m.member_user_id === access.userId;
          return (
            <div key={m.membership_id} className="rounded-xl bg-white p-4 shadow-sm">
              <p className="font-medium">
                {m.display_name ?? m.email} {isMe ? <span className="text-xs text-slate-400">(you)</span> : null}
              </p>
              <p className="text-sm text-slate-500">{m.email}</p>
              <p className="mt-1 text-sm">
                {m.roles.join(", ") || "No role"} ·{" "}
                <span className={m.status === "active" ? "text-emerald-700" : "text-red-600"}>{m.status}</span>
              </p>

              {!isMe && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {canAssign && (
                    <form action={changeMemberRole} className="flex gap-2">
                      <input type="hidden" name="membership_id" value={m.membership_id} />
                      <select name="role_id" className={input} defaultValue="">
                        <option value="" disabled>
                          Change role
                        </option>
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                      <button type="submit" className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white">
                        Save
                      </button>
                    </form>
                  )}
                  <form action={changeMemberStatus}>
                    <input type="hidden" name="membership_id" value={m.membership_id} />
                    <input type="hidden" name="status" value={m.status === "active" ? "disabled" : "active"} />
                    <button type="submit" className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
                      {m.status === "active" ? "Disable access" : "Restore access"}
                    </button>
                  </form>
                </div>
              )}
            </div>
          );
        })}
      </section>

      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold">What each role can do</h2>
        <ul className="mt-2 space-y-1 text-sm text-slate-600">
          {roles.map((r) => (
            <li key={r.id}>
              <span className="font-medium text-slate-900">{r.name}:</span> {r.description}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
