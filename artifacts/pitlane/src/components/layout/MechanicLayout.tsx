import React from "react";
import { useAuth } from "@/lib/auth";
import { LogOut } from "lucide-react";

interface MechanicLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function MechanicLayout({ children, title }: MechanicLayoutProps) {
  const { logout, mechanic } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b-2 border-primary flex items-center justify-between px-6 h-16 shadow-md">
        <div className="flex items-center gap-4">
          <div className="font-condensed font-bold text-2xl tracking-wider flex items-center">
            <span className="text-primary">PIT</span>
            <span className="text-foreground">LANE</span>
          </div>
          <div className="h-6 w-px bg-border mx-2" />
          <div className="font-condensed text-muted-foreground uppercase tracking-widest text-sm">
            Mechanic Portal
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-sm font-medium">{mechanic?.name || "Workshop"}</div>
          <button 
            onClick={logout}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-condensed font-bold tracking-wide">{title}</h1>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
