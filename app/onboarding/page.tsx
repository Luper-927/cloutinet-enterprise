"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const router = useRouter();
  const [legalName, setLegalName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [currency, setCurrency] = useState("CNY");
  const [locale, setLocale] = useState("zh-CN");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("create_organization", {
      p_legal_name: legalName,
      p_display_name: displayName || null,
      p_default_currency: currency,
      p_locale: locale,
    });
    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow">
        <h1 className="text-2xl font-bold">Set up your company</h1>
        <p className="mt-1 text-sm text-slate-500">
          This creates your workspace. You become the Owner.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="text"
            required
            placeholder="Legal company name"
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <input
            type="text"
            placeholder="Display name (optional)"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="CNY">CNY (Chinese yuan)</option>
            <option value="USD">USD (US dollar)</option>
            <option value="NGN">NGN (Nigerian naira)</option>
            <option value="EUR">EUR (Euro)</option>
          </select>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="zh-CN">Simplified Chinese</option>
            <option value="en">English</option>
          </select>

          {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create company"}
          </button>
        </form>
      </div>
    </main>
  );
}
