import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Meeting rooms
export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 10 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  hostId: varchar("host_id").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat messages
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  roomId: serial("room_id").notNull(),
  userId: varchar("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Room participants
export const roomParticipants = pgTable("room_participants", {
  id: serial("id").primaryKey(),
  roomId: serial("room_id").notNull(),
  userId: varchar("user_id").notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at"),
});

// Lecture notes
export const lectureNotes = pgTable("lecture_notes", {
  id: serial("id").primaryKey(),
  roomId: serial("room_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  capturedAt: timestamp("captured_at").defaultNow(),
  capturedBy: varchar("captured_by").notNull(),
});

// Resources
export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  url: varchar("url", { length: 500 }),
  fileType: varchar("file_type", { length: 50 }),
  uploadedBy: varchar("uploaded_by").notNull(),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Feedback
export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  roomId: serial("room_id"),
  userId: varchar("user_id").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'rating', 'suggestion', 'bug'
  rating: serial("rating"), // 1-5 stars
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schemas
export const insertRoomSchema = createInsertSchema(rooms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertParticipantSchema = createInsertSchema(roomParticipants).omit({
  id: true,
  joinedAt: true,
  leftAt: true,
});

export const insertLectureNoteSchema = createInsertSchema(lectureNotes).omit({
  id: true,
  capturedAt: true,
});

export const insertResourceSchema = createInsertSchema(resources).omit({
  id: true,
  createdAt: true,
});

export const insertFeedbackSchema = createInsertSchema(feedback).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Room = typeof rooms.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type RoomParticipant = typeof roomParticipants.$inferSelect;
export type InsertParticipant = z.infer<typeof insertParticipantSchema>;
export type LectureNote = typeof lectureNotes.$inferSelect;
export type InsertLectureNote = z.infer<typeof insertLectureNoteSchema>;
export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;
export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
