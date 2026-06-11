import { Router } from "express";
import { AdminLoginBody, MechanicLoginBody } from "@workspace/api-zod";
import { db, mechanicsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "pitlane2024";

router.post("/auth/admin-login", async (req, res) => {
  const parse = AdminLoginBody.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  if (parse.data.password !== ADMIN_PASSWORD) {
    res.status(401).json({ error: "Invalid password" });
    return;
  }
  res.json({ success: true, role: "admin" });
});

router.post("/auth/mechanic-login", async (req, res) => {
  const parse = MechanicLoginBody.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const { code, password } = parse.data;
  const [mechanic] = await db
    .select()
    .from(mechanicsTable)
    .where(eq(mechanicsTable.code, code));
  if (!mechanic || mechanic.password !== password) {
    res.status(401).json({ error: "Invalid code or password" });
    return;
  }
  const { password: _pw, ...safeMechanic } = mechanic;
  res.json({ success: true, mechanic: safeMechanic });
});

export default router;
