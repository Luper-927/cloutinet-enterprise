"use server";

import { redirect } from "next/navigation";
import { getAccess } from "@/lib/access";

export async function createShipment(formData: FormData) {
  const access = await getAccess();
  const orderId = String(formData.get("order_id") ?? "");
  const expected = String(formData.get("expected") ?? "").trim();

  const { data, error } = await access.supabase.rpc("create_shipment", {
    p_order: orderId,
    p_carrier: String(formData.get("carrier") ?? ""),
    p_tracking: String(formData.get("tracking") ?? ""),
    p_origin: String(formData.get("origin") ?? ""),
    p_destination: String(formData.get("destination") ?? ""),
    p_expected: expected || null,
    p_notes: String(formData.get("notes") ?? ""),
  });

  if (error) {
    redirect(`/dashboard/shipments/new?error=${encodeURIComponent(error.message)}`);
  }
  redirect(`/dashboard/shipments/${data}`);
}
