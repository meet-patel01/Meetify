var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  feedback: () => feedback,
  insertFeedbackSchema: () => insertFeedbackSchema,
  insertLectureNoteSchema: () => insertLectureNoteSchema,
  insertMessageSchema: () => insertMessageSchema,
  insertParticipantSchema: () => insertParticipantSchema,
  insertResourceSchema: () => insertResourceSchema,
  insertRoomSchema: () => insertRoomSchema,
  lectureNotes: () => lectureNotes,
  messages: () => messages,
  resources: () => resources,
  roomParticipants: () => roomParticipants,
  rooms: () => rooms,
  sessions: () => sessions,
  users: () => users
});
import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  boolean
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);
var users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 10 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  hostId: varchar("host_id").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  roomId: serial("room_id").notNull(),
  userId: varchar("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
var roomParticipants = pgTable("room_participants", {
  id: serial("id").primaryKey(),
  roomId: serial("room_id").notNull(),
  userId: varchar("user_id").notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at")
});
var lectureNotes = pgTable("lecture_notes", {
  id: serial("id").primaryKey(),
  roomId: serial("room_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  capturedAt: timestamp("captured_at").defaultNow(),
  capturedBy: varchar("captured_by").notNull()
});
var resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  url: varchar("url", { length: 500 }),
  fileType: varchar("file_type", { length: 50 }),
  uploadedBy: varchar("uploaded_by").notNull(),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow()
});
var feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  roomId: serial("room_id"),
  userId: varchar("user_id").notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  // 'rating', 'suggestion', 'bug'
  rating: serial("rating"),
  // 1-5 stars
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow()
});
var insertRoomSchema = createInsertSchema(rooms).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true
});
var insertParticipantSchema = createInsertSchema(roomParticipants).omit({
  id: true,
  joinedAt: true,
  leftAt: true
});
var insertLectureNoteSchema = createInsertSchema(lectureNotes).omit({
  id: true,
  capturedAt: true
});
var insertResourceSchema = createInsertSchema(resources).omit({
  id: true,
  createdAt: true
});
var insertFeedbackSchema = createInsertSchema(feedback).omit({
  id: true,
  createdAt: true
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, and, desc } from "drizzle-orm";
var DatabaseStorage = class {
  // User operations
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async upsertUser(userData) {
    const [user] = await db.insert(users).values(userData).onConflictDoUpdate({
      target: users.id,
      set: {
        ...userData,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return user;
  }
  // Room operations
  async createRoom(roomData) {
    const [room] = await db.insert(rooms).values(roomData).returning();
    return room;
  }
  async getRoomByCode(code) {
    const [room] = await db.select().from(rooms).where(eq(rooms.code, code));
    return room;
  }
  async getRoom(id) {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    return room;
  }
  async updateRoom(id, updates) {
    const [room] = await db.update(rooms).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(rooms.id, id)).returning();
    return room;
  }
  // Message operations
  async getMessages(roomId) {
    return db.select().from(messages).where(eq(messages.roomId, roomId)).orderBy(desc(messages.createdAt)).limit(50);
  }
  async createMessage(messageData) {
    const [message] = await db.insert(messages).values(messageData).returning();
    return message;
  }
  // Participant operations
  async addParticipant(participantData) {
    const [participant] = await db.insert(roomParticipants).values(participantData).returning();
    return participant;
  }
  async removeParticipant(roomId, userId) {
    await db.update(roomParticipants).set({ leftAt: /* @__PURE__ */ new Date() }).where(
      and(
        eq(roomParticipants.roomId, roomId),
        eq(roomParticipants.userId, userId)
      )
    );
  }
  async getRoomParticipants(roomId) {
    return db.select().from(roomParticipants).where(
      and(
        eq(roomParticipants.roomId, roomId),
        isNull(roomParticipants.leftAt, null)
      )
    );
  }
  // Lecture notes operations
  async createLectureNote(noteData) {
    const [note] = await db.insert(lectureNotes).values(noteData).returning();
    return note;
  }
  async getLectureNotes(roomId) {
    return db.select().from(lectureNotes).where(eq(lectureNotes.roomId, roomId)).orderBy(desc(lectureNotes.capturedAt));
  }
  async deleteLectureNote(id) {
    await db.delete(lectureNotes).where(eq(lectureNotes.id, id));
  }
  // Resource operations
  async createResource(resourceData) {
    const [resource] = await db.insert(resources).values(resourceData).returning();
    return resource;
  }
  async getResources() {
    return db.select().from(resources).orderBy(desc(resources.createdAt));
  }
  async getResourcesByTag(tag) {
    return db.select().from(resources).where(eq(resources.tags, [tag])).orderBy(desc(resources.createdAt));
  }
  async deleteResource(id) {
    await db.delete(resources).where(eq(resources.id, id));
  }
  // Feedback operations
  async createFeedback(feedbackData) {
    const [feedbackRecord] = await db.insert(feedback).values(feedbackData).returning();
    return feedbackRecord;
  }
  async getFeedback(roomId) {
    if (roomId) {
      return db.select().from(feedback).where(eq(feedback.roomId, roomId)).orderBy(desc(feedback.createdAt));
    }
    return db.select().from(feedback).orderBy(desc(feedback.createdAt));
  }
};
var storage = new DatabaseStorage();

// server/simpleAuth.ts
import session from "express-session";
function getSession() {
  return session({
    secret: process.env.SESSION_SECRET || "default-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1e3
      // 1 week
    }
  });
}
async function setupAuth(app2) {
  app2.use(getSession());
  app2.post("/api/login", async (req, res) => {
    try {
      const { email, name } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      const userId = email.replace(/[^a-zA-Z0-9]/g, "");
      let user = await storage.getUser(userId);
      if (!user) {
        user = await storage.upsertUser({
          id: userId,
          email,
          firstName: name || email.split("@")[0],
          lastName: null,
          profileImageUrl: null
        });
      }
      req.session.user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName
      };
      res.json(user);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });
  app2.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });
}
var isAuthenticated = async (req, res, next) => {
  const sessionUser = req.session?.user;
  if (!sessionUser) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  req.user = {
    claims: {
      sub: sessionUser.id,
      email: sessionUser.email,
      first_name: sessionUser.firstName
    }
  };
  next();
};

