import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Video, Users, Plus } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";

interface JoinRoomModalProps {
  onClose: () => void;
  mode?: 'join' | 'create';
}

export default function JoinRoomModal({ onClose, mode = 'join' }: JoinRoomModalProps) {
  const [roomCode, setRoomCode] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  const createRoomMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/rooms", {
        name: `${user?.firstName || user?.email || 'User'}'s Meeting`,
      });
      return response.json();
    },
    onSuccess: (room) => {
      toast({
        title: "Room created",
        description: `Room code: ${room.code}`,
      });
      setLocation(`/meeting/${room.id}`);
      onClose();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create room. Please try again.",
        variant: "destructive",
      });
    },
  });

  const joinRoomMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("POST", "/api/rooms/join", { code });
      return response.json();
    },
    onSuccess: (room) => {
      toast({
        title: "Joined room",
        description: `Welcome to ${room.name || 'the meeting'}`,
      });
      setLocation(`/meeting/${room.id}`);
      onClose();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Room not found or invalid code.",
        variant: "destructive",
      });
    },
  });

  const handleJoinRoom = () => {
    if (!roomCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a room code.",
        variant: "destructive",
      });
      return;
    }
    joinRoomMutation.mutate(roomCode.trim().toUpperCase());
  };

  const handleCreateRoom = () => {
    createRoomMutation.mutate();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-white text-gray-900 max-w-md">
        <DialogHeader>
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Video className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">
              {mode === 'create' ? 'Start New Meeting' : 'Join Meeting'}
            </DialogTitle>
            <p className="text-gray-600">
              {mode === 'create' 
                ? 'Create a new room for your study group' 
                : 'Enter a room code to join an existing meeting'
              }
            </p>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {mode === 'join' ? (
            <>
              <div>
                <Label htmlFor="roomCode" className="text-sm font-medium text-gray-700 mb-2">
                  Room Code
                </Label>
                <Input
                  id="roomCode"
                  type="text"
                  placeholder="Enter room code (e.g. ABC123)"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  className="w-full"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleJoinRoom();
                    }
                  }}
                />
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleJoinRoom}
                  disabled={joinRoomMutation.isPending}
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                >
                  {joinRoomMutation.isPending ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Joining...
                    </div>
                  ) : (
                    <>
                      <Users className="w-4 h-4 mr-2" />
                      Join Room
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={handleCreateRoom}
                  disabled={createRoomMutation.isPending}
                  variant="outline"
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  {createRoomMutation.isPending ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-gray-700 border-t-transparent rounded-full animate-spin mr-2"></div>
                      Creating...
                    </div>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Room Instead
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="text-center text-gray-600 p-4 bg-gray-50 rounded-lg">
                <p className="font-medium">Ready to start your meeting?</p>
                <p className="text-sm mt-1">We'll create a room code that others can use to join.</p>
              </div>
              
              <Button
                onClick={handleCreateRoom}
                disabled={createRoomMutation.isPending}
                className="w-full bg-primary hover:bg-primary/90 text-white"
              >
                {createRoomMutation.isPending ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating Room...
                  </div>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Start Meeting
                  </>
                )}
              </Button>

              <Button
                onClick={() => onClose()}
                variant="outline"
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Users className="w-4 h-4 mr-2" />
                Join Existing Room Instead
              </Button>
            </div>
          )}

          <div className="text-center">
            <p className="text-sm text-gray-500">
              <span>{user?.firstName || user?.email || 'User'}</span> |{" "}
              <button
                onClick={() => window.location.href = "/api/logout"}
                className="text-primary hover:underline"
              >
                Sign Out
              </button>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
