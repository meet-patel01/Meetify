import { useEffect, useRef, useState } from "react";

interface Message {
  id: number;
  userId: string;
  content: string;
  userName?: string;
  createdAt: string;
}

interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

export function useWebSocket(roomId: number | undefined, user: User | undefined) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const messagesRef = useRef<Message[]>([]);

  // Keep messages ref in sync
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const connect = () => {
    if (!roomId || !user) return;

    setConnectionState('connecting');
    
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setConnectionState('connected');
      setSocket(ws);

      // Join room
      ws.send(JSON.stringify({
        type: 'join-room',
        roomId,
        userId: user.id,
        userName: user.firstName || user.email || 'User',
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'chat-message':
            const newMessage: Message = {
              id: data.message.id,
              userId: data.message.userId,
              content: data.message.content,
              userName: data.userName,
              createdAt: data.message.createdAt,
            };
            setMessages(prev => [...prev, newMessage]);
            break;
          case 'user-joined':
            console.log('User joined:', data.userName);
            break;
          case 'user-left':
            console.log('User left:', data.userId);
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      setSocket(null);
      setConnectionState('disconnected');
      
      // Attempt to reconnect after 3 seconds
      if (event.code !== 1000) { // Not a normal closure
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionState('error');
    };

    return ws;
  };

  useEffect(() => {
    if (roomId && user) {
      const ws = connect();
      
      return () => {
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        if (ws) {
          ws.close(1000, 'Component unmounting');
        }
      };
    }
  }, [roomId, user?.id]);

  const sendMessage = (content: string) => {
    if (socket && socket.readyState === WebSocket.OPEN && user) {
      socket.send(JSON.stringify({
        type: 'chat-message',
        content,
        userName: user.firstName || user.email || 'User',
      }));
    }
  };

  return {
    socket,
    messages,
    sendMessage,
    connectionState,
  };
}
