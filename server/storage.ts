import {
  users,
  subscriptions,
  inspectionReports,
  type User,
  type InsertUser,
  type Subscription,
  type InsertSubscription,
  type InspectionReport,
  type InsertInspectionReport,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Admin user management
  getAllUsers(): Promise<User[]>;
  updateUserRole(userId: string, role: string, isApproved: boolean): Promise<User>;
  updateUserStatus(userId: string, isActive: boolean): Promise<User>;
  
  // Subscription management
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getSubscriptionByUserId(userId: string): Promise<Subscription | undefined>;
  updateSubscriptionStatus(userId: string, status: string): Promise<User>;
  updateUserStripeInfo(userId: string, customerId: string, subscriptionId: string): Promise<User>;
  
  // Inspection reports
  createInspectionReport(report: InsertInspectionReport): Promise<InspectionReport>;
  getInspectionReportsByUserId(userId: string): Promise<InspectionReport[]>;
  updateInspectionReport(id: string, data: Partial<InspectionReport>): Promise<InspectionReport>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  // Admin user management
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserRole(userId: string, role: string, isApproved: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role, isApproved, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserStatus(userId: string, isActive: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Subscription management
  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [sub] = await db
      .insert(subscriptions)
      .values(subscription)
      .returning();
    return sub;
  }

  async getSubscriptionByUserId(userId: string): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt));
    return subscription;
  }

  async updateSubscriptionStatus(userId: string, status: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ subscriptionStatus: status, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserStripeInfo(userId: string, customerId: string, subscriptionId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        stripeCustomerId: customerId, 
        stripeSubscriptionId: subscriptionId,
        subscriptionStatus: 'active',
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Inspection reports
  async createInspectionReport(report: InsertInspectionReport): Promise<InspectionReport> {
    const [newReport] = await db
      .insert(inspectionReports)
      .values(report)
      .returning();
    return newReport;
  }

  async getInspectionReportsByUserId(userId: string): Promise<InspectionReport[]> {
    return await db
      .select()
      .from(inspectionReports)
      .where(eq(inspectionReports.userId, userId))
      .orderBy(desc(inspectionReports.createdAt));
  }

  async updateInspectionReport(id: string, data: Partial<InspectionReport>): Promise<InspectionReport> {
    const [report] = await db
      .update(inspectionReports)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(inspectionReports.id, id))
      .returning();
    return report;
  }
}

export const storage = new DatabaseStorage();
