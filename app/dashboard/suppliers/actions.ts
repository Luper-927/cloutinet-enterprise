"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAccess } from "@/lib/access";

const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");

export async function createSupplier(formData: FormData): Promise<void> {
  const { supabase, orgId } = await getAccess();
  const days = str(formData.get("payment_terms_days"));
  if (days && !Number.isInteger(Number(days))) {
    redirect(`/dashboard/suppliers?error=${encodeURIComponent("Payment terms must be a whole number of days")}`);
  }
  const { error } = await supabase.from("suppliers").insert({
    organization_id: orgId,
    supplier_code: str(formData.get("supplier_code")),
    legal_name: str(formData.get("legal_name")),
    local_name: str(formData.get("local_name")) || null,
    payment_terms_days: days ? Number(days) : null,
    currency: str(formData.get("currency")).toUpperCase() || null,
  });
  if (error) {
    redirect(`/dashboard/suppliers?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/dashboard/suppliers");
}

export async function setSupplierStatus(formData: FormData): Promise<void> {
  const { supabase } = await getAccess();
  const id = str(formData.get("id"));
  const status = str(formData.get("status"));
  const { error } = await supabase.from("suppliers").update({ status }).eq("id", id);
  if (error) {
    redirect(`/dashboard/suppliers/${id}?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath(`/dashboard/suppliers/${id}`);
}

export async function addSupplierContact(formData: FormData): Promise<void> {
  const { supabase } = await getAccess();
  const id = str(formData.get("supplier_id"));
  const { error } = await supabase.rpc("save_supplier_contact", {
    p_supplier: id,
    p_contact_name: str(formData.get("contact_name")),
    p_phone: str(formData.get("phone")) || null,
    p_email: str(formData.get("email")) || null,
    p_address: str(formData.get("address")) || null,
    p_is_primary: formData.get("is_primary") === "on",
  });
  if (error) {
    redirect(`/dashboard/suppliers/${id}?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath(`/dashboard/suppliers/${id}`);
  redirect(`/dashboard/suppliers/${id}?saved=1`);
}
