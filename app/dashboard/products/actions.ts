"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAccess } from "@/lib/access";

const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");

export async function createProduct(formData: FormData): Promise<void> {
  const { supabase, orgId, can } = await getAccess();
  const reorder = str(formData.get("reorder_threshold")) || "0";

  const { data, error } = await supabase
    .from("products")
    .insert({
      organization_id: orgId,
      sku: str(formData.get("sku")),
      name: str(formData.get("name")),
      local_name: str(formData.get("local_name")) || null,
      category: str(formData.get("category")) || null,
      unit_of_measure: str(formData.get("unit_of_measure")) || "each",
      reorder_threshold: reorder,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect(
      `/dashboard/products?error=${encodeURIComponent(error?.message ?? "Could not create product")}`
    );
  }

  const cost = str(formData.get("unit_cost"));
  if (cost && can("products.cost.manage")) {
    const { error: costError } = await supabase.from("product_costs").insert({
      organization_id: orgId,
      product_id: data.id,
      currency: (str(formData.get("currency")) || "CNY").toUpperCase(),
      unit_cost: cost,
    });
    if (costError) {
      redirect(`/dashboard/products?error=${encodeURIComponent(costError.message)}`);
    }
  }

  revalidatePath("/dashboard/products");
}
