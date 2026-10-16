"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAccess } from "@/lib/access";

const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");

export async function createCustomer(formData: FormData): Promise<void> {
  const { supabase, orgId } = await getAccess();
  const { error } = await supabase.from("customers").insert({
    organization_id: orgId,
    customer_code: str(formData.get("customer_code")),
    legal_name: str(formData.get("legal_name")),
    local_name: str(formData.get("local_name")) || null,
  });
  if (error) {
    redirect(`/dashboard/customers?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/dashboard/customers");
}

export async function setCustomerStatus(formData: FormData): Promise<void> {
  const { supabase } = await getAccess();
  const id = str(formData.get("id"));
  const status = str(formData.get("status"));
  const { error } = await supabase.from("customers").update({ status }).eq("id", id);
  if (error) {
    redirect(`/dashboard/customers/${id}?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath(`/dashboard/customers/${id}`);
}

export async function addCustomerContact(formData: FormData): Promise<void> {
  const { supabase } = await getAccess();
  const id = str(formData.get("customer_id"));
  const { error } = await supabase.rpc("save_customer_contact", {
    p_customer: id,
    p_contact_name: str(formData.get("contact_name")),
    p_phone: str(formData.get("phone")) || null,
    p_email: str(formData.get("email")) || null,
    p_address: str(formData.get("address")) || null,
    p_is_primary: formData.get("is_primary") === "on",
  });
  if (error) {
    redirect(`/dashboard/customers/${id}?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath(`/dashboard/customers/${id}`);
  redirect(`/dashboard/customers/${id}?saved=1`);
}
