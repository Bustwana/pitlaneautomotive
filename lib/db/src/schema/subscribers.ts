import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const subscribersTable = pgTable("subscribers", {
  id: serial("id").primaryKey(),
  fname: text("fname").notNull(),
  lname: text("lname").notNull(),
  phone: text("phone"),
  email: text("email"),
  suburb: text("suburb"),
  make: text("make"),
  model: text("model"),
  year: text("year"),
  tier: text("tier").notNull().default("standard"),
  mechId: integer("mech_id"),
  nextService: text("next_service"),
  consent: text("consent").notNull().default("pending"),
  joinDate: text("join_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSubscriberSchema = createInsertSchema(subscribersTable).omit({ id: true, createdAt: true });
export type InsertSubscriber = z.infer<typeof insertSubscriberSchema>;
export type Subscriber = typeof subscribersTable.$inferSelect;