// server/routes.ts
async function registerRoutes(app2) {
  await setupAuth(app2);
  app2.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  app2.post("/api/rooms", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const roomData = insertRoomSchema.parse({
        ...req.body,
        hostId: userId,
        code: generateRoomCode()
      });
      const room = await storage.createRoom(roomData);
      await storage.addParticipant({
        roomId: room.id,
        userId
      });
      res.json(room);
    } catch (error) {
      console.error("Error creating room:", error);
      res.status(500).json({ message: "Failed to create room" });
    }
  });
  app2.post("/api/rooms/join", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { code } = req.body;
      const room = await storage.getRoomByCode(code);
      if (!room || !room.isActive) {
        return res.status(404).json({ message: "Room not found or inactive" });
      }
      await storage.addParticipant({
        roomId: room.id,
        userId
      });
      res.json(room);
    } catch (error) {
      console.error("Error joining room:", error);
      res.status(500).json({ message: "Failed to join room" });
    }
  });
  app2.get("/api/rooms/:id", isAuthenticated, async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const room = await storage.getRoom(roomId);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      res.json(room);
    } catch (error) {
      console.error("Error fetching room:", error);
      res.status(500).json({ message: "Failed to fetch room" });
    }
  });
  app2.get("/api/rooms/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const messages2 = await storage.getMessages(roomId);
      res.json(messages2);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });
  app2.get("/api/rooms/:id/participants", isAuthenticated, async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const participants = await storage.getRoomParticipants(roomId);
      res.json(participants);
    } catch (error) {
      console.error("Error fetching participants:", error);
      res.status(500).json({ message: "Failed to fetch participants" });
    }
  });
  app2.post("/api/rooms/:id/notes", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const roomId = parseInt(req.params.id);
      const noteData = insertLectureNoteSchema.parse({
        ...req.body,
        roomId,
        capturedBy: userId
      });
      const note = await storage.createLectureNote(noteData);
      res.json(note);
    } catch (error) {
      console.error("Error creating lecture note:", error);
      res.status(500).json({ message: "Failed to create lecture note" });
    }
  });
  app2.get("/api/rooms/:id/notes", isAuthenticated, async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const notes = await storage.getLectureNotes(roomId);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching lecture notes:", error);
      res.status(500).json({ message: "Failed to fetch lecture notes" });
    }
  });
  app2.delete("/api/notes/:id", isAuthenticated, async (req, res) => {
    try {
      const noteId = parseInt(req.params.id);
      await storage.deleteLectureNote(noteId);
      res.json({ message: "Note deleted successfully" });
    } catch (error) {
      console.error("Error deleting lecture note:", error);
      res.status(500).json({ message: "Failed to delete lecture note" });
    }
  });
  app2.post("/api/resources", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const resourceData = insertResourceSchema.parse({
        ...req.body,
        uploadedBy: userId
      });
      const resource = await storage.createResource(resourceData);
      res.json(resource);
    } catch (error) {
      console.error("Error creating resource:", error);
      res.status(500).json({ message: "Failed to create resource" });
    }
  });
  app2.get("/api/resources", isAuthenticated, async (req, res) => {
    try {
      const { tag } = req.query;
      const resources2 = tag ? await storage.getResourcesByTag(tag) : await storage.getResources();
      res.json(resources2);
    } catch (error) {
      console.error("Error fetching resources:", error);
      res.status(500).json({ message: "Failed to fetch resources" });
    }
  });
  app2.delete("/api/resources/:id", isAuthenticated, async (req, res) => {
    try {
      const resourceId = parseInt(req.params.id);
      await storage.deleteResource(resourceId);
      res.json({ message: "Resource deleted successfully" });
    } catch (error) {
      console.error("Error deleting resource:", error);
      res.status(500).json({ message: "Failed to delete resource" });
    }
  });
  app2.post("/api/feedback", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const feedbackData = insertFeedbackSchema.parse({
        ...req.body,
        userId
      });
      const feedbackRecord = await storage.createFeedback(feedbackData);
      res.json(feedbackRecord);
    } catch (error) {
      console.error("Error creating feedback:", error);
      res.status(500).json({ message: "Failed to create feedback" });
    }
  });
  app2.get("/api/feedback", isAuthenticated, async (req, res) => {
    try {
      const { roomId } = req.query;
      const feedbackRecords = await storage.getFeedback(roomId ? parseInt(roomId) : void 0);
      res.json(feedbackRecords);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      res.status(500).json({ message: "Failed to fetch feedback" });
    }
  });
  const httpServer = createServer(app2);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  wss.on("connection", (ws2) => {
    console.log("New WebSocket connection");
    ws2.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        switch (message.type) {
          case "join-room":
            ws2.userId = message.userId;
            ws2.roomId = message.roomId;
            broadcastToRoom(message.roomId, {
              type: "user-joined",
              userId: message.userId,
              userName: message.userName
            }, ws2);
            break;
          case "leave-room":
            if (ws2.roomId && ws2.userId) {
              await storage.removeParticipant(ws2.roomId, ws2.userId);
              broadcastToRoom(ws2.roomId, {
                type: "user-left",
                userId: ws2.userId
              }, ws2);
            }
            break;
          case "chat-message":
            if (ws2.roomId && ws2.userId) {
              const chatMessage = await storage.createMessage({
                roomId: ws2.roomId,
                userId: ws2.userId,
                content: message.content
              });
              broadcastToRoom(ws2.roomId, {
                type: "chat-message",
                message: chatMessage,
                userName: message.userName
              });
            }
            break;
          case "webrtc-offer":
          case "webrtc-answer":
          case "webrtc-ice-candidate":
            broadcastToRoom(ws2.roomId, message, ws2);
            break;
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });
    ws2.on("close", async () => {
      if (ws2.roomId && ws2.userId) {
        await storage.removeParticipant(ws2.roomId, ws2.userId);
        broadcastToRoom(ws2.roomId, {
          type: "user-left",
          userId: ws2.userId
        }, ws2);
      }
    });
  });
  function broadcastToRoom(roomId, message, sender) {
    if (!roomId) return;
    wss.clients.forEach((client) => {
      if (client !== sender && client.roomId === roomId && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }
  return httpServer;
}
function generateRoomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
