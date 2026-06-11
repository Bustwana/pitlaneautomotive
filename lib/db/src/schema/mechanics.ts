import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const mechanicsTable = pgTable("mechanics", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contact: text("contact"),
  phone: text("phone"),
  email: text("email"),
  location: text("location"),
  code: text("code").notNull().unique(),
  discount: integer("discount").notNull().default(30),
  revShare: integer("rev_share").notNull().default(10),
  password: text("password").notNull().default("workshop123"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMechanicSchema = createInsertSchema(mechanicsTable).omit({ id: true, createdAt: true });
export type InsertMechanic = z.infer<typeof insertMechanicSchema>;
export type Mechanic = typeof mechanicsTable.$inferSelect;
