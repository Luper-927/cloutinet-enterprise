"use server";

import { redirect } from "next/navigation";
import { getAccess } from "@/lib/access";

export async function addShipmentUpdate(formData: FormData) {
  const access = await getAccess();
  const id = String(formData.get("id") ?? "");
  const base = `/dashboard/shipments/${id}`;

  const { error } = await access.supabase.rpc("add_shipment_event", {
    p_shipment: id,
    p_status: String(formData.get("status") ?? ""),
    p_description: String(formData.get("description") ?? ""),
    p_event_at: null,
  });

  if (error) redirect(`${base}?error=${encodeURIComponent(error.message)}`);
  redirect(base);
}
