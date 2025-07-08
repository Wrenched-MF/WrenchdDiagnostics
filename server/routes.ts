import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { updateUserRoleSchema, updateSubscriptionStatusSchema } from "@shared/schema";
import { z } from "zod";

// Admin middleware to check if user has admin role
const isAdmin = async (req: any, res: any, next: any) => {
  try {
    const user = req.user;
    if (!user || user.role !== "admin" || !user.isApproved) {
      return res.status(403).json({ message: "Access denied. Admin privileges required." });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: "Error checking admin privileges" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes are now handled in auth.ts

  // Admin routes
  app.get('/api/admin/users', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch('/api/admin/users/role', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { userId, role, isApproved } = updateUserRoleSchema.parse(req.body);
      const user = await storage.updateUserRole(userId, role, isApproved);
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.patch('/api/admin/users/status', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { userId, isActive } = req.body;
      const user = await storage.updateUserStatus(userId, isActive);
      res.json(user);
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  app.patch('/api/admin/subscriptions/status', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { userId, status } = updateSubscriptionStatusSchema.parse(req.body);
      const user = await storage.updateSubscriptionStatus(userId, status);
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      console.error("Error updating subscription status:", error);
      res.status(500).json({ message: "Failed to update subscription status" });
    }
  });

  // User dashboard routes
  app.get('/api/user/reports', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const reports = await storage.getInspectionReportsByUserId(userId);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  // Job management routes
  app.post('/api/jobs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const job = await storage.createJob({
        ...req.body,
        userId,
      });

      res.json(job);
    } catch (error) {
      console.error('Error creating job:', error);
      res.status(500).json({ message: 'Failed to create job' });
    }
  });

  app.get('/api/jobs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const jobs = await storage.getJobsByUserId(userId);
      res.json(jobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      res.status(500).json({ message: 'Failed to fetch jobs' });
    }
  });

  app.get('/api/jobs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const job = await storage.getJob(id);
      
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }

      // Check if user owns this job
      if (job.userId !== req.user?.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      res.json(job);
    } catch (error) {
      console.error('Error fetching job:', error);
      res.status(500).json({ message: 'Failed to fetch job' });
    }
  });

  app.patch('/api/jobs/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const job = await storage.getJob(id);
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }

      // Check if user owns this job
      if (job.userId !== req.user?.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const updatedJob = await storage.updateJobStatus(id, status);
      res.json(updatedJob);
    } catch (error) {
      console.error('Error updating job status:', error);
      res.status(500).json({ message: 'Failed to update job status' });
    }
  });

  app.delete('/api/jobs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      const job = await storage.getJob(id);
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }

      // Check if user owns this job
      if (job.userId !== req.user?.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      await storage.deleteJob(id);
      res.json({ message: 'Job deleted successfully' });
    } catch (error) {
      console.error('Error deleting job:', error);
      res.status(500).json({ message: 'Failed to delete job' });
    }
  });

  // DVLA API integration for VRM lookup
  app.post('/api/dvla/lookup', isAuthenticated, async (req: any, res) => {
    try {
      const { vrm } = req.body;
      
      if (!vrm) {
        return res.status(400).json({ message: 'VRM is required' });
      }

      // Mock DVLA API response - in production, this would call the actual DVLA API
      // For now, we'll return mock data to demonstrate the flow
      const mockVehicleData = {
        vrm: vrm.toUpperCase(),
        make: 'BMW',
        model: 'X5',
        year: 2020,
        colour: 'Black',
        fuelType: 'Petrol',
        engineSize: '3.0L',
        co2Emissions: '190g/km',
        dateOfFirstRegistration: '2020-03-15',
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      res.json(mockVehicleData);
    } catch (error) {
      console.error('Error looking up VRM:', error);
      res.status(500).json({ message: 'Failed to lookup vehicle details' });
    }
  });

  // UK Postcode lookup
  app.post('/api/postcode/lookup', isAuthenticated, async (req: any, res) => {
    try {
      const { postcode } = req.body;
      
      if (!postcode) {
        return res.status(400).json({ message: 'Postcode is required' });
      }

      // Mock postcode API response - in production, this would call a real postcode API
      const mockAddressData = {
        postcode: postcode.toUpperCase(),
        addresses: [
          {
            formatted_address: '10 Downing Street, Westminster, London',
            line_1: '10 Downing Street',
            line_2: 'Westminster',
            town_or_city: 'London',
            county: 'Greater London',
            country: 'England',
          }
        ]
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));

      res.json(mockAddressData);
    } catch (error) {
      console.error('Error looking up postcode:', error);
      res.status(500).json({ message: 'Failed to lookup postcode' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
