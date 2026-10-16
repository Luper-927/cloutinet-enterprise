"use server";

import { redirect } from "next/navigation";
import { getAccess } from "@/lib/access";

export async function createWarehouse(formData: FormData) {
  const access = await getAccess();
  const code = String(formData.get("code") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();

  const { error } = await access.supabase.from("warehouses").insert({
    organization_id: access.orgId,
    code,
    name,
    location: location || null,
  });

  if (error) {
    redirect(`/dashboard/inventory?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/dashboard/inventory");
}
