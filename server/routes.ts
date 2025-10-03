import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./simpleAuth";
import { insertRoomSchema, insertMessageSchema, insertParticipantSchema, insertLectureNoteSchema, insertResourceSchema, insertFeedbackSchema } from "@shared/schema";

interface WebSocketWithUserId extends WebSocket {
  userId?: string;
  roomId?: number;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Room routes
  app.post('/api/rooms', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const roomData = insertRoomSchema.parse({
        ...req.body,
        hostId: userId,
        code: generateRoomCode(),
      });
      
      const room = await storage.createRoom(roomData);
      
      // Add host as participant
      await storage.addParticipant({
        roomId: room.id,
        userId: userId,
      });
      
      res.json(room);
    } catch (error) {
      console.error("Error creating room:", error);
      res.status(500).json({ message: "Failed to create room" });
    }
  });

  app.post('/api/rooms/join', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { code } = req.body;
      
      const room = await storage.getRoomByCode(code);
      if (!room || !room.isActive) {
        return res.status(404).json({ message: "Room not found or inactive" });
      }
      
      // Add user as participant
      await storage.addParticipant({
        roomId: room.id,
        userId: userId,
      });
      
      res.json(room);
    } catch (error) {
      console.error("Error joining room:", error);
      res.status(500).json({ message: "Failed to join room" });
    }
  });

  app.get('/api/rooms/:id', isAuthenticated, async (req: any, res) => {
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

  app.get('/api/rooms/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const messages = await storage.getMessages(roomId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.get('/api/rooms/:id/participants', isAuthenticated, async (req: any, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const participants = await storage.getRoomParticipants(roomId);
      res.json(participants);
    } catch (error) {
      console.error("Error fetching participants:", error);
      res.status(500).json({ message: "Failed to fetch participants" });
    }
  });

  // Lecture notes routes
  app.post('/api/rooms/:id/notes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const roomId = parseInt(req.params.id);
      const noteData = insertLectureNoteSchema.parse({
        ...req.body,
        roomId,
        capturedBy: userId,
      });
      
      const note = await storage.createLectureNote(noteData);
      res.json(note);
    } catch (error) {
      console.error("Error creating lecture note:", error);
      res.status(500).json({ message: "Failed to create lecture note" });
    }
  });

  app.get('/api/rooms/:id/notes', isAuthenticated, async (req: any, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const notes = await storage.getLectureNotes(roomId);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching lecture notes:", error);
      res.status(500).json({ message: "Failed to fetch lecture notes" });
    }
  });

  app.delete('/api/notes/:id', isAuthenticated, async (req: any, res) => {
    try {
      const noteId = parseInt(req.params.id);
      await storage.deleteLectureNote(noteId);
      res.json({ message: "Note deleted successfully" });
    } catch (error) {
      console.error("Error deleting lecture note:", error);
      res.status(500).json({ message: "Failed to delete lecture note" });
    }
  });

  // Resource routes
  app.post('/api/resources', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const resourceData = insertResourceSchema.parse({
        ...req.body,
        uploadedBy: userId,
      });
      
      const resource = await storage.createResource(resourceData);
      res.json(resource);
    } catch (error) {
      console.error("Error creating resource:", error);
      res.status(500).json({ message: "Failed to create resource" });
    }
  });

  app.get('/api/resources', isAuthenticated, async (req: any, res) => {
    try {
      const { tag } = req.query;
      const resources = tag 
        ? await storage.getResourcesByTag(tag as string)
        : await storage.getResources();
      res.json(resources);
    } catch (error) {
      console.error("Error fetching resources:", error);
      res.status(500).json({ message: "Failed to fetch resources" });
    }
  });

  app.delete('/api/resources/:id', isAuthenticated, async (req: any, res) => {
    try {
      const resourceId = parseInt(req.params.id);
      await storage.deleteResource(resourceId);
      res.json({ message: "Resource deleted successfully" });
    } catch (error) {
      console.error("Error deleting resource:", error);
      res.status(500).json({ message: "Failed to delete resource" });
    }
  });

  // Feedback routes
  app.post('/api/feedback', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const feedbackData = insertFeedbackSchema.parse({
        ...req.body,
        userId,
      });
      
      const feedbackRecord = await storage.createFeedback(feedbackData);
      res.json(feedbackRecord);
    } catch (error) {
      console.error("Error creating feedback:", error);
      res.status(500).json({ message: "Failed to create feedback" });
    }
  });

  app.get('/api/feedback', isAuthenticated, async (req: any, res) => {
    try {
      const { roomId } = req.query;
      const feedbackRecords = await storage.getFeedback(roomId ? parseInt(roomId as string) : undefined);
      res.json(feedbackRecords);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      res.status(500).json({ message: "Failed to fetch feedback" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time communication
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws: WebSocketWithUserId) => {
    console.log('New WebSocket connection');

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'join-room':
            ws.userId = message.userId;
            ws.roomId = message.roomId;
            
            // Broadcast to other participants in the room
            broadcastToRoom(message.roomId, {
              type: 'user-joined',
              userId: message.userId,
              userName: message.userName,
            }, ws);
            break;
            
          case 'leave-room':
            if (ws.roomId && ws.userId) {
              await storage.removeParticipant(ws.roomId, ws.userId);
              broadcastToRoom(ws.roomId, {
                type: 'user-left',
                userId: ws.userId,
              }, ws);
            }
            break;
            
          case 'chat-message':
            if (ws.roomId && ws.userId) {
              const chatMessage = await storage.createMessage({
                roomId: ws.roomId,
                userId: ws.userId,
                content: message.content,
              });
              
              broadcastToRoom(ws.roomId, {
                type: 'chat-message',
                message: chatMessage,
                userName: message.userName,
              });
            }
            break;
            
          case 'webrtc-offer':
          case 'webrtc-answer':
          case 'ice-candidate':
            // Forward WebRTC signaling messages to specific target
            if (message.targetUserId) {
              forwardToUser(message.targetUserId, message);
            } else {
              broadcastToRoom(ws.roomId, message, ws);
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', async () => {
      if (ws.roomId && ws.userId) {
        await storage.removeParticipant(ws.roomId, ws.userId);
        broadcastToRoom(ws.roomId, {
          type: 'user-left',
          userId: ws.userId,
        }, ws);
      }
    });
  });

  function broadcastToRoom(roomId: number | undefined, message: any, sender?: WebSocketWithUserId) {
    if (!roomId) return;
    
    wss.clients.forEach((client: WebSocketWithUserId) => {
      if (
        client !== sender &&
        client.roomId === roomId &&
        client.readyState === WebSocket.OPEN
      ) {
        client.send(JSON.stringify(message));
      }
    });
  }

  function forwardToUser(targetUserId: string, message: any) {
    wss.clients.forEach((client: WebSocketWithUserId) => {
      if (
        client.userId === targetUserId &&
        client.readyState === WebSocket.OPEN
      ) {
        client.send(JSON.stringify(message));
      }
    });
  }

  return httpServer;
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
