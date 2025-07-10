import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import connectPg from "connect-pg-simple";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

async function hashPassword(password: string) {
  return await bcrypt.hash(password, 10);
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    return await bcrypt.compare(supplied, stored);
  } catch (error) {
    console.error("Password comparison error:", error);
    return false;
  }
}

export function setupAuth(app: Express) {
  const PostgresStore = connectPg(session);
  const sessionStore = new PostgresStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false, // Don't create table, it already exists
  });

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "fallback-secret-for-dev",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log('Login attempt for username:', username);
        const user = await storage.getUserByUsername(username);
        if (!user) {
          console.log('User not found:', username);
          return done(null, false);
        }
        
        console.log('Password comparison for user:', { id: user.id, username: user.username });
        console.log('Stored password hash:', user.password);
        console.log('Supplied password:', password);
        
        const passwordMatch = await comparePasswords(password, user.password);
        console.log('Password match result:', passwordMatch);
        
        if (!passwordMatch) {
          console.log('Password mismatch for user:', username);
          return done(null, false);
        } else {
          console.log('Password match successful for user:', username);
          return done(null, user);
        }
      } catch (error) {
        console.error('LocalStrategy error:', error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user || false);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Generate unique ID
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const user = await storage.createUser({
        id: userId,
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isApproved: user.isApproved,
          isActive: user.isActive,
          subscriptionStatus: user.subscriptionStatus,
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    const user = req.user!;
    console.log('Login successful for user:', { id: user.id, username: user.username });
    res.status(200).json({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isApproved: user.isApproved,
      isActive: user.isActive,
      subscriptionStatus: user.subscriptionStatus,
    });
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user!;
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isApproved: user.isApproved,
      isActive: user.isActive,
      subscriptionStatus: user.subscriptionStatus,
    });
  });
}

export function isAuthenticated(req: any, res: any, next: any) {
  console.log('Auth middleware check:', {
    isAuthenticated: req.isAuthenticated(),
    hasSession: !!req.session,
    sessionID: req.sessionID,
    user: req.user ? { id: req.user.id, username: req.user.username } : null
  });
  
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}