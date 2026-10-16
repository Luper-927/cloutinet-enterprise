"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAccess } from "@/lib/access";

const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");
const HOME = "/dashboard/inventory";

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function createWarehouse(formData: FormData): Promise<void> {
  const { supabase, orgId } = await getAccess();
  const { error } = await supabase.from("warehouses").insert({
    organization_id: orgId,
    code: str(formData.get("code")),
    name: str(formData.get("name")),
    location: str(formData.get("location")) || null,
  });
  if (error) fail(HOME, error.message);
  revalidatePath(HOME);
  redirect(`${HOME}?saved=1`);
}

export async function adjustStock(formData: FormData): Promise<void> {
  const { supabase, orgId } = await getAccess();
  const { error } = await supabase.rpc("adjust_stock", {
    p_org: orgId,
    p_product: str(formData.get("product_id")),
    p_warehouse: str(formData.get("warehouse_id")),
    p_delta: str(formData.get("delta")),
    p_reason: str(formData.get("reason")),
    p_key: str(formData.get("key")),
  });
  if (error) fail(HOME, error.message);
  revalidatePath(HOME);
  redirect(`${HOME}?saved=1`);
}

export async function transferStock(formData: FormData): Promise<void> {
  const { supabase, orgId } = await getAccess();
  const { error } = await supabase.rpc("transfer_stock", {
    p_org: orgId,
    p_product: str(formData.get("product_id")),
    p_from: str(formData.get("from_id")),
    p_to: str(formData.get("to_id")),
    p_qty: str(formData.get("qty")),
    p_key: str(formData.get("key")),
  });
  if (error) fail(HOME, error.message);
  revalidatePath(HOME);
  redirect(`${HOME}?saved=1`);
}

export async function receiveGoods(formData: FormData): Promise<void> {
  const { supabase } = await getAccess();
  const orderId = str(formData.get("order_id"));
  const back = `${HOME}/receive/${orderId}`;

  const lines: { po_item_id: string; quantity: string }[] = [];
  formData.forEach((value, key) => {
    if (key.startsWith("qty_") && typeof value === "string" && value.trim() !== "") {
      lines.push({ po_item_id: key.slice(4), quantity: value.trim() });
    }
  });

  const { error } = await supabase.rpc("receive_goods", {
    p_order: orderId,
    p_warehouse: str(formData.get("warehouse_id")),
    p_lines: lines,
    p_key: str(formData.get("key")),
    p_notes: str(formData.get("notes")) || null,
  });
  if (error) fail(back, error.message);
  revalidatePath(HOME);
  revalidatePath("/dashboard/purchasing");
  redirect(`${HOME}?saved=1`);
}
