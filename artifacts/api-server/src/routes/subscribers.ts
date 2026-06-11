import { Router } from "express";
import {
  CreateSubscriberBody,
  UpdateSubscriberBody,
  UpdateSubscriberParams,
  DeleteSubscriberParams,
  PublicSignupBody,
} from "@workspace/api-zod";
import { db, subscribersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/subscribers", async (_req, res) => {
  const rows = await db.select().from(subscribersTable).orderBy(subscribersTable.createdAt);
  const clean = rows.map(({ ...r }) => r);
  res.json(clean);
});

router.post("/subscribers", async (req, res) => {
  const parse = CreateSubscriberBody.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "Invalid data" });
    return;
  }
  const { mechId, ...rest } = parse.data;
  const [row] = await db
    .insert(subscribersTable)
    .values({
      ...rest,
      mechId: mechId ?? null,
      joinDate: new Date().toISOString().split("T")[0],
    })
    .returning();
  res.status(201).json(row);
});

router.patch("/subscribers/:id", async (req, res) => {
  const paramParse = UpdateSubscriberParams.safeParse({ id: Number(req.params.id) });
  if (!paramParse.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const bodyParse = UpdateSubscriberBody.safeParse(req.body);
  if (!bodyParse.success) {
    res.status(400).json({ error: "Invalid data" });
    return;
  }
  const [row] = await db
    .update(subscribersTable)
    .set(bodyParse.data)
    .where(eq(subscribersTable.id, paramParse.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(row);
});

router.delete("/subscribers/:id", async (req, res) => {
  const parse = DeleteSubscriberParams.safeParse({ id: Number(req.params.id) });
  if (!parse.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(subscribersTable).where(eq(subscribersTable.id, parse.data.id));
  res.status(204).send();
});

router.post("/signup", async (req, res) => {
  const parse = PublicSignupBody.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "Invalid data" });
    return;
  }
  const [row] = await db
    .insert(subscribersTable)
    .values({
      ...parse.data,
      mechId: null,
      consent: "pending",
      joinDate: new Date().toISOString().split("T")[0],
    })
    .returning();
  res.status(201).json(row);
});

export default router;
