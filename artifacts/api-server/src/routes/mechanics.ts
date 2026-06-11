import { Router } from "express";
import {
  CreateMechanicBody,
  UpdateMechanicBody,
  UpdateMechanicParams,
  DeleteMechanicParams,
  GetMechanicStatsParams,
} from "@workspace/api-zod";
import { db, mechanicsTable, subscribersTable, bookingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/mechanics", async (_req, res) => {
  const rows = await db.select().from(mechanicsTable).orderBy(mechanicsTable.createdAt);
  const safe = rows.map(({ password: _pw, ...r }) => r);
  res.json(safe);
});

router.post("/mechanics", async (req, res) => {
  const parse = CreateMechanicBody.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "Invalid data" });
    return;
  }
  const count = await db.select().from(mechanicsTable);
  const code = `MECH${String(count.length + 1).padStart(3, "0")}`;
  const { password, ...rest } = parse.data;
  const [row] = await db
    .insert(mechanicsTable)
    .values({
      ...rest,
      code,
      password: password || "workshop123",
    })
    .returning();
  const { password: _pw, ...safe } = row;
  res.status(201).json(safe);
});

router.patch("/mechanics/:id", async (req, res) => {
  const paramParse = UpdateMechanicParams.safeParse({ id: Number(req.params.id) });
  if (!paramParse.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const bodyParse = UpdateMechanicBody.safeParse(req.body);
  if (!bodyParse.success) {
    res.status(400).json({ error: "Invalid data" });
    return;
  }
  const [row] = await db
    .update(mechanicsTable)
    .set(bodyParse.data)
    .where(eq(mechanicsTable.id, paramParse.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const { password: _pw, ...safe } = row;
  res.json(safe);
});

router.delete("/mechanics/:id", async (req, res) => {
  const parse = DeleteMechanicParams.safeParse({ id: Number(req.params.id) });
  if (!parse.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(mechanicsTable).where(eq(mechanicsTable.id, parse.data.id));
  res.status(204).send();
});

router.get("/mechanics/:id/stats", async (req, res) => {
  const parse = GetMechanicStatsParams.safeParse({ id: Number(req.params.id) });
  if (!parse.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [mechanic] = await db
    .select()
    .from(mechanicsTable)
    .where(eq(mechanicsTable.id, parse.data.id));
  if (!mechanic) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const allBookings = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.mechId, parse.data.id));
  const subscribers = await db
    .select()
    .from(subscribersTable)
    .where(eq(subscribersTable.mechId, parse.data.id));
  const revenueEarned = allBookings
    .filter((b) => b.status === "completed")
    .reduce((acc, b) => acc + (b.value ?? 0) * (mechanic.revShare / 100), 0);
  const upcomingBookings = allBookings.filter((b) => b.status !== "completed");
  res.json({
    totalSubscribers: subscribers.length,
    totalBookings: allBookings.length,
    revenueEarned: Math.round(revenueEarned * 100) / 100,
    upcomingBookings,
    subscribers,
  });
});

export default router;
