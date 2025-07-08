import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  boolean,
  decimal,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table with role-based access and subscription management
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  username: varchar("username").unique().notNull(),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(), // Encrypted password
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("user"), // 'user' or 'admin'
  isApproved: boolean("is_approved").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionStatus: varchar("subscription_status").default("inactive"), // 'active', 'inactive', 'expired', 'paused'
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subscription management table
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  stripeSubscriptionId: varchar("stripe_subscription_id").notNull(),
  status: varchar("status").notNull(), // 'active', 'paused', 'canceled', 'expired'
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  currency: varchar("currency").default("usd"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Jobs table for vehicle inspections
export const jobs = pgTable("jobs", {
  id: varchar("id").primaryKey().notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  vrm: varchar("vrm").notNull(),
  make: varchar("make").notNull(),
  model: varchar("model").notNull(),
  year: varchar("year").notNull(),
  colour: varchar("colour"),
  fuelType: varchar("fuel_type"),
  engineSize: varchar("engine_size"),
  co2Emissions: varchar("co2_emissions"),
  dateOfFirstRegistration: varchar("date_of_first_registration"),
  customerName: varchar("customer_name").notNull(),
  customerEmail: varchar("customer_email").notNull(),
  customerPhone: varchar("customer_phone").notNull(),
  customerAddress: varchar("customer_address").notNull(),
  customerPostcode: varchar("customer_postcode").notNull(),
  status: varchar("status").default("created").notNull(), // created, in_progress, completed, cancelled
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Vehicle inspection reports
export const inspectionReports = pgTable("inspection_reports", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  jobId: varchar("job_id").references(() => jobs.id),
  vehicleId: varchar("vehicle_id"),
  reportNumber: varchar("report_number").notNull().unique(),
  vehicleReg: varchar("vehicle_reg"),
  vehicleMake: varchar("vehicle_make"),
  vehicleModel: varchar("vehicle_model"),
  vehicleYear: varchar("vehicle_year"),
  inspectionData: jsonb("inspection_data"), // Store all inspection results
  status: varchar("status").default("draft"), // 'draft', 'completed', 'submitted'
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type InsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertSubscription = typeof subscriptions.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;

export type InsertJob = typeof jobs.$inferInsert;
export type Job = typeof jobs.$inferSelect;

export type InsertInspectionReport = typeof inspectionReports.$inferInsert;
export type InspectionReport = typeof inspectionReports.$inferSelect;

// Schema validations
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  firstName: true,
  lastName: true,
});

export const updateUserRoleSchema = z.object({
  userId: z.string(),
  role: z.enum(["user", "admin"]),
  isApproved: z.boolean(),
});

export const updateSubscriptionStatusSchema = z.object({
  userId: z.string(),
  status: z.enum(["active", "inactive", "expired", "paused"]),
});
