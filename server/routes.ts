import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import {
  updateUserRoleSchema,
  updateSubscriptionStatusSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@shared/schema";
import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcrypt";

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
  await setupAuth(app);

  app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Missing email or password" });
    }
    const mockUser = {
      id: "mock-user-123",
      name: "Luke Preece",
      email,
      role: "admin",
      isApproved: true,
    };
    return res.json({ user: mockUser, token: "mock-token-abc" });
  });

  // ✅ All routes from password reset to fit-finish should be added here.
  // Example: app.post('/api/auth/forgot-password', async (req, res) => { ... });

  const httpServer = createServer(app);
  return httpServer;
}
