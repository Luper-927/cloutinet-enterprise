"use server";

import { redirect } from "next/navigation";
import { getAccess } from "@/lib/access";

export async function receiveGoods(formData: FormData) {
  const access = await getAccess();
  const orderId = String(formData.get("order_id") ?? "");
  const warehouse = String(formData.get("warehouse_id") ?? "");
  const key = String(formData.get("key") ?? "");
  const notes = String(formData.get("notes") ?? "");
  const base = `/dashboard/inventory/receive/${orderId}`;

  const lines: { po_item_id: string; quantity: number }[] = [];
  for (const [name, value] of Array.from(formData.entries())) {
    if (!name.startsWith("qty_")) continue;
    const text = String(value).trim();
    const qty = Number(text);
    if (text === "" || !(qty > 0)) continue;
    lines.push({ po_item_id: name.slice(4), quantity: qty });
  }

  const { error } = await access.supabase.rpc("receive_goods", {
    p_order: orderId,
    p_warehouse: warehouse,
    p_lines: lines,
    p_key: key,
    p_notes: notes,
  });

  if (error) redirect(`${base}?error=${encodeURIComponent(error.message)}`);
  redirect("/dashboard/inventory");
}
