"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const router = useRouter();
  const [myEmail, setMyEmail] = useState("");
  const [legalName, setLegalName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [currency, setCurrency] = useState("CNY");
  const [locale, setLocale] = useState("zh-CN");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setMyEmail(data.user?.email ?? ""));
  }, []);

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
      <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-8 shadow">
        <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Were you invited to a company?</p>
          <p className="mt-1">
            Do not create a new company. Ask your administrator to add you with this email
            {myEmail ? `: ${myEmail}` : ""}, then refresh this page.
          </p>
          <button
            type="button"
            onClick={() => router.refresh()}
            className="mt-2 rounded-lg border border-amber-300 px-3 py-1 text-xs"
          >
            I have been added, refresh
          </button>
        </div>

        <h1 className="text-2xl font-bold">Or set up your own company</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
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
