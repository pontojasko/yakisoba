"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  ClipboardList,
  UtensilsCrossed,
  History,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";

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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile menu when pathname changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    toast.info("Sessão encerrada.");
    router.push("/auth");
    router.refresh();
  }

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
      {/* Logo */}
      <div className={cn("py-6 border-b border-sidebar-border relative flex items-center", isCollapsed && !isMobile ? "justify-center px-2" : "px-5")}>
        <Link href="/admin" className="flex items-center gap-3">
          <div className="relative w-9 h-9 shrink-0 drop-shadow-md">
            <Image src="/logo.png" alt="YakiHami" fill className="object-contain" />
          </div>
          {(!isCollapsed || isMobile) && (
            <div className="min-w-0">
              <p className="text-sidebar-foreground font-bold text-sm leading-tight truncate">
                YakiHami PDV
              </p>
              <p className="text-sidebar-foreground/50 text-[11px] uppercase tracking-wide mt-0.5">Painel Admin</p>
            </div>
          )}
        </Link>
        {!isMobile && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3.5 top-7 bg-background text-sidebar-foreground border border-sidebar-border rounded-full p-1 shadow-sm hover:bg-sidebar-accent transition-all z-10 hidden md:flex items-center justify-center cursor-pointer"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-auto">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => {
                if (isMobile) setIsMobileOpen(false);
              }}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                isCollapsed && !isMobile ? "justify-center px-0" : ""
              )}
              title={isCollapsed && !isMobile ? label : undefined}
            >
              <Icon className={cn("h-5 w-5 shrink-0", active ? "text-sidebar-primary-foreground" : "")} />
              {(!isCollapsed || isMobile) && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-5">
        <button
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/60 hover:text-red-400 hover:bg-sidebar-accent transition-all duration-150",
            isCollapsed && !isMobile ? "justify-center px-0" : ""
          )}
          title={isCollapsed && !isMobile ? "Sair" : undefined}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {(!isCollapsed || isMobile) && <span>Sair</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Topbar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-sidebar border-b border-sidebar-border w-full shrink-0">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="relative w-8 h-8 shrink-0">
            <Image src="/logo.png" alt="YakiHami" fill className="object-contain" />
          </div>
          <span className="font-bold text-sm tracking-tight text-sidebar-foreground">YakiHami PDV</span>
        </Link>

        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon" className="text-sidebar-foreground -mr-2" />
            }
          >
            <Menu className="h-6 w-6" />
          </SheetTrigger>
          <SheetContent side="left" showCloseButton className="w-[280px] p-0 bg-sidebar flex flex-col border-r-sidebar-border [&>button]:text-sidebar-foreground">
            <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
            <SidebarContent isMobile={true} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex min-h-screen bg-sidebar flex-col shrink-0 border-r border-sidebar-border transition-all duration-300 relative",
          isCollapsed ? "w-[80px]" : "w-64"
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
