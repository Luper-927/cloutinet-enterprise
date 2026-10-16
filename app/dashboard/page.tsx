import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: memberships } = await supabase
    .from("organization_memberships")
    .select("id, organization_id")
    .eq("user_id", user.id)
    .eq("status", "active");
  const membership = memberships?.[0];
  if (!membership) return null;

  const [orgRes, roleLinksRes, modulesRes] = await Promise.all([
    supabase
      .from("organizations")
      .select("legal_name, display_name, default_currency, timezone, locale")
      .eq("id", membership.organization_id)
      .single(),
    supabase.from("membership_roles").select("role_id").eq("membership_id", membership.id),
    supabase
      .from("module_entitlements")
      .select("module_key, enabled")
      .eq("organization_id", membership.organization_id)
      .order("module_key"),
  ]);

  const org = orgRes.data;
  const roleIds: string[] = (roleLinksRes.data ?? []).map((r) => r.role_id as string);

  let roleNames: string[] = [];
  let permissionKeys: string[] = [];
  if (roleIds.length > 0) {
    const { data: roles } = await supabase.from("roles").select("name").in("id", roleIds);
    roleNames = (roles ?? []).map((r) => r.name as string);
    const { data: perms } = await supabase
      .from("role_permissions")
      .select("permission_key")
      .in("role_id", roleIds);
    permissionKeys = Array.from(
      new Set((perms ?? []).map((p) => p.permission_key as string))
    ).sort();
  }

  const modules = modulesRes.data ?? [];

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">
        {org?.display_name ?? org?.legal_name ?? "Dashboard"}
      </h1>

      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold">Company</h2>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <dt className="text-slate-500">Legal name</dt>
          <dd>{org?.legal_name}</dd>
          <dt className="text-slate-500">Currency</dt>
          <dd>{org?.default_currency}</dd>
          <dt className="text-slate-500">Time zone</dt>
          <dd>{org?.timezone}</dd>
          <dt className="text-slate-500">Language</dt>
          <dd>{org?.locale}</dd>
        </dl>
      </section>

      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold">Your role</h2>
        <p className="mt-2 text-sm">{roleNames.join(", ") || "No role assigned"}</p>
        <p className="mt-1 text-xs text-slate-500">
          {permissionKeys.length} permissions: {permissionKeys.join(", ")}
        </p>
      </section>

      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold">Modules</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {modules.map((m) => (
            <li key={m.module_key as string}>
              {m.module_key as string}: {m.enabled ? "on" : "off"}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
