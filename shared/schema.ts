import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  boolean,
  decimal,
  integer,
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

// Vehicle registry - stores permanent vehicle data from DVLA
export const vehicles = pgTable("vehicles", {
  vrm: varchar("vrm").primaryKey().notNull(),
  make: varchar("make").notNull(),
  model: varchar("model").notNull(), // User-entered since DVLA doesn't provide this
  year: integer("year").notNull(),
  colour: varchar("colour"),
  fuelType: varchar("fuel_type"),
  engineSize: varchar("engine_size"),
  co2Emissions: varchar("co2_emissions"),
  dateOfFirstRegistration: varchar("date_of_first_registration"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customer registry - stores all customers with contact details
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().notNull(),
  name: varchar("name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone").notNull(),
  address: varchar("address").notNull(),
  postcode: varchar("postcode").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Vehicle-Customer relationships - tracks ownership history
export const vehicleCustomers = pgTable("vehicle_customers", {
  id: varchar("id").primaryKey().notNull(),
  vrm: varchar("vrm").references(() => vehicles.vrm).notNull(),
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"), // null means current owner
  isCurrentOwner: boolean("is_current_owner").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Jobs now reference vehicle and customer separately for inspections
export const jobs = pgTable("jobs", {
  id: varchar("id").primaryKey().notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  vrm: varchar("vrm").references(() => vehicles.vrm).notNull(),
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  status: varchar("status").default("created").notNull(), // created, in_progress, completed, cancelled
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Pre-inspection reports
export const preInspections = pgTable("pre_inspections", {
  id: varchar("id").primaryKey().notNull(),
  jobId: varchar("job_id").references(() => jobs.id).notNull(),
  photoUrl: text("photo_url"), // Base64 image data or URL
  damageMarkers: jsonb("damage_markers"), // Array of damage marker objects
  mileage: integer("mileage"),
  status: varchar("status").default("completed").notNull(), // 'photo', 'damage', 'mileage', 'completed'
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

export type InsertVehicle = typeof vehicles.$inferInsert;
export type Vehicle = typeof vehicles.$inferSelect;

export type InsertCustomer = typeof customers.$inferInsert;
export type Customer = typeof customers.$inferSelect;

export type InsertVehicleCustomer = typeof vehicleCustomers.$inferInsert;
export type VehicleCustomer = typeof vehicleCustomers.$inferSelect;

export type InsertJob = typeof jobs.$inferInsert;
export type Job = typeof jobs.$inferSelect;

export type InsertPreInspection = typeof preInspections.$inferInsert;
export type PreInspection = typeof preInspections.$inferSelect;

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
