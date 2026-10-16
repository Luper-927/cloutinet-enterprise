"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAccess } from "@/lib/access";

const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");

export async function addMember(formData: FormData): Promise<void> {
  const { supabase, orgId } = await getAccess();
  const { error } = await supabase.rpc("add_member_by_email", {
    p_org: orgId,
    p_email: str(formData.get("email")),
    p_role: str(formData.get("role_id")),
  });
  if (error) {
    redirect(`/dashboard/team?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/dashboard/team");
  redirect("/dashboard/team?saved=1");
}

export async function changeMemberRole(formData: FormData): Promise<void> {
  const { supabase } = await getAccess();
  const { error } = await supabase.rpc("set_member_role", {
    p_membership: str(formData.get("membership_id")),
    p_role: str(formData.get("role_id")),
  });
  if (error) {
    redirect(`/dashboard/team?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/dashboard/team");
  redirect("/dashboard/team?saved=1");
}

export async function changeMemberStatus(formData: FormData): Promise<void> {
  const { supabase } = await getAccess();
  const { error } = await supabase.rpc("set_member_status", {
    p_membership: str(formData.get("membership_id")),
    p_status: str(formData.get("status")),
  });
  if (error) {
    redirect(`/dashboard/team?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/dashboard/team");
  redirect("/dashboard/team?saved=1");
}
