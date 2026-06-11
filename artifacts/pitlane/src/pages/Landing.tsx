import { Link } from "wouter";
import { ArrowRight, Wrench, ShieldCheck, CalendarCheck } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
        {/* Background texture */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_60%,background)] pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto space-y-8">
          {/* Logo */}
          <div>
            <h1 className="text-6xl sm:text-8xl font-condensed font-black tracking-tight">
              <span className="text-primary">PIT</span>
              <span className="text-foreground">LANE</span>
            </h1>
            <p className="text-xs font-condensed uppercase tracking-[0.35em] text-muted-foreground mt-2">
              Automotive Group
            </p>
          </div>

          {/* Tagline */}
          <div className="space-y-3">
            <p className="text-2xl sm:text-3xl font-condensed font-bold text-foreground leading-snug">
              Your car, looked after.<br />
              <span className="text-primary">Every single year.</span>
            </p>
            <p className="text-muted-foreground text-base max-w-md mx-auto">
              A subscription service that keeps your vehicle serviced, checked, and road-ready — matched with a trusted local workshop.
            </p>
          </div>

          {/* Primary CTA */}
          <div>
            <Link href="/signup">
              <button className="inline-flex items-center gap-3 bg-primary hover:bg-primary/90 text-primary-foreground font-condensed font-bold text-xl uppercase tracking-widest px-10 py-5 rounded-lg transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98]">
                Join Now
                <ArrowRight className="h-5 w-5" />
              </button>
            </Link>
            <p className="text-xs text-muted-foreground mt-3 font-condensed tracking-wide">
              Plans from $7/week · No lock-in contracts
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {[
              { icon: CalendarCheck, text: "Scheduled servicing" },
              { icon: Wrench, text: "Partner workshops" },
              { icon: ShieldCheck, text: "Mid-year check-ups" },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-2 bg-card border border-border/60 rounded-full px-4 py-2"
              >
                <Icon className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-condensed uppercase tracking-wider text-muted-foreground">
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer — staff links */}
      <div className="py-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 px-6">
        <span className="text-xs text-muted-foreground/50 font-condensed uppercase tracking-wider hidden sm:block">
          Staff access
        </span>
        <Link
          href="/login?tab=mechanic"
          className="text-xs font-condensed uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
        >
          Mechanic Portal
        </Link>
        <span className="text-muted-foreground/30 hidden sm:block">·</span>
        <Link
          href="/login"
          className="text-xs font-condensed uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
        >
          Admin Login
        </Link>
      </div>
    </div>
  );
}
