"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const navItems = [
  { href: "/dashboard", label: "Purchase Orders" },
  { href: "/dashboard/receive", label: "Receive" },
  { href: "/dashboard/stock", label: "Stock" },
  { href: "/dashboard/withdraw", label: "Withdraw" },
  { href: "/dashboard/items", label: "Items" },
  { href: "/dashboard/locations", label: "Locations" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-neutral-950 text-neutral-100">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-56 md:flex-col md:border-r md:border-neutral-800 md:px-4 md:py-6">
        <div className="text-lg font-semibold mb-8 px-2">S.Track</div>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm ${
                  active ? "bg-neutral-800 text-white" : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={handleSignOut}
          className="mt-auto rounded-lg px-3 py-2 text-left text-sm text-neutral-400 hover:bg-neutral-900 hover:text-white"
        >
          Sign out
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 px-4 py-6 pb-20 md:pb-6">{children}</main>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 flex md:hidden border-t border-neutral-800 bg-neutral-950">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 py-3 text-center text-xs ${active ? "text-white" : "text-neutral-500"}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
