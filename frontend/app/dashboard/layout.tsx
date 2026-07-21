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
    <div className="min-h-screen flex flex-col md:flex-row bg-mist text-body">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:border-rule md:bg-paper md:px-4 md:py-6">
        <div className="mb-8 px-2">
          <div className="text-lg font-semibold text-ink-deep">SorTrack</div>
          <div className="mt-1 border-t-2 border-ink" />
          <div className="mt-[2px] border-t border-rule" />
          <div className="mt-1.5 text-[11px] text-mute">ส.บุญมีฤทธิ์วิศวกรรม</div>
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-2 text-sm ${
                  active
                    ? "bg-ink font-medium text-white"
                    : "text-mute hover:bg-ink-soft hover:text-ink-deep"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={handleSignOut}
          className="mt-auto cursor-pointer rounded-md px-3 py-2 text-left text-sm text-mute hover:bg-ink-soft hover:text-ink-deep"
        >
          Sign out
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 px-4 py-6 pb-24 md:px-8 md:pb-6">{children}</main>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 flex md:hidden border-t border-rule bg-paper">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 py-3 text-center text-xs ${
                active ? "font-medium text-ink" : "text-mute"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
