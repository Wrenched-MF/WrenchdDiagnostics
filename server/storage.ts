import {
  users,
  subscriptions,
  vehicles,
  customers,
  vehicleCustomers,
  jobs,
  preInspections,
  vhcData,
  inspectionReports,
  type User,
  type InsertUser,
  type Subscription,
  type InsertSubscription,
  type Vehicle,
  type InsertVehicle,
  type Customer,
  type InsertCustomer,
  type VehicleCustomer,
  type InsertVehicleCustomer,
  type Job,
  type InsertJob,
  type PreInspection,
  type InsertPreInspection,
  type VhcData,
  type InsertVhcData,
  type InspectionReport,
  type InsertInspectionReport,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, ilike } from "drizzle-orm";

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
  
  // Vehicle management
  createOrUpdateVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  getVehicle(vrm: string): Promise<Vehicle | undefined>;
  getAllVehicles(): Promise<Vehicle[]>;
  
  // Customer management
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomersByVehicle(vrm: string): Promise<Customer[]>;
  searchCustomers(query: string): Promise<Customer[]>;
  
  // Vehicle-Customer relationships
  linkVehicleToCustomer(vehicleCustomer: InsertVehicleCustomer): Promise<VehicleCustomer>;
  getCurrentOwner(vrm: string): Promise<Customer | undefined>;
  getOwnershipHistory(vrm: string): Promise<VehicleCustomer[]>;
  transferOwnership(vrm: string, newCustomerId: string): Promise<void>;
  
  // Job management
  createJob(job: InsertJob): Promise<Job>;
  getJobsByUserId(userId: string): Promise<Job[]>;
  getJob(id: string): Promise<Job | undefined>;
  updateJobStatus(id: string, status: string): Promise<Job>;
  deleteJob(id: string): Promise<void>;
  
  // Pre-inspection management
  createPreInspection(preInspection: Omit<InsertPreInspection, 'id'>): Promise<PreInspection>;
  getPreInspectionByJobId(jobId: string): Promise<PreInspection | undefined>;
  updatePreInspection(id: string, data: Partial<PreInspection>): Promise<PreInspection>;

  // VHC management
  createVhcData(vhc: Omit<InsertVhcData, 'id'>): Promise<VhcData>;
  getVhcDataByJobId(jobId: string): Promise<VhcData | undefined>;
  updateVhcData(id: string, data: Partial<VhcData>): Promise<VhcData>;

  // Inspection reports
  createInspectionReport(report: InsertInspectionReport): Promise<InspectionReport>;
  getInspectionReportsByUserId(userId: string): Promise<InspectionReport[]>;
  updateInspectionReport(id: string, data: Partial<InspectionReport>): Promise<InspectionReport>;
}

export class DatabaseStorage implements IStorage {
  // Vehicle management
  async createOrUpdateVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const [result] = await db
      .insert(vehicles)
      .values(vehicle)
      .onConflictDoUpdate({
        target: vehicles.vrm,
        set: {
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          colour: vehicle.colour,
          fuelType: vehicle.fuelType,
          engineSize: vehicle.engineSize,
          co2Emissions: vehicle.co2Emissions,
          dateOfFirstRegistration: vehicle.dateOfFirstRegistration,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  async getVehicle(vrm: string): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.vrm, vrm));
    return vehicle || undefined;
  }

  async getAllVehicles(): Promise<Vehicle[]> {
    return await db.select().from(vehicles).orderBy(desc(vehicles.createdAt));
  }

  // Customer management
  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [createdCustomer] = await db
      .insert(customers)
      .values(customer)
      .returning();
    return createdCustomer;
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async getCustomersByVehicle(vrm: string): Promise<Customer[]> {
    return await db
      .select({
        id: customers.id,
        name: customers.name,
        email: customers.email,
        phone: customers.phone,
        address: customers.address,
        postcode: customers.postcode,
        createdAt: customers.createdAt,
        updatedAt: customers.updatedAt,
      })
      .from(customers)
      .innerJoin(vehicleCustomers, eq(customers.id, vehicleCustomers.customerId))
      .where(eq(vehicleCustomers.vrm, vrm))
      .orderBy(desc(vehicleCustomers.startDate));
  }

  async searchCustomers(query: string): Promise<Customer[]> {
    return await db
      .select()
      .from(customers)
      .where(
        or(
          ilike(customers.name, `%${query}%`),
          ilike(customers.email, `%${query}%`),
          ilike(customers.phone, `%${query}%`)
        )
      )
      .orderBy(customers.name);
  }

