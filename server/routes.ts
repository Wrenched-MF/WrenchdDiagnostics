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

  const httpServer = createServer(app);
  return httpServer;
}
