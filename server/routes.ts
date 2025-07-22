                          import type { Express } from "express";
                          import { createServer, type Server } from "http";
                          import { storage } from "./storage";
                          import {
                            updateUserRoleSchema,
                            updateSubscriptionStatusSchema,
                            forgotPasswordSchema,
                            resetPasswordSchema,
                          } from "@shared/schema";
                          import { z } from "zod";
                          import crypto from "crypto";
                          import bcrypt from "bcrypt";

                          // Optional admin check middleware (can be removed if not needed)
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
                            // 👇 Login and auth removed — clean public API now

                            // Example public route (optional)
                            app.get("/api/ping", (req, res) => {
                              res.json({ message: "pong" });
                            });

                            const httpServer = createServer(app);
                            return httpServer;
                          }
