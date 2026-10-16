import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: memberships } = await supabase
    .from("organization_memberships")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("status", "active");
  if (!memberships || memberships.length === 0) redirect("/onboarding");

  const { data: org } = await supabase
    .from("organizations")
    .select("display_name, legal_name")
    .eq("id", memberships[0].organization_id)
    .single();

  const upcoming = ["Suppliers", "Customers", "Products", "Purchasing", "Inventory", "Shipments"];

  return (
    <div className="min-h-screen md:flex">
      <aside className="bg-[#0A0E27] p-4 text-white md:min-h-screen md:w-60">
        <p className="text-lg font-black">Cloutinet Enterprise</p>
        <p className="mt-1 truncate text-xs text-slate-400">
          {org?.display_name ?? org?.legal_name ?? "Your company"}
        </p>
        <nav className="mt-6 space-y-1 text-sm">
          <Link href="/dashboard" className="block rounded-lg bg-white/10 px-3 py-2">
            Dashboard
          </Link>
          {upcoming.map((item) => (
            <span key={item} className="block px-3 py-2 text-slate-500">
              {item} (coming next)
            </span>
          ))}
        </nav>
        <form action="/auth/signout" method="post" className="mt-6">
          <button type="submit" className="text-sm text-slate-300 hover:text-white">
            Sign out
          </button>
        </form>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
