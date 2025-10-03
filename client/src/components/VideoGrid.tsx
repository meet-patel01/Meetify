import { useRef, useEffect, useState } from "react";
import { Mic, MicOff, Video, VideoOff, Monitor, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Participant {
  id: string;
  name: string;
  isHost: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  stream?: MediaStream;
}

interface VideoGridProps {
  participants: Participant[];
}

interface VideoTileProps {
  participant: Participant;
  isSelf?: boolean;
  isPinned?: boolean;
  onPin?: () => void;
}

function VideoTile({ participant, isSelf = false, isPinned = false, onPin }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream;
    }
  }, [participant.stream]);

  const getConnectionColor = () => {
    // Simulate connection quality
    const colors = ["bg-emerald-500", "bg-yellow-500", "bg-red-500"];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  return (
    <div className={`relative meeting-card rounded-xl overflow-hidden group ${isPinned ? 'ring-2 ring-primary' : ''}`}>
      {participant.stream && !participant.isVideoOff ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isSelf} // Always mute self to prevent feedback
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
          <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center">
            <span className="text-2xl font-medium text-gray-400">
              {participant.name.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      )}

      {/* Video Controls Overlay */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="flex items-center space-x-2">
          <span className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm font-medium">
            {participant.name}
            {participant.isHost && " (Host)"}
            {isSelf && " (You)"}
          </span>
          <div className="flex items-center space-x-1">
            {participant.isMuted && (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <MicOff className="text-red-400 w-4 h-4" />
              </>
            )}
            {participant.isVideoOff && (
              <VideoOff className="text-red-400 w-4 h-4" />
            )}
            {participant.isScreenSharing && (
              <Monitor className="text-blue-400 w-4 h-4" />
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onPin}
          className={`p-2 rounded-full transition-colors ${
            isPinned 
              ? 'bg-primary text-white hover:bg-primary/90' 
              : 'bg-black bg-opacity-50 text-white hover:bg-opacity-75'
          }`}
          data-testid={`button-pin-${participant.id}`}
        >
          <Pin className="w-4 h-4" />
        </Button>
      </div>

      {/* Connection Status */}
      <div className="absolute top-4 right-4 flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${getConnectionColor()}`}></div>
      </div>
    </div>
  );
}

export default function VideoGrid({ participants }: VideoGridProps) {
  const [pinnedParticipantId, setPinnedParticipantId] = useState<string | null>(null);
  const { toast } = useToast();

  const handlePin = (participantId: string) => {
    if (pinnedParticipantId === participantId) {
      setPinnedParticipantId(null);
      toast({
        title: "Unpinned",
        description: "Participant unpinned",
      });
    } else {
      setPinnedParticipantId(participantId);
      toast({
        title: "Pinned",
        description: "Participant pinned to top",
      });
    }
  };

  const getGridCols = () => {
    const count = participants.length;
    if (count <= 1) return "grid-cols-1";
    if (count <= 2) return "md:grid-cols-2";
    if (count <= 4) return "md:grid-cols-2 lg:grid-cols-2";
    return "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
  };

  // Sort participants to show pinned participant first
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.id === pinnedParticipantId) return -1;
    if (b.id === pinnedParticipantId) return 1;
    return 0;
  });

  return (
    <main className="flex-1 meeting-bg p-4">
      <div className="h-full">
        <div className={`grid grid-cols-1 ${getGridCols()} gap-4 h-full`}>
          {sortedParticipants.map((participant) => (
            <VideoTile
              key={participant.id}
              participant={participant}
              isSelf={participant.name.includes("You")}
              isPinned={participant.id === pinnedParticipantId}
              onPin={() => handlePin(participant.id)}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
