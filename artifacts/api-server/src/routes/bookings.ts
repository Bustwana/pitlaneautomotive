import { Router } from "express";
import {
  CreateBookingBody,
  UpdateBookingBody,
  UpdateBookingParams,
  DeleteBookingParams,
} from "@workspace/api-zod";
import { db, bookingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/bookings", async (_req, res) => {
  const rows = await db.select().from(bookingsTable).orderBy(bookingsTable.createdAt);
  res.json(rows);
});

router.post("/bookings", async (req, res) => {
  const parse = CreateBookingBody.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "Invalid data" });
    return;
  }
  const [row] = await db.insert(bookingsTable).values(parse.data).returning();
  res.status(201).json(row);
});

router.patch("/bookings/:id", async (req, res) => {
  const paramParse = UpdateBookingParams.safeParse({ id: Number(req.params.id) });
  if (!paramParse.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const bodyParse = UpdateBookingBody.safeParse(req.body);
  if (!bodyParse.success) {
    res.status(400).json({ error: "Invalid data" });
    return;
  }
  const [row] = await db
    .update(bookingsTable)
    .set(bodyParse.data)
    .where(eq(bookingsTable.id, paramParse.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(row);
});

router.delete("/bookings/:id", async (req, res) => {
  const parse = DeleteBookingParams.safeParse({ id: Number(req.params.id) });
  if (!parse.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(bookingsTable).where(eq(bookingsTable.id, parse.data.id));
  res.status(204).send();
});

export default router;
