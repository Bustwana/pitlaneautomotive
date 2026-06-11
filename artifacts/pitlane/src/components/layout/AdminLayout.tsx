import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { LogOut, LayoutDashboard, Users, Wrench, Calendar, FileText, ChevronLeft, ChevronRight } from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const { logout } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const stored = localStorage.getItem("pitlane-sidebar");
    return stored !== "closed";
  });

  useEffect(() => {
    localStorage.setItem("pitlane-sidebar", sidebarOpen ? "open" : "closed");
  }, [sidebarOpen]);

  const navItems = [
    { label: "Overview", icon: LayoutDashboard, href: "/admin/dashboard" },
    { label: "Subscribers", icon: Users, href: "/admin/subscribers" },
    { label: "Workshops", icon: Wrench, href: "/admin/mechanics" },
    { label: "Bookings", icon: Calendar, href: "/admin/bookings" },
    { label: "Subscriber Signup", icon: FileText, href: "/signup" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-background border-b-2 border-primary flex items-center justify-between px-6 h-14 shadow-md">
        <div className="flex items-center gap-4">
          <div className="font-condensed font-bold text-2xl tracking-wider flex items-center">
            <span className="text-primary">PIT</span>
            <span className="text-foreground">LANE</span>
          </div>
          <div className="h-5 w-px bg-border mx-1" />
          <div className="font-condensed text-muted-foreground uppercase tracking-widest text-xs">
            Admin Portal
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium text-muted-foreground">Administrator</div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside
          className={`relative flex-shrink-0 border-r border-border bg-card/40 flex flex-col transition-all duration-300 ease-in-out overflow-hidden ${
            sidebarOpen ? "w-52" : "w-0"
          }`}
        >
          <nav className="p-3 flex-1 space-y-0.5 min-w-[208px]">
            <div className="text-xs font-condensed uppercase tracking-wider text-muted-foreground mb-3 px-2 pt-2">
              Navigation
            </div>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm whitespace-nowrap ${
                  location === item.href
                    ? "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex-shrink-0 self-start mt-6 z-10 bg-card border border-border rounded-r-md px-0.5 py-3 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {sidebarOpen ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-2xl font-condensed font-bold tracking-wide mb-6">{title}</h1>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
