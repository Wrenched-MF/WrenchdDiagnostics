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

  // Enhanced job creation with vehicle and customer registry
  app.post('/api/jobs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { vrm, make, model, year, colour, fuelType, engineSize, co2Emissions, dateOfFirstRegistration, customerName, customerEmail, customerPhone, customerAddress, customerPostcode } = req.body;
      
      // Create or update vehicle record
      const vehicle = await storage.createOrUpdateVehicle({
        vrm,
        make,
        model: model || '', // Allow empty model since DVLA doesn't provide it
        year,
        colour,
        fuelType,
        engineSize,
        co2Emissions,
        dateOfFirstRegistration,
      });

      // Check if customer already exists by email
      let customer;
      const existingCustomers = await storage.searchCustomers(customerEmail);
      
      if (existingCustomers.length > 0) {
        customer = existingCustomers[0];
      } else {
        // Create new customer
        customer = await storage.createCustomer({
          id: `customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
          address: customerAddress,
          postcode: customerPostcode,
        });
      }

      // Check if vehicle-customer relationship exists
      const currentOwner = await storage.getCurrentOwner(vrm);
      if (!currentOwner || currentOwner.id !== customer.id) {
        // Link vehicle to customer (transfer ownership if needed)
        if (currentOwner) {
          await storage.transferOwnership(vrm, customer.id);
        } else {
          await storage.linkVehicleToCustomer({
            id: `vc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            vrm,
            customerId: customer.id,
            isCurrentOwner: true,
          });
        }
      }

      // Create inspection job
      const job = await storage.createJob({
        id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        vrm,
        customerId: customer.id,
        status: "created",
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

      const { limit, sort } = req.query;
      
      let jobs = await storage.getJobsByUserId(userId);
      
      // Enrich jobs with customer data
      const enrichedJobs = await Promise.all(
        jobs.map(async (job) => {
          const customer = await storage.getCustomer(job.customerId);
          return {
            ...job,
            customer
          };
        })
      );
      
      // If limit is specified for recent jobs, return only that many results
      if (limit && sort === 'recent') {
        const limitedJobs = enrichedJobs.slice(0, parseInt(limit as string));
        res.json(limitedJobs);
      } else {
        res.json(enrichedJobs);
      }
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

      // Get related vehicle and customer data
      const vehicle = await storage.getVehicle(job.vrm);
      const customer = await storage.getCustomer(job.customerId);

      const enrichedJob = {
        ...job,
        vehicle,
        customer
      };

      res.json(enrichedJob);
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

  // Vehicle registry endpoints
  app.get('/api/vehicles', isAuthenticated, async (req: any, res) => {
    try {
      const vehicles = await storage.getAllVehicles();
      res.json(vehicles);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      res.status(500).json({ message: 'Failed to fetch vehicles' });
    }
  });

  app.get('/api/vehicles/:vrm', isAuthenticated, async (req: any, res) => {
    try {
      const { vrm } = req.params;
      const vehicle = await storage.getVehicle(vrm.toUpperCase());
      
      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }

      res.json(vehicle);
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      res.status(500).json({ message: 'Failed to fetch vehicle' });
    }
  });

  app.get('/api/vehicles/:vrm/customers', isAuthenticated, async (req: any, res) => {
    try {
      const { vrm } = req.params;
      const customers = await storage.getCustomersByVehicle(vrm.toUpperCase());
      res.json(customers);
    } catch (error) {
      console.error('Error fetching vehicle customers:', error);
      res.status(500).json({ message: 'Failed to fetch vehicle customers' });
    }
  });

  app.post('/api/vehicles/:vrm/transfer', isAuthenticated, async (req: any, res) => {
    try {
      const { vrm } = req.params;
      const { customerId } = req.body;
      
      await storage.transferOwnership(vrm.toUpperCase(), customerId);
      res.json({ message: 'Ownership transferred successfully' });
    } catch (error) {
      console.error('Error transferring ownership:', error);
      res.status(500).json({ message: 'Failed to transfer ownership' });
    }
  });

  // Customer registry endpoints
  app.get('/api/customers/search', isAuthenticated, async (req: any, res) => {
    try {
      const { q } = req.query;
      
      if (!q) {
        return res.status(400).json({ message: 'Search query is required' });
      }

      const customers = await storage.searchCustomers(q as string);
      res.json(customers);
    } catch (error) {
      console.error('Error searching customers:', error);
      res.status(500).json({ message: 'Failed to search customers' });
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
      
      // Check if API key is available
      if (!process.env.DVLA_API_KEY) {
        console.error('DVLA API key is missing');
        return res.status(500).json({ message: 'DVLA API key is not configured' });
      }

      console.log(`Attempting DVLA lookup for VRM: ${cleanVrm}`);

      // Call the actual DVLA API
      const dvlaResponse = await fetch('https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.DVLA_API_KEY,
        },
        body: JSON.stringify({
          registrationNumber: cleanVrm
        })
      });

      console.log(`DVLA API response status: ${dvlaResponse.status}`);

      if (!dvlaResponse.ok) {
        const errorResponse = await dvlaResponse.json().catch(() => null);
        console.error(`DVLA API error: ${dvlaResponse.status}`, errorResponse);
        
        if (dvlaResponse.status === 404) {
          // Handle DVLA's specific 404 error format
          const errorDetail = errorResponse?.errors?.[0]?.detail || 'Vehicle not found in DVLA database';
          return res.status(404).json({ message: errorDetail });
        }
        if (dvlaResponse.status === 403) {
          return res.status(403).json({ 
            message: 'DVLA API access denied. Please check your API key permissions and subscription status with DVLA.',
            details: 'Contact DVLA API support at dvlaapiaccess@dvla.gov.uk if this issue persists.'
          });
        }
        if (dvlaResponse.status === 401) {
          return res.status(401).json({ message: 'DVLA API key invalid or expired' });
        }
        if (dvlaResponse.status === 429) {
          return res.status(429).json({ message: 'DVLA API rate limit exceeded. Please try again later.' });
        }
        throw new Error(`DVLA API error: ${dvlaResponse.status} - ${JSON.stringify(errorResponse)}`);
      }

      const dvlaData = await dvlaResponse.json();
      
      // Transform DVLA response to our format
      // Note: DVLA API only provides manufacturer (make), not specific model
      const vehicleData = {
        vrm: cleanVrm,
        make: dvlaData.make || '',
        model: '', // DVLA doesn't provide model - user will need to enter manually
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

  // UK Postcode lookup with individual addresses using getAddress.io API  
  app.post('/api/postcode/lookup', isAuthenticated, async (req: any, res) => {
    try {
      const { postcode } = req.body;
      
      if (!postcode) {
        return res.status(400).json({ message: 'Postcode is required' });
      }

      const cleanPostcode = postcode.replace(/\s/g, '').toUpperCase();
      
      // Try getAddress.io for individual addresses (if API key available)
      if (process.env.GETADDRESS_API_KEY) {
        try {
          const getAddressResponse = await fetch(`https://api.getaddress.io/find/${cleanPostcode}?api-key=${process.env.GETADDRESS_API_KEY}`);
          
          if (getAddressResponse.ok) {
            const getAddressData = await getAddressResponse.json();
            
            if (getAddressData.addresses && getAddressData.addresses.length > 0) {
              const addresses = getAddressData.addresses.map((addr: string, index: number) => {
                const parts = addr.split(', ');
                return {
                  id: index,
                  formatted_address: addr,
                  line_1: parts[0] || '',
                  line_2: parts[1] || '',
                  town_or_city: parts[parts.length - 2] || '',
                  county: parts[parts.length - 1] || '',
                  postcode: cleanPostcode,
                  country: 'England',
                };
              });

              return res.json({
                postcode: cleanPostcode,
                addresses: addresses,
                source: 'getAddress.io'
              });
            }
          }
        } catch (getAddressError) {
          console.log('getAddress.io failed, falling back to postcodes.io');
        }
      }
      
      // Create mock individual addresses for demonstration
      const mockAddresses = [
        { id: 0, formatted_address: `1 Example Street, ${cleanPostcode}`, line_1: '1 Example Street', postcode: cleanPostcode },
        { id: 1, formatted_address: `2 Example Street, ${cleanPostcode}`, line_1: '2 Example Street', postcode: cleanPostcode },
        { id: 2, formatted_address: `3 Example Street, ${cleanPostcode}`, line_1: '3 Example Street', postcode: cleanPostcode },
        { id: 3, formatted_address: `4 Example Street, ${cleanPostcode}`, line_1: '4 Example Street', postcode: cleanPostcode },
        { id: 4, formatted_address: `5 Example Street, ${cleanPostcode}`, line_1: '5 Example Street', postcode: cleanPostcode },
      ];

      // Use postcodes.io for postcode validation
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
      
      // Return mock addresses with proper town/county from postcodes.io
      const addressData = {
        postcode: result.postcode,
        addresses: mockAddresses.map(addr => ({
          ...addr,
          town_or_city: result.admin_district || '',
          county: result.admin_county || result.region || '',
          country: result.country || 'England',
          latitude: result.latitude,
          longitude: result.longitude,
        })),
        source: 'demo',
        note: 'Demo addresses - configure getAddress.io API key for real individual addresses'
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
