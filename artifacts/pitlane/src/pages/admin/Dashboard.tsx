import React, { useState } from "react";
import { useLocation } from "wouter";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  useGetDashboardStats,
  useListSubscribers,
  useListBookings,
  useListMechanics,
  useUpdateSubscriber,
  getListSubscribersQueryKey,
  getGetDashboardStatsQueryKey,
  type ServiceAlert,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { StatCard } from "@/components/ui/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, AlertTriangle, CalendarPlus, Clock, ChevronRight, TrendingUp, Users, Wrench, Calendar, DollarSign } from "lucide-react";

type View = "overview" | "subscribers" | "bookings" | "revenue" | "workshops";

const tierStyle = (tier: string) => {
  if (tier === "annual") return "text-green-500 border-green-500/30 bg-green-500/5";
  if (tier === "standard") return "text-primary border-primary/30 bg-primary/5";
  return "text-muted-foreground border-border";
};

const statusStyle = (status: string) => {
  if (status === "active") return "text-green-500 border-green-500/30";
  if (status === "pending") return "text-yellow-500 border-yellow-500/30";
  return "text-muted-foreground border-border";
};

function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <button
      onClick={onBack}
      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 group"
    >
      <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
      Back to Overview
    </button>
  );
}

function SectionCard({
  title,
  icon: Icon,
  onClick,
  children,
  action,
}: {
  title: string;
  icon: React.ElementType;
  onClick?: () => void;
  children: React.ReactNode;
  action?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
      <div
        className={`p-4 border-b border-border bg-card/50 flex justify-between items-center ${onClick ? "cursor-pointer hover:bg-muted/40 transition-colors" : ""}`}
        onClick={onClick}
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <h3 className="font-condensed font-bold uppercase tracking-wider text-base">{title}</h3>
        </div>
        {onClick && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors font-condensed uppercase tracking-wider">
            {action ?? "View all"} <ChevronRight className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

type QuickEdit = { subscriberId: number; subscriberName: string; currentDate: string };

export default function Dashboard() {
  const [view, setView] = useState<View>("overview");
  const [, setLocation] = useLocation();
  const [quickEdit, setQuickEdit] = useState<QuickEdit | null>(null);
  const [quickEditDate, setQuickEditDate] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const updateSub = useUpdateSubscriber();
  const { data: stats, isLoading } = useGetDashboardStats();

  if (isLoading) {
    return (
      <AdminLayout title="System Overview">
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-72 w-full" />
            <Skeleton className="h-72 w-full" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!stats) return null;

  const { tierBreakdown, revenueBreakdown } = stats;

  // ─── SUBSCRIBERS DRILL-DOWN ────────────────────────────────────────────────
  if (view === "subscribers") {
    return (
      <AdminLayout title="Subscribers">
        <SubscribersView onBack={() => setView("overview")} stats={stats} />
      </AdminLayout>
    );
  }

  // ─── BOOKINGS DRILL-DOWN ───────────────────────────────────────────────────
  if (view === "bookings") {
    return (
      <AdminLayout title="Bookings">
        <BookingsView onBack={() => setView("overview")} />
      </AdminLayout>
    );
  }

  // ─── WORKSHOPS DRILL-DOWN ──────────────────────────────────────────────────
  if (view === "workshops") {
    return (
      <AdminLayout title="Partner Workshops">
        <WorkshopsView onBack={() => setView("overview")} stats={stats} />
      </AdminLayout>
    );
  }

  // ─── REVENUE DRILL-DOWN ────────────────────────────────────────────────────
  if (view === "revenue") {
    return (
      <AdminLayout title="Revenue Breakdown">
        <RevenueView onBack={() => setView("overview")} stats={stats} />
      </AdminLayout>
    );
  }

  // ─── OVERVIEW ──────────────────────────────────────────────────────────────
  const total = tierBreakdown.basic + tierBreakdown.standard + tierBreakdown.annual || 1;

  return (
    <AdminLayout title="System Overview">
      <div className="space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="cursor-pointer" onClick={() => setView("subscribers")}>
            <StatCard label="Total Subscribers" value={stats.totalSubscribers} />
          </div>
          <div className="cursor-pointer" onClick={() => setView("workshops")}>
            <StatCard label="Active Workshops" value={stats.activeMechanics} />
          </div>
          <div className="cursor-pointer" onClick={() => setView("bookings")}>
            <StatCard label="Total Bookings" value={stats.totalBookings} />
          </div>
          <div className="cursor-pointer" onClick={() => setView("revenue")}>
            <StatCard
              label="Annual Revenue"
              value={`$${stats.totalRevenue.toLocaleString()}`}
              valueClassName="text-green-500"
            />
          </div>
        </div>

        {/* Tier breakdown bar */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-condensed uppercase tracking-widest text-muted-foreground">Tier Distribution</p>
            <p className="text-xs text-muted-foreground">{stats.weeklyRunRate > 0 ? `$${stats.weeklyRunRate.toFixed(2)}/wk run rate` : "No subscribers yet"}</p>
          </div>
          <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
            {tierBreakdown.basic > 0 && (
              <div className="bg-muted-foreground/40 rounded-full" style={{ width: `${(tierBreakdown.basic / total) * 100}%` }} />
            )}
            {tierBreakdown.standard > 0 && (
              <div className="bg-primary/70 rounded-full" style={{ width: `${(tierBreakdown.standard / total) * 100}%` }} />
            )}
            {tierBreakdown.annual > 0 && (
              <div className="bg-green-500/70 rounded-full" style={{ width: `${(tierBreakdown.annual / total) * 100}%` }} />
            )}
          </div>
          <div className="flex gap-4 mt-2.5">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-muted-foreground/40 inline-block" />Basic {tierBreakdown.basic}</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary/70 inline-block" />Standard {tierBreakdown.standard}</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500/70 inline-block" />Annual {tierBreakdown.annual}</span>
          </div>
        </div>

        {/* Service Alerts */}
        {stats.serviceAlerts.length > 0 && (
          <AlertsPanel
            alerts={stats.serviceAlerts}
            onEditService={(id, name, date) => {
              setQuickEdit({ subscriberId: id, subscriberName: name, currentDate: date });
              setQuickEditDate(date ? date.split("T")[0] : "");
            }}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Subscribers */}
          <SectionCard title="Recent Subscribers" icon={Users} onClick={() => setView("subscribers")} action="View all">
            <div>
              {stats.recentSubscribers.length === 0 ? (
                <div className="px-4 py-8 text-center text-muted-foreground text-sm">No subscribers yet</div>
              ) : (
                stats.recentSubscribers.map((sub) => (
                  <div key={sub.id} className="flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{sub.fname} {sub.lname}</div>
                      <div className="text-xs text-muted-foreground truncate">{sub.year} {sub.make} {sub.model}</div>
                    </div>
                    <Badge variant="outline" className={`text-xs font-condensed shrink-0 ${tierStyle(sub.tier)}`}>
                      {sub.tier.toUpperCase()}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </SectionCard>

          {/* Upcoming Bookings */}
          <SectionCard title="Upcoming Bookings" icon={Calendar} onClick={() => setView("bookings")} action="View all">
            <div>
              {stats.upcomingBookings.length === 0 ? (
                <div className="px-4 py-8 text-center text-muted-foreground text-sm">No upcoming bookings</div>
              ) : (
                stats.upcomingBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{booking.service}</div>
                      <div className="text-xs text-muted-foreground">
                        {booking.date ? new Date(booking.date).toLocaleDateString() : "TBD"}
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-xs font-condensed shrink-0 ${statusStyle(booking.status)}`}>
                      {booking.status.toUpperCase()}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Quick-edit service date dialog */}
      <Dialog open={!!quickEdit} onOpenChange={(open) => { if (!open) setQuickEdit(null); }}>
        <DialogContent className="border-t-4 border-t-primary bg-card max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-condensed text-xl uppercase tracking-wider flex items-center gap-2">
              <CalendarPlus className="h-5 w-5 text-primary" />
              Set Service Date
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <p className="text-sm text-muted-foreground">{quickEdit?.subscriberName}</p>
            <Input
              type="date"
              value={quickEditDate}
              onChange={(e) => setQuickEditDate(e.target.value)}
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setQuickEdit(null)}
              className="font-condensed tracking-wider uppercase"
            >
              Cancel
            </Button>
            <Button
              disabled={!quickEditDate || updateSub.isPending}
              onClick={() => {
                if (!quickEdit || !quickEditDate) return;
                updateSub.mutate(
                  { id: quickEdit.subscriberId, data: { nextService: quickEditDate } as any },
                  {
                    onSuccess: () => {
                      queryClient.invalidateQueries({ queryKey: getListSubscribersQueryKey() });
                      queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
                      toast({ title: "Service date updated." });
                      setQuickEdit(null);
                    },
                  }
                );
              }}
              className="font-condensed tracking-wider uppercase"
            >
              {updateSub.isPending ? "Saving…" : "Save Date"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

// ─── ALERTS PANEL ────────────────────────────────────────────────────────────
function AlertsPanel({ alerts, onEditService }: { alerts: ServiceAlert[]; onEditService: (id: number, name: string, date: string) => void }) {
  const overdue = alerts.filter((a) => a.alertStatus === "overdue");
  const upcoming = alerts.filter((a) => a.alertStatus === "upcoming");

  const daysLabel = (daysUntil: number) => {
    if (daysUntil < 0) return `${Math.abs(daysUntil)}d overdue`;
    if (daysUntil === 0) return "Due today";
    return `Due in ${daysUntil}d`;
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-destructive/5 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        <h3 className="font-condensed font-bold uppercase tracking-wider text-base text-destructive">
          Service Alerts
        </h3>
        <span className="ml-auto text-xs text-muted-foreground">
          {overdue.length > 0 && <span className="text-destructive font-medium">{overdue.length} overdue</span>}
          {overdue.length > 0 && upcoming.length > 0 && <span className="mx-1">·</span>}
          {upcoming.length > 0 && <span className="text-yellow-500 font-medium">{upcoming.length} upcoming</span>}
        </span>
      </div>
      <div>
        {alerts.map((alert) => {
          const isOverdue = alert.alertStatus === "overdue";
          return (
            <div
              key={alert.subscriberId}
              className="flex items-center gap-4 px-4 py-3.5 border-b border-border/50 last:border-0"
            >
              <div className={`shrink-0 ${isOverdue ? "text-destructive" : "text-yellow-500"}`}>
                {isOverdue
                  ? <AlertTriangle className="h-4 w-4" />
                  : <Clock className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{alert.subscriberName}</div>
                <div className="text-xs text-muted-foreground mt-0.5 truncate">
                  {alert.vehicleDescription || "No vehicle"}{alert.workshopName ? ` · ${alert.workshopName}` : ""}
                </div>
              </div>
              <div className="shrink-0 text-right space-y-0.5">
                <div className={`text-xs font-condensed font-bold ${isOverdue ? "text-destructive" : "text-yellow-500"}`}>
                  {daysLabel(alert.daysUntil)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(alert.nextService).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              </div>
              <Badge variant="outline" className={`text-xs font-condensed shrink-0 ${tierStyle(alert.tier)}`}>
                {alert.tier.toUpperCase()}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 h-8 px-2.5 font-condensed tracking-wider uppercase text-xs border-primary/40 text-primary hover:bg-primary/10"
                onClick={() => onEditService(alert.subscriberId, alert.subscriberName, alert.nextService)}
              >
                <CalendarPlus className="h-3.5 w-3.5 mr-1" />
                Reschedule
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── SUBSCRIBERS VIEW ─────────────────────────────────────────────────────────
function SubscribersView({ onBack, stats }: { onBack: () => void; stats: any }) {
  const { data: subscribers, isLoading } = useListSubscribers();
  const { data: mechanics } = useListMechanics();
  const { tierBreakdown } = stats;
  const total = subscribers?.length || 0;

  return (
    <div>
      <BackButton onBack={onBack} />
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Basic", count: tierBreakdown.basic, rate: "$7/wk", color: "text-muted-foreground" },
            { label: "Standard", count: tierBreakdown.standard, rate: "$13/wk", color: "text-primary" },
            { label: "Annual", count: tierBreakdown.annual, rate: "$299–$450/yr", color: "text-green-500" },
          ].map((t) => (
            <div key={t.label} className="bg-card border border-border rounded-lg p-4 text-center">
              <div className={`text-3xl font-condensed font-bold ${t.color}`}>{t.count}</div>
              <div className="text-xs font-condensed uppercase tracking-wider text-muted-foreground mt-1">{t.label}</div>
              <div className="text-xs text-muted-foreground mt-1">{t.rate}</div>
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-card/50 flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="font-condensed font-bold uppercase tracking-wider text-base">All Subscribers ({total})</h3>
          </div>
          {isLoading ? (
            <div className="p-4 space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            subscribers?.map((sub) => {
              const workshop = mechanics?.find((m) => m.id === sub.mechId);
              return (
                <div key={sub.id} className="flex items-center gap-4 px-4 py-3.5 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{sub.fname} {sub.lname}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{sub.year} {sub.make} {sub.model}{sub.suburb ? ` · ${sub.suburb}` : ""}</div>
                  </div>
                  <div className="text-xs text-muted-foreground hidden sm:block shrink-0">{workshop?.name ?? "Unassigned"}</div>
                  <div className="text-xs text-muted-foreground hidden md:block shrink-0">
                    {sub.nextService ? new Date(sub.nextService).toLocaleDateString() : "No service set"}
                  </div>
                  <Badge variant="outline" className={`text-xs font-condensed shrink-0 ${tierStyle(sub.tier)}`}>
                    {sub.tier.toUpperCase()}
                  </Badge>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ─── BOOKINGS VIEW ────────────────────────────────────────────────────────────
function BookingsView({ onBack }: { onBack: () => void }) {
  const { data: bookings, isLoading } = useListBookings();
  const { data: subscribers } = useListSubscribers();
  const { data: mechanics } = useListMechanics();

  const pending = bookings?.filter((b) => b.status === "pending").length ?? 0;
  const active = bookings?.filter((b) => b.status === "active").length ?? 0;
  const completed = bookings?.filter((b) => b.status === "completed").length ?? 0;

  const sorted = [...(bookings ?? [])].sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  return (
    <div>
      <BackButton onBack={onBack} />
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Pending", count: pending, color: "text-yellow-500" },
            { label: "Active", count: active, color: "text-green-500" },
            { label: "Completed", count: completed, color: "text-muted-foreground" },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-lg p-4 text-center">
              <div className={`text-3xl font-condensed font-bold ${s.color}`}>{s.count}</div>
              <div className="text-xs font-condensed uppercase tracking-wider text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-card/50 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <h3 className="font-condensed font-bold uppercase tracking-wider text-base">All Bookings ({bookings?.length ?? 0})</h3>
          </div>
          {isLoading ? (
            <div className="p-4 space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            sorted.map((b) => {
              const sub = subscribers?.find((s) => s.id === b.subId);
              const mech = mechanics?.find((m) => m.id === b.mechId);
              return (
                <div key={b.id} className="flex items-center gap-4 px-4 py-3.5 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{b.service}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {sub ? `${sub.fname} ${sub.lname}` : "Unknown"} · {mech?.name ?? "Unknown"}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0 hidden sm:block">
                    {b.date ? new Date(b.date).toLocaleDateString() : "TBD"}
                  </div>
                  {b.value ? <div className="text-xs font-mono text-muted-foreground shrink-0 hidden md:block">${b.value}</div> : null}
                  <Badge variant="outline" className={`text-xs font-condensed shrink-0 ${statusStyle(b.status)}`}>
                    {b.status.toUpperCase()}
                  </Badge>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ─── WORKSHOPS VIEW ───────────────────────────────────────────────────────────
function WorkshopsView({ onBack, stats }: { onBack: () => void; stats: any }) {
  const { data: mechanics, isLoading } = useListMechanics();
  const { data: subscribers } = useListSubscribers();

  return (
    <div>
      <BackButton onBack={onBack} />
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-card/50 flex items-center gap-2">
          <Wrench className="h-4 w-4 text-primary" />
          <h3 className="font-condensed font-bold uppercase tracking-wider text-base">
            All Workshops ({stats.activeMechanics})
          </h3>
        </div>
        {isLoading ? (
          <div className="p-4 space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : (
          mechanics?.map((mech) => {
            const assigned = subscribers?.filter((s) => s.mechId === mech.id) ?? [];
            const weeklyRev = assigned.reduce((acc, s) => {
              const rates: Record<string, number> = { basic: 7, standard: 13, annual: 374.5 / 52 };
              return acc + (rates[s.tier] ?? 0);
            }, 0);
            return (
              <div key={mech.id} className="flex items-center gap-4 px-4 py-4 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                <div className="font-condensed font-bold text-primary tracking-wider w-20 shrink-0">{mech.code}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{mech.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{mech.location || "No location"}</div>
                </div>
                <div className="text-xs text-muted-foreground text-right shrink-0 space-y-0.5">
                  <div>{assigned.length} subscriber{assigned.length !== 1 ? "s" : ""}</div>
                  <div className="text-green-500 font-medium">${weeklyRev.toFixed(2)}/wk revenue</div>
                  <div>{mech.revShare}% rev share</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── REVENUE VIEW ─────────────────────────────────────────────────────────────
function RevenueView({ onBack, stats }: { onBack: () => void; stats: any }) {
  const { tierBreakdown, revenueBreakdown } = stats;
  const mechCost = revenueBreakdown.grossAnnual - revenueBreakdown.pitlaneNet;

  const rows = [
    {
      label: `Basic (${tierBreakdown.basic} subs × $7/wk)`,
      value: revenueBreakdown.basicAnnual,
      color: "text-muted-foreground",
    },
    {
      label: `Standard (${tierBreakdown.standard} subs × $13/wk)`,
      value: revenueBreakdown.standardAnnual,
      color: "text-primary",
    },
    {
      label: `Annual plan (${tierBreakdown.annual} subs × avg $374/yr)`,
      value: revenueBreakdown.annualTierAnnual,
      color: "text-green-500",
    },
  ];

  return (
    <div>
      <BackButton onBack={onBack} />
      <div className="space-y-6 max-w-xl">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-lg p-5">
            <div className="text-xs font-condensed uppercase tracking-widest text-muted-foreground mb-1">Weekly Run Rate</div>
            <div className="text-3xl font-condensed font-bold text-foreground">${revenueBreakdown.weeklyRunRate.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground mt-1">across {stats.totalSubscribers} subscribers</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-5">
            <div className="text-xs font-condensed uppercase tracking-widest text-muted-foreground mb-1">Annual Gross</div>
            <div className="text-3xl font-condensed font-bold text-foreground">${revenueBreakdown.grossAnnual.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">before mechanic share</div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border bg-card/50 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            <h3 className="font-condensed font-bold uppercase tracking-wider text-base">Annual Revenue by Tier</h3>
          </div>
          <div className="divide-y divide-border/50">
            {rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between px-5 py-3.5">
                <div className="text-sm text-muted-foreground">{row.label}</div>
                <div className={`text-sm font-condensed font-bold ${row.color}`}>${row.value.toLocaleString()}</div>
              </div>
            ))}
            <div className="flex items-center justify-between px-5 py-3.5 bg-secondary/30">
              <div className="text-sm font-medium">Gross Annual Revenue</div>
              <div className="text-sm font-condensed font-bold">${revenueBreakdown.grossAnnual.toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border bg-card/50 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="font-condensed font-bold uppercase tracking-wider text-base">Pitlane Net Revenue</h3>
          </div>
          <div className="divide-y divide-border/50">
            <div className="flex items-center justify-between px-5 py-3.5">
              <div className="text-sm text-muted-foreground">Gross Revenue</div>
              <div className="text-sm font-condensed">${revenueBreakdown.grossAnnual.toLocaleString()}</div>
            </div>
            <div className="flex items-center justify-between px-5 py-3.5">
              <div className="text-sm text-muted-foreground">Mechanic Rev Share (~12.5% avg)</div>
              <div className="text-sm font-condensed text-destructive">−${mechCost.toLocaleString()}</div>
            </div>
            <div className="flex items-center justify-between px-5 py-4 bg-green-500/5">
              <div className="text-sm font-bold">Pitlane Net (est.)</div>
              <div className="text-xl font-condensed font-bold text-green-500">${revenueBreakdown.pitlaneNet.toLocaleString()}</div>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Revenue estimates are based on current active subscribers and their plan rates. Actual figures may vary based on billing frequency, joining fees collected, and individual mechanic rev share agreements (10–15%).
        </p>
      </div>
    </div>
  );
}
