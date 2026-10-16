import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Access = {
  supabase: ReturnType<typeof createClient>;
  userId: string;
  orgId: string;
  orgName: string;
  roleNames: string[];
  permissions: string[];
  can: (key: string) => boolean;
};

export async function getAccess(): Promise<Access> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: memberships } = await supabase
    .from("organization_memberships")
    .select("id, organization_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true });
  const membership = memberships?.[0];
  if (!membership) redirect("/onboarding");

  const { data: org } = await supabase
    .from("organizations")
    .select("display_name, legal_name")
    .eq("id", membership.organization_id)
    .single();

  const { data: links } = await supabase
    .from("membership_roles")
    .select("role_id")
    .eq("membership_id", membership.id);
  const roleIds: string[] = (links ?? []).map((l) => l.role_id as string);

  let roleNames: string[] = [];
  let permissions: string[] = [];
  if (roleIds.length > 0) {
    const { data: roles } = await supabase.from("roles").select("name").in("id", roleIds);
    roleNames = (roles ?? []).map((r) => r.name as string);
    const { data: perms } = await supabase
      .from("role_permissions")
      .select("permission_key")
      .in("role_id", roleIds);
    permissions = Array.from(new Set((perms ?? []).map((p) => p.permission_key as string)));
  }

  const set = new Set(permissions);
  return {
    supabase,
    userId: user.id,
    orgId: membership.organization_id as string,
    orgName: (org?.display_name ?? org?.legal_name ?? "Your company") as string,
    roleNames,
    permissions,
    can: (key: string) => set.has(key),
  };
}
