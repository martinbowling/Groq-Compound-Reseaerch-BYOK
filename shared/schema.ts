import { pgTable, text, serial, integer, boolean, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Original users table from template
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Research related tables
export const researchQueries = pgTable("research_queries", {
  id: serial("id").primaryKey(),
  queryId: text("query_id").notNull().unique(),
  query: text("query").notNull(),
  modelType: text("model_type").notNull(),
  status: text("status").notNull().default("initializing"),
  title: text("title"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const researchSteps = pgTable("research_steps", {
  id: serial("id").primaryKey(),
  queryId: text("query_id").notNull(),
  step: text("step").notNull(),
  status: text("status").notNull(),
  message: text("message"),
  data: json("data"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertResearchQuerySchema = createInsertSchema(researchQueries).omit({ 
  id: true,
  status: true,
  title: true,
  createdAt: true,
  completedAt: true
});

export const insertResearchStepSchema = createInsertSchema(researchSteps).omit({ 
  id: true,
  timestamp: true
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type ResearchQuery = typeof researchQueries.$inferSelect;
export type ResearchStep = typeof researchSteps.$inferSelect;
export type InsertResearchQuery = z.infer<typeof insertResearchQuerySchema>;
export type InsertResearchStep = z.infer<typeof insertResearchStepSchema>;
