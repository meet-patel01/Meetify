import {
  users,
  rooms,
  messages,
  roomParticipants,
  lectureNotes,
  resources,
  feedback,
  type User,
  type UpsertUser,
  type Room,
  type InsertRoom,
  type Message,
  type InsertMessage,
  type RoomParticipant,
  type InsertParticipant,
  type LectureNote,
  type InsertLectureNote,
  type Resource,
  type InsertResource,
  type Feedback,
  type InsertFeedback,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, isNull } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Room operations
  createRoom(room: InsertRoom): Promise<Room>;
  getRoomByCode(code: string): Promise<Room | undefined>;
  getRoom(id: number): Promise<Room | undefined>;
  updateRoom(id: number, updates: Partial<Room>): Promise<Room>;
  
  // Message operations
  getMessages(roomId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Participant operations
  addParticipant(participant: InsertParticipant): Promise<RoomParticipant>;
  removeParticipant(roomId: number, userId: string): Promise<void>;
  getRoomParticipants(roomId: number): Promise<RoomParticipant[]>;
  
  // Lecture notes operations
  createLectureNote(note: InsertLectureNote): Promise<LectureNote>;
  getLectureNotes(roomId: number): Promise<LectureNote[]>;
  deleteLectureNote(id: number): Promise<void>;
  
  // Resource operations
  createResource(resource: InsertResource): Promise<Resource>;
  getResources(): Promise<Resource[]>;
  getResourcesByTag(tag: string): Promise<Resource[]>;
  deleteResource(id: number): Promise<void>;
  
  // Feedback operations
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  getFeedback(roomId?: number): Promise<Feedback[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Room operations
  async createRoom(roomData: InsertRoom): Promise<Room> {
    const [room] = await db.insert(rooms).values(roomData).returning();
    return room;
  }

  async getRoomByCode(code: string): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.code, code));
    return room;
  }

  async getRoom(id: number): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    return room;
  }

  async updateRoom(id: number, updates: Partial<Room>): Promise<Room> {
    const [room] = await db
      .update(rooms)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(rooms.id, id))
      .returning();
    return room;
  }

  // Message operations
  async getMessages(roomId: number): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(eq(messages.roomId, roomId))
      .orderBy(desc(messages.createdAt))
      .limit(50);
  }

  async createMessage(messageData: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(messageData).returning();
    return message;
  }

  // Participant operations
  async addParticipant(participantData: InsertParticipant): Promise<RoomParticipant> {
    const [participant] = await db
      .insert(roomParticipants)
      .values(participantData)
      .returning();
    return participant;
  }

  async removeParticipant(roomId: number, userId: string): Promise<void> {
    await db
      .update(roomParticipants)
      .set({ leftAt: new Date() })
      .where(
        and(
          eq(roomParticipants.roomId, roomId),
          eq(roomParticipants.userId, userId)
        )
      );
  }

  async getRoomParticipants(roomId: number): Promise<RoomParticipant[]> {
    return db
      .select()
      .from(roomParticipants)
      .where(
        and(
          eq(roomParticipants.roomId, roomId),
          isNull(roomParticipants.leftAt)
        )
      );
  }

  // Lecture notes operations
  async createLectureNote(noteData: InsertLectureNote): Promise<LectureNote> {
    const [note] = await db.insert(lectureNotes).values(noteData).returning();
    return note;
  }

  async getLectureNotes(roomId: number): Promise<LectureNote[]> {
    return db
      .select()
      .from(lectureNotes)
      .where(eq(lectureNotes.roomId, roomId))
      .orderBy(desc(lectureNotes.capturedAt));
  }

  async deleteLectureNote(id: number): Promise<void> {
    await db.delete(lectureNotes).where(eq(lectureNotes.id, id));
  }

  // Resource operations
  async createResource(resourceData: InsertResource): Promise<Resource> {
    const [resource] = await db.insert(resources).values(resourceData).returning();
    return resource;
  }

  async getResources(): Promise<Resource[]> {
    return db
      .select()
      .from(resources)
      .orderBy(desc(resources.createdAt));
  }

  async getResourcesByTag(tag: string): Promise<Resource[]> {
    return db
      .select()
      .from(resources)
      .where(eq(resources.tags, [tag]))
      .orderBy(desc(resources.createdAt));
  }

  async deleteResource(id: number): Promise<void> {
    await db.delete(resources).where(eq(resources.id, id));
  }

  // Feedback operations
  async createFeedback(feedbackData: InsertFeedback): Promise<Feedback> {
    const [feedbackRecord] = await db.insert(feedback).values(feedbackData).returning();
    return feedbackRecord;
  }

  async getFeedback(roomId?: number): Promise<Feedback[]> {
    if (roomId) {
      return db
        .select()
        .from(feedback)
        .where(eq(feedback.roomId, roomId))
        .orderBy(desc(feedback.createdAt));
    }
    return db
      .select()
      .from(feedback)
      .orderBy(desc(feedback.createdAt));
  }
}

export const storage = new DatabaseStorage();
