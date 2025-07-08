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

      const cleanVrm = vrm.replace(/\s/g, '').toUpperCase();
      
      // Call the actual DVLA API
      const dvlaResponse = await fetch('https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.DVLA_API_KEY || '',
        },
        body: JSON.stringify({
          registrationNumber: cleanVrm
        })
      });

      if (!dvlaResponse.ok) {
        if (dvlaResponse.status === 404) {
          return res.status(404).json({ message: 'Vehicle not found in DVLA database' });
        }
        if (dvlaResponse.status === 403) {
          return res.status(500).json({ message: 'DVLA API key invalid or missing' });
        }
        throw new Error(`DVLA API error: ${dvlaResponse.status}`);
      }

      const dvlaData = await dvlaResponse.json();
      
      // Transform DVLA response to our format
      const vehicleData = {
        vrm: cleanVrm,
        make: dvlaData.make || '',
        model: dvlaData.model || '',
        year: dvlaData.yearOfManufacture || new Date().getFullYear(),
        colour: dvlaData.colour || '',
        fuelType: dvlaData.fuelType || '',
        engineSize: dvlaData.engineCapacity ? `${dvlaData.engineCapacity}cc` : '',
        co2Emissions: dvlaData.co2Emissions ? `${dvlaData.co2Emissions}g/km` : '',
        dateOfFirstRegistration: dvlaData.dateOfLastV5CIssued || dvlaData.monthOfFirstRegistration || '',
      };

      res.json(vehicleData);
    } catch (error) {
      console.error('Error looking up VRM:', error);
      res.status(500).json({ message: 'Failed to lookup vehicle details from DVLA' });
    }
  });

  // UK Postcode lookup using postcodes.io (free UK postcode API)
  app.post('/api/postcode/lookup', isAuthenticated, async (req: any, res) => {
    try {
      const { postcode } = req.body;
      
      if (!postcode) {
        return res.status(400).json({ message: 'Postcode is required' });
      }

      const cleanPostcode = postcode.replace(/\s/g, '').toUpperCase();
      
      // Use postcodes.io free API for UK postcode lookup
      const postcodeResponse = await fetch(`https://api.postcodes.io/postcodes/${cleanPostcode}`);
      
      if (!postcodeResponse.ok) {
        if (postcodeResponse.status === 404) {
          return res.status(404).json({ message: 'Postcode not found' });
        }
        throw new Error(`Postcode API error: ${postcodeResponse.status}`);
      }

      const postcodeData = await postcodeResponse.json();
      
      if (!postcodeData.result) {
        return res.status(404).json({ message: 'Postcode not found' });
      }

      const result = postcodeData.result;
      
      // Transform to our expected format
      const addressData = {
        postcode: result.postcode,
        addresses: [
          {
            formatted_address: `${result.admin_ward}, ${result.admin_district}, ${result.country}`,
            line_1: result.admin_ward || '',
            line_2: result.admin_district || '',
            town_or_city: result.admin_district || '',
            county: result.admin_county || result.region || '',
            country: result.country || 'England',
            latitude: result.latitude,
            longitude: result.longitude,
          }
        ]
      };

      res.json(addressData);
    } catch (error) {
      console.error('Error looking up postcode:', error);
      res.status(500).json({ message: 'Failed to lookup postcode' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
