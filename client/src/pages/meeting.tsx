import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useWebRTC } from "@/hooks/useWebRTC";
import VideoGrid from "@/components/VideoGrid";
import ChatSidebar from "@/components/ChatSidebar";
import ControlsBar from "@/components/ControlsBar";
import ParticipantsModal from "@/components/ParticipantsModal";
import ConnectionStatus from "@/components/ConnectionStatus";
import LectureNotesSidebar from "@/components/LectureNotesSidebar";
import FeedbackModal from "@/components/FeedbackModal";
import VirtualBackgroundSelector from "@/components/VirtualBackgroundSelector";
import CameraPermissionHelper from "@/components/CameraPermissionHelper";
import { Button } from "@/components/ui/button";
import { Video, Users, Settings, Copy, FileText, MessageSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { User, Room } from "@shared/schema";

interface Participant {
  id: string;
  name: string;
  isHost: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  stream?: MediaStream;
}

export default function Meeting() {
  const { roomId } = useParams<{ roomId: string }>();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showVirtualBackground, setShowVirtualBackground] = useState(false);
  const [showCameraHelper, setShowCameraHelper] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  // Fetch room data
  const { data: room, error: roomError } = useQuery<Room>({
    queryKey: ["/api/rooms", roomId],
    enabled: !!roomId && isAuthenticated,
    retry: false,
  });

  // Handle unauthorized errors
  useEffect(() => {
    if (roomError && isUnauthorizedError(roomError)) {
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
  }, [roomError, toast]);

  const {
    socket,
    messages,
    sendMessage,
    connectionState,
  } = useWebSocket(roomId ? parseInt(roomId) : undefined, user as any);

  const {
    localStream,
    remoteStreams,
    isScreenSharing: webRTCScreenSharing,
    currentBackground,
    currentFilter,
    startLocalStream,
    stopLocalStream,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    changeBackground,
    changeFilter,
  } = useWebRTC(socket, user ? (user as any).id : undefined);

  // Update connection status
  useEffect(() => {
    switch (connectionState) {
      case 'connecting':
        setConnectionStatus('Connecting...');
        break;
      case 'connected':
        setConnectionStatus(null);
        break;
      case 'disconnected':
        setConnectionStatus('Disconnected');
        break;
      case 'error':
        setConnectionStatus('Connection error');
        break;
    }
  }, [connectionState]);

  // Initialize local stream
  useEffect(() => {
    if (user && room) {
      startLocalStream().catch((error) => {
        console.error('Failed to start local stream:', error);
        setShowCameraHelper(true);
        toast({
          title: "Camera Access Required",
          description: "Click 'Test Permissions' to enable your camera and microphone.",
          variant: "destructive",
          duration: 5000,
        });
      });
    }

    return () => {
      stopLocalStream();
    };
  }, [user, room, toast, startLocalStream, stopLocalStream]);

  // Update participants list
  useEffect(() => {
    const updatedParticipants: Participant[] = [];

    // Add self
    if (user && (user as any).id) {
      const userTyped = user as any;
      updatedParticipants.push({
        id: userTyped.id,
        name: (userTyped.firstName || userTyped.email || 'You') as string,
        isHost: room?.hostId === userTyped.id,
        isMuted,
        isVideoOff,
        isScreenSharing: webRTCScreenSharing,
        stream: localStream || undefined,
      });
    }

    // Add remote participants
    remoteStreams.forEach((stream, userId) => {
      updatedParticipants.push({
        id: userId,
        name: `User ${userId.slice(0, 8)}`,
        isHost: false,
        isMuted: false,
        isVideoOff: false,
        isScreenSharing: false,
        stream,
      });
    });

    setParticipants(updatedParticipants);
  }, [user, room, localStream, remoteStreams, isMuted, isVideoOff, webRTCScreenSharing]);

  const handleLeaveRoom = () => {
    stopLocalStream();
    setLocation('/');
  };

  const handleToggleAudio = () => {
    toggleAudio();
    setIsMuted(!isMuted);
    toast({
      title: isMuted ? "Microphone unmuted" : "Microphone muted",
      description: isMuted ? "You can now speak" : "Your microphone is muted",
    });
  };

  const handleToggleVideo = () => {
    toggleVideo();
    setIsVideoOff(!isVideoOff);
    toast({
      title: isVideoOff ? "Camera turned on" : "Camera turned off",
      description: isVideoOff ? "Your camera is now active" : "Your camera is turned off",
    });
  };

  const handleToggleScreenShare = async () => {
    try {
      if (webRTCScreenSharing) {
        await stopScreenShare();
        toast({
          title: "Screen sharing stopped",
          description: "You are no longer sharing your screen",
        });
      } else {
        await startScreenShare();
        toast({
          title: "Screen sharing started",
          description: "You are now sharing your screen",
        });
      }
    } catch (error) {
      console.error('Screen sharing error:', error);
      toast({
        title: "Screen sharing error",
        description: error instanceof Error ? error.message : "Failed to toggle screen sharing",
        variant: "destructive",
      });
    }
  };

  const copyRoomCode = () => {
    if (room && room.code) {
      navigator.clipboard.writeText(room.code);
      toast({
        title: "Room code copied",
        description: "Share this code with others to join the meeting",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen meeting-bg flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen meeting-bg flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Room not found</h1>
          <Button onClick={() => setLocation('/')}>Return Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen meeting-bg text-white flex flex-col">
      {/* Header */}
      <header className="meeting-card px-4 py-3 flex items-center justify-between meeting-border border-b">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <Video className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold">Meetify</span>
          </div>
          <div className="hidden md:flex items-center space-x-2 text-sm text-gray-300">
            <span>Room:</span>
            <button
              onClick={copyRoomCode}
              className="bg-gray-700 px-2 py-1 rounded text-emerald-400 hover:bg-gray-600 transition-colors flex items-center space-x-1"
            >
              <code>{room && room.code}</code>
              <Copy className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center text-sm text-gray-300">
            <Users className="w-4 h-4 mr-2" />
            <span>{participants.length} participants</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsNotesOpen(!isNotesOpen)}
            className={`text-gray-300 hover:text-white ${isNotesOpen ? 'bg-primary/20 text-primary' : ''}`}
          >
            <FileText className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFeedbackModal(true)}
            className="text-gray-300 hover:text-white"
          >
            <MessageSquare className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(true)}
            className="text-gray-300 hover:text-white"
            data-testid="button-settings"
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Button
            onClick={handleLeaveRoom}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 text-sm font-medium"
          >
            Leave
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        <VideoGrid participants={participants} />
        {isChatOpen && (
          <ChatSidebar
            messages={messages}
            onSendMessage={sendMessage}
            onClose={() => setIsChatOpen(false)}
          />
        )}
        <LectureNotesSidebar
          roomId={parseInt(roomId || "0")}
          isOpen={isNotesOpen}
          onClose={() => setIsNotesOpen(false)}
        />
      </div>

      {/* Controls */}
      <ControlsBar
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        isScreenSharing={webRTCScreenSharing}
        isChatOpen={isChatOpen}
        participantCount={participants.length}
        roomCode={room?.code || ''}
        onToggleAudio={handleToggleAudio}
        onToggleVideo={handleToggleVideo}
        onToggleScreenShare={handleToggleScreenShare}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        onShowParticipants={() => setShowParticipants(true)}
        onShowVirtualBackground={() => setShowVirtualBackground(true)}
        onShowMoreOptions={() => setShowMoreOptions(true)}
      />

      {/* Modals */}
      {showParticipants && (
        <ParticipantsModal
          participants={participants}
          onClose={() => setShowParticipants(false)}
        />
      )}

      {/* Connection Status */}
      {connectionStatus && (
        <ConnectionStatus message={connectionStatus} />
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <FeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          roomId={parseInt(roomId || "0")}
        />
      )}

      <Dialog open={showVirtualBackground} onOpenChange={setShowVirtualBackground}>
        <DialogContent className="max-w-md bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Virtual Backgrounds & Filters</DialogTitle>
          </DialogHeader>
          <VirtualBackgroundSelector
            onBackgroundChange={changeBackground}
            onFilterChange={changeFilter}
            currentBackground={currentBackground}
            currentFilter={currentFilter}
          />
        </DialogContent>
      </Dialog>

      <CameraPermissionHelper
        isOpen={showCameraHelper}
        onClose={() => setShowCameraHelper(false)}
        onPermissionGranted={() => {
          setShowCameraHelper(false);
          // Retry starting the local stream
          startLocalStream().catch(console.error);
        }}
      />

      {/* Settings Modal */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-white">
            <div className="space-y-2">
              <h3 className="font-medium">Audio & Video</h3>
              <p className="text-sm text-gray-400">
                Microphone: {isMuted ? 'Muted' : 'Active'}
              </p>
              <p className="text-sm text-gray-400">
                Camera: {isVideoOff ? 'Off' : 'On'}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Connection</h3>
              <p className="text-sm text-gray-400">
                Status: {connectionState === 'connected' ? 'Connected' : connectionState}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Room Info</h3>
              <p className="text-sm text-gray-400">
                Room Code: {room?.code}
              </p>
              <p className="text-sm text-gray-400">
                Participants: {participants.length}
              </p>
            </div>
            <Button
              onClick={() => setShowSettings(false)}
              className="w-full bg-primary hover:bg-primary/90"
              data-testid="button-close-settings"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* More Options Modal */}
      <Dialog open={showMoreOptions} onOpenChange={setShowMoreOptions}>
        <DialogContent className="max-w-md bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">More Options</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Button
              onClick={() => {
                setShowMoreOptions(false);
                setShowSettings(true);
              }}
              variant="outline"
              className="w-full justify-start border-gray-600 text-gray-300 hover:bg-gray-700"
              data-testid="button-open-settings"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button
              onClick={() => {
                setShowMoreOptions(false);
                setShowFeedbackModal(true);
              }}
              variant="outline"
              className="w-full justify-start border-gray-600 text-gray-300 hover:bg-gray-700"
              data-testid="button-open-feedback"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Give Feedback
            </Button>
            <Button
              onClick={() => {
                setShowMoreOptions(false);
                setShowVirtualBackground(true);
              }}
              variant="outline"
              className="w-full justify-start border-gray-600 text-gray-300 hover:bg-gray-700"
              data-testid="button-open-backgrounds"
            >
              <Video className="w-4 h-4 mr-2" />
              Virtual Backgrounds
            </Button>
            <Button
              onClick={() => setShowMoreOptions(false)}
              className="w-full bg-gray-700 hover:bg-gray-600"
              data-testid="button-close-more-options"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}