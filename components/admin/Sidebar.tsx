"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  ClipboardList,
  UtensilsCrossed,
  History,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/admin", label: "Pedidos", icon: ClipboardList, exact: true },
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/menu", label: "Cardápio", icon: UtensilsCrossed },
  { href: "/admin/history", label: "Histórico", icon: History },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    toast.info("Sessão encerrada.");
    router.push("/auth");
    router.refresh();
  }

  return (
    <aside className="w-60 min-h-screen bg-sidebar flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-sidebar-border">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="relative w-9 h-9 shrink-0 drop-shadow-md">
            <Image src="/logo.png" alt="YakiHami" fill className="object-contain" />
          </div>
          <div className="min-w-0">
            <p className="text-sidebar-foreground font-bold text-sm leading-tight truncate">
              YakiHami PDV
            </p>
            <p className="text-sidebar-foreground/50 text-[11px] uppercase tracking-wide mt-0.5">Painel Admin</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-5">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/60 hover:text-red-400 hover:bg-sidebar-accent transition-all duration-150"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </aside>
  );
}
