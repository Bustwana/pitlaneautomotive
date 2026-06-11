import { Router } from "express";
import { db, subscribersTable, mechanicsTable, bookingsTable } from "@workspace/db";

const router = Router();

// Real pricing constants
const WEEKLY_RATES: Record<string, number> = {
  basic: 7,
  standard: 13,
  annual: 374.5 / 52,
};

const ANNUAL_RATES: Record<string, number> = {
  basic: 7 * 52,     // $364/yr
  standard: 13 * 52, // $676/yr
  annual: 374.5,     // avg of basic-annual ($299) and standard-annual ($450)
};

const PITLANE_SHARE = 0.875; // keeps 85-90%, avg 87.5%
const ALERT_WINDOW_DAYS = 14;

router.get("/dashboard/stats", async (_req, res) => {
  const [subscribers, mechanics, bookings] = await Promise.all([
    db.select().from(subscribersTable),
    db.select().from(mechanicsTable),
    db.select().from(bookingsTable),
  ]);

  const tierBreakdown = {
    basic: subscribers.filter((s) => s.tier === "basic").length,
    standard: subscribers.filter((s) => s.tier === "standard").length,
    annual: subscribers.filter((s) => s.tier === "annual").length,
  };

  // Revenue from real subscription pricing
  const basicAnnual = tierBreakdown.basic * ANNUAL_RATES.basic;
  const standardAnnual = tierBreakdown.standard * ANNUAL_RATES.standard;
  const annualTierAnnual = tierBreakdown.annual * ANNUAL_RATES.annual;
  const grossAnnual = basicAnnual + standardAnnual + annualTierAnnual;
  const pitlaneNet = grossAnnual * PITLANE_SHARE;

  const weeklyRunRate =
    tierBreakdown.basic * WEEKLY_RATES.basic +
    tierBreakdown.standard * WEEKLY_RATES.standard +
    tierBreakdown.annual * WEEKLY_RATES.annual;

  const revenueBreakdown = {
    basicAnnual: Math.round(basicAnnual),
    standardAnnual: Math.round(standardAnnual),
    annualTierAnnual: Math.round(annualTierAnnual),
    grossAnnual: Math.round(grossAnnual),
    pitlaneNet: Math.round(pitlaneNet),
    weeklyRunRate: Math.round(weeklyRunRate * 100) / 100,
  };

  // Service alerts — overdue or within 14 days
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const windowMs = ALERT_WINDOW_DAYS * 24 * 60 * 60 * 1000;

  const mechMap = new Map(mechanics.map((m) => [m.id, m.name]));

  const serviceAlerts = subscribers
    .filter((s) => !!s.nextService)
    .map((s) => {
      const serviceDate = new Date(s.nextService!);
      serviceDate.setHours(0, 0, 0, 0);
      const diffMs = serviceDate.getTime() - now.getTime();
      const daysUntil = Math.round(diffMs / (24 * 60 * 60 * 1000));
      return { subscriber: s, daysUntil };
    })
    .filter(({ daysUntil }) => daysUntil <= ALERT_WINDOW_DAYS) // overdue or within window
    .sort((a, b) => a.daysUntil - b.daysUntil) // most overdue first
    .map(({ subscriber: s, daysUntil }) => ({
      subscriberId: s.id,
      subscriberName: `${s.fname} ${s.lname}`,
      vehicleDescription: [s.year, s.make, s.model].filter(Boolean).join(" ") || undefined,
      tier: s.tier,
      nextService: s.nextService!,
      alertStatus: daysUntil < 0 ? "overdue" : "upcoming",
      daysUntil,
      workshopName: s.mechId ? (mechMap.get(s.mechId) ?? undefined) : undefined,
    }));

  const recentSubscribers = [...subscribers]
    .sort((a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime())
    .slice(0, 5);

  const upcomingBookings = bookings
    .filter((b) => b.status !== "completed")
    .sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    })
    .slice(0, 5);

  res.json({
    totalSubscribers: subscribers.length,
    activeMechanics: mechanics.length,
    totalBookings: bookings.length,
    totalRevenue: Math.round(grossAnnual),
    weeklyRunRate: Math.round(weeklyRunRate * 100) / 100,
    recentSubscribers,
    upcomingBookings,
    tierBreakdown,
    revenueBreakdown,
    serviceAlerts,
  });
});

export default router;
