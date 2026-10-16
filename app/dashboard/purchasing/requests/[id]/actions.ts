"use server";

import { redirect } from "next/navigation";
import { getAccess } from "@/lib/access";

export async function decideRequest(formData: FormData) {
  const access = await getAccess();
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const note = String(formData.get("note") ?? "");
  const base = `/dashboard/purchasing/requests/${id}`;

  const { error } = await access.supabase.rpc("decide_purchase_request", {
    p_request: id,
    p_decision: decision,
    p_note: note,
  });

  if (error) redirect(`${base}?error=${encodeURIComponent(error.message)}`);
  redirect(base);
}

export async function convertRequest(formData: FormData) {
  const access = await getAccess();
  const id = String(formData.get("id") ?? "");
  const supplier = String(formData.get("supplier_id") ?? "");
  const expected = String(formData.get("expected") ?? "").trim();
  const termsRaw = String(formData.get("terms") ?? "").trim();
  const base = `/dashboard/purchasing/requests/${id}`;

  const prices: Record<string, string> = {};
  for (const [key, value] of Array.from(formData.entries())) {
    if (key.startsWith("price_")) prices[key.slice(6)] = String(value);
  }

  const { error } = await access.supabase.rpc("convert_request_to_order", {
    p_request: id,
    p_supplier: supplier,
    p_expected: expected || null,
    p_terms: termsRaw ? Number(termsRaw) : null,
    p_prices: prices,
  });

  if (error) redirect(`${base}?error=${encodeURIComponent(error.message)}`);
  redirect("/dashboard/purchasing");
}
