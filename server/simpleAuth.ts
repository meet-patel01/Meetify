import session from "express-session";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";

// Simple session configuration for Vercel
export function getSession() {
  return session({
    secret: process.env.SESSION_SECRET || "default-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    },
  });
}

export async function setupAuth(app: Express) {
  app.use(getSession());

  // Simple login endpoint
  app.post('/api/login', async (req, res) => {
    try {
      const { email, name } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Validate email domain - only allow Gmail and Yahoo
      const emailLower = email.toLowerCase();
      const allowedDomains = ['@gmail.com', '@yahoo.com', '@yahoo.co.uk', '@yahoo.ca', '@yahoo.in'];
      const isValidDomain = allowedDomains.some(domain => emailLower.endsWith(domain));
      
      if (!isValidDomain) {
        return res.status(400).json({ 
          message: "Only Gmail and Yahoo email addresses are allowed" 
        });
      }

      // Create or find user
      const userId = email.replace(/[^a-zA-Z0-9]/g, ''); // Simple ID from email
      let user = await storage.getUser(userId);
      
      if (!user) {
        user = await storage.upsertUser({
          id: userId,
          email,
          firstName: name || email.split('@')[0],
          lastName: null,
          profileImageUrl: null,
        });
      }

      // Set session
      (req.session as any).user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
      };

      res.json(user);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout endpoint
  app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const sessionUser = (req.session as any)?.user;
  
  if (!sessionUser) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Attach user to request
  (req as any).user = {
    claims: {
      sub: sessionUser.id,
      email: sessionUser.email,
      first_name: sessionUser.firstName,
    }
  };

  next();
};