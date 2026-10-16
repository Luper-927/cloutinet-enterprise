"use server";

import { redirect } from "next/navigation";
import { getAccess } from "@/lib/access";

export async function createRequest(formData: FormData) {
  const access = await getAccess();

  const productId = String(formData.get("product_id") ?? "");
  const quantity = Number(formData.get("quantity"));
  const cost = String(formData.get("estimated_unit_cost") ?? "").trim();
  const currency = String(formData.get("currency") ?? "").trim().toUpperCase();
  const requiredBy = String(formData.get("required_by") ?? "").trim();
  const justification = String(formData.get("justification") ?? "");

  const { error } = await access.supabase.rpc("create_purchase_request", {
    p_org: access.orgId,
    p_department: null,
    p_justification: justification,
    p_required_by: requiredBy || null,
    p_currency: currency,
    p_items: [
      { product_id: productId, quantity, estimated_unit_cost: cost },
    ],
  });

  if (error) {
    redirect(
      `/dashboard/purchasing/requests/new?error=${encodeURIComponent(error.message)}`
    );
  }
  redirect("/dashboard/purchasing");
}