  // Vehicle-Customer relationships
  async linkVehicleToCustomer(vehicleCustomer: InsertVehicleCustomer): Promise<VehicleCustomer> {
    const [linked] = await db
      .insert(vehicleCustomers)
      .values(vehicleCustomer)
      .returning();
    return linked;
  }

  async getCurrentOwner(vrm: string): Promise<Customer | undefined> {
    const [result] = await db
      .select({
        id: customers.id,
        name: customers.name,
        email: customers.email,
        phone: customers.phone,
        address: customers.address,
        postcode: customers.postcode,
        createdAt: customers.createdAt,
        updatedAt: customers.updatedAt,
      })
      .from(customers)
      .innerJoin(vehicleCustomers, eq(customers.id, vehicleCustomers.customerId))
      .where(
        and(
          eq(vehicleCustomers.vrm, vrm),
          eq(vehicleCustomers.isCurrentOwner, true)
        )
      );
    return result || undefined;
  }

  async getOwnershipHistory(vrm: string): Promise<VehicleCustomer[]> {
    return await db
      .select()
      .from(vehicleCustomers)
      .where(eq(vehicleCustomers.vrm, vrm))
      .orderBy(desc(vehicleCustomers.startDate));
  }

  async transferOwnership(vrm: string, newCustomerId: string): Promise<void> {
    await db.transaction(async (tx) => {
      // End current ownership
      await tx
        .update(vehicleCustomers)
        .set({
          isCurrentOwner: false,
          endDate: new Date(),
        })
        .where(
          and(
            eq(vehicleCustomers.vrm, vrm),
            eq(vehicleCustomers.isCurrentOwner, true)
          )
        );

      // Create new ownership
      await tx.insert(vehicleCustomers).values({
        id: `vc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        vrm,
        customerId: newCustomerId,
        startDate: new Date(),
        isCurrentOwner: true,
      });
    });
  }

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

  // Job management
  async createJob(job: InsertJob): Promise<Job> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const [newJob] = await db
      .insert(jobs)
      .values({
        ...job,
        id: jobId,
      })
      .returning();
    
    return newJob;
  }

  async getJobsByUserId(userId: string): Promise<Job[]> {
    return await db
      .select()
      .from(jobs)
      .where(eq(jobs.userId, userId))
      .orderBy(desc(jobs.createdAt));
  }

  async getJob(id: string): Promise<Job | undefined> {
    const [job] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, id));
    
    return job;
  }

  async updateJobStatus(id: string, status: string): Promise<Job> {
    const [updatedJob] = await db
      .update(jobs)
      .set({ status, updatedAt: new Date() })
      .where(eq(jobs.id, id))
      .returning();
    
    return updatedJob;
  }

  async deleteJob(id: string): Promise<void> {
    // Delete related data first to avoid foreign key constraint violations
    await db.delete(vhcData).where(eq(vhcData.jobId, id));
    await db.delete(preInspections).where(eq(preInspections.jobId, id));
    await db.delete(jobs).where(eq(jobs.id, id));
  }

  // Pre-inspection management
  async createPreInspection(preInspection: Omit<InsertPreInspection, 'id'>): Promise<PreInspection> {
    const preInspectionId = `pre_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const [newPreInspection] = await db
      .insert(preInspections)
      .values({
        ...preInspection,
        id: preInspectionId,
      })
      .returning();
    
    return newPreInspection;
  }

  async getPreInspectionByJobId(jobId: string): Promise<PreInspection | undefined> {
    const [preInspection] = await db
      .select()
      .from(preInspections)
      .where(eq(preInspections.jobId, jobId));
    
    return preInspection;
  }

  async updatePreInspection(id: string, data: Partial<PreInspection>): Promise<PreInspection> {
    const [updatedPreInspection] = await db
      .update(preInspections)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(preInspections.id, id))
      .returning();
    
    return updatedPreInspection;
  }

  // VHC management
  async createVhcData(vhc: Omit<InsertVhcData, 'id'>): Promise<VhcData> {
    const vhcId = `vhc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const [newVhc] = await db
      .insert(vhcData)
      .values({
        ...vhc,
        id: vhcId,
      })
      .returning();
    
    return newVhc;
  }

  async getVhcDataByJobId(jobId: string): Promise<VhcData | undefined> {
    const [vhc] = await db
      .select()
      .from(vhcData)
      .where(eq(vhcData.jobId, jobId));
    
    return vhc;
  }

  async updateVhcData(id: string, data: Partial<VhcData>): Promise<VhcData> {
    const [updatedVhc] = await db
      .update(vhcData)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(vhcData.id, id))
      .returning();
    
    return updatedVhc;
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
