"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAccess } from "@/lib/access";

const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function createRequest(formData: FormData): Promise<void> {
  const back = "/dashboard/purchasing/requests/new";
  const { supabase, orgId } = await getAccess();

  const items: { product_id: string; quantity: string; estimated_unit_cost?: string }[] = [];
  for (let i = 1; i <= 5; i++) {
    const product = str(formData.get(`product_${i}`));
    const qty = str(formData.get(`quantity_${i}`));
    if (!product && !qty) continue;
    if (!product || !qty) fail(back, `Line ${i}: choose a product and a quantity.`);
    const cost = str(formData.get(`cost_${i}`));
    items.push({
      product_id: product,
      quantity: qty,
      ...(cost ? { estimated_unit_cost: cost } : {}),
    });
  }

  const { data, error } = await supabase.rpc("create_purchase_request", {
    p_org: orgId,
    p_department: null,
    p_justification: str(formData.get("justification")) || null,
    p_required_by: str(formData.get("required_by")) || null,
    p_currency: (str(formData.get("currency")) || "CNY").toUpperCase(),
    p_items: items,
  });
  if (error) fail(back, error.message);

  revalidatePath("/dashboard/purchasing");
  redirect(`/dashboard/purchasing/requests/${data}`);
}

export async function decideRequest(formData: FormData): Promise<void> {
  const { supabase } = await getAccess();
  const id = str(formData.get("request_id"));
  const path = `/dashboard/purchasing/requests/${id}`;
  const { error } = await supabase.rpc("decide_purchase_request", {
    p_request: id,
    p_decision: str(formData.get("decision")),
    p_note: str(formData.get("note")) || null,
  });
  if (error) fail(path, error.message);
  revalidatePath(path);
  redirect(path);
}

export async function cancelRequest(formData: FormData): Promise<void> {
  const { supabase } = await getAccess();
  const id = str(formData.get("request_id"));
  const path = `/dashboard/purchasing/requests/${id}`;
  const { error } = await supabase.rpc("cancel_purchase_request", {
    p_request: id,
    p_note: str(formData.get("note")) || null,
  });
  if (error) fail(path, error.message);
  revalidatePath(path);
  redirect(path);
}

export async function convertRequest(formData: FormData): Promise<void> {
  const { supabase } = await getAccess();
  const id = str(formData.get("request_id"));
  const path = `/dashboard/purchasing/requests/${id}`;

  const prices: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (key.startsWith("price_") && typeof value === "string" && value.trim() !== "") {
      prices[key.slice(6)] = value.trim();
    }
  });

  const terms = str(formData.get("terms"));
  const { data, error } = await supabase.rpc("convert_request_to_order", {
    p_request: id,
    p_supplier: str(formData.get("supplier_id")),
    p_expected: str(formData.get("expected")) || null,
    p_terms: terms ? Number(terms) : null,
    p_prices: prices,
  });
  if (error) fail(path, error.message);
  revalidatePath("/dashboard/purchasing");
  redirect(`/dashboard/purchasing/orders/${data}`);
}

export async function decideOrder(formData: FormData): Promise<void> {
  const { supabase } = await getAccess();
  const id = str(formData.get("order_id"));
  const path = `/dashboard/purchasing/orders/${id}`;
  const { error } = await supabase.rpc("decide_purchase_order", {
    p_order: id,
    p_decision: str(formData.get("decision")),
    p_note: str(formData.get("note")) || null,
  });
  if (error) fail(path, error.message);
  revalidatePath(path);
  redirect(path);
}

export async function advanceOrder(formData: FormData): Promise<void> {
  const { supabase } = await getAccess();
  const id = str(formData.get("order_id"));
  const path = `/dashboard/purchasing/orders/${id}`;
  const { error } = await supabase.rpc("advance_purchase_order", {
    p_order: id,
    p_to: str(formData.get("to")),
    p_note: str(formData.get("note")) || null,
  });
  if (error) fail(path, error.message);
  revalidatePath(path);
  redirect(path);
}
