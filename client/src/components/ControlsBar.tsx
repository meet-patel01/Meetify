import { Mic, MicOff, Video, VideoOff, Monitor, MessageCircle, Users, MoreHorizontal, Image } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ControlsBarProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  isChatOpen: boolean;
  participantCount: number;
  roomCode: string;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleChat: () => void;
  onShowParticipants: () => void;
  onShowVirtualBackground: () => void;
  onShowMoreOptions?: () => void;
}

export default function ControlsBar({
  isMuted,
  isVideoOff,
  isScreenSharing,
  isChatOpen,
  participantCount,
  roomCode,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleChat,
  onShowParticipants,
  onShowVirtualBackground,
  onShowMoreOptions,
}: ControlsBarProps) {
  return (
    <footer className="meeting-card px-4 py-4 border-t meeting-border">
      <div className="flex items-center justify-center space-x-4">
        {/* Audio Control */}
        <Button
          onClick={onToggleAudio}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors group ${
            isMuted
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          {isMuted ? (
            <MicOff className="text-white group-hover:scale-110 transition-transform w-5 h-5" />
          ) : (
            <Mic className="text-white group-hover:scale-110 transition-transform w-5 h-5" />
          )}
        </Button>

        {/* Video Control */}
        <Button
          onClick={onToggleVideo}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors group ${
            isVideoOff
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          {isVideoOff ? (
            <VideoOff className="text-white group-hover:scale-110 transition-transform w-5 h-5" />
          ) : (
            <Video className="text-white group-hover:scale-110 transition-transform w-5 h-5" />
          )}
        </Button>

        {/* Screen Share */}
        <Button
          onClick={onToggleScreenShare}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors group ${
            isScreenSharing
              ? 'bg-blue-500 hover:bg-blue-600'
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          <Monitor className="text-white group-hover:scale-110 transition-transform w-5 h-5" />
        </Button>

        {/* Chat Toggle (Mobile) */}
        <Button
          onClick={onToggleChat}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors group lg:hidden ${
            isChatOpen
              ? 'bg-primary hover:bg-primary/90'
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          <MessageCircle className="text-white group-hover:scale-110 transition-transform w-5 h-5" />
        </Button>

        {/* Participants */}
        <Button
          onClick={onShowParticipants}
          className="w-12 h-12 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors group"
        >
          <Users className="text-white group-hover:scale-110 transition-transform w-5 h-5" />
        </Button>

        {/* Virtual Backgrounds & Filters */}
        <Button
          onClick={onShowVirtualBackground}
          className="w-12 h-12 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors group"
          title="Virtual Backgrounds & Filters"
        >
          <Image className="text-white group-hover:scale-110 transition-transform w-5 h-5" />
        </Button>

        {/* More Options */}
        <Button
          onClick={onShowMoreOptions}
          className="w-12 h-12 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors group"
          data-testid="button-more-options"
        >
          <MoreHorizontal className="text-white group-hover:scale-110 transition-transform w-5 h-5" />
        </Button>
      </div>

      {/* Meeting Info Bar (Mobile) */}
      <div className="mt-3 text-center lg:hidden">
        <p className="text-sm text-gray-400">
          Room: <code className="text-emerald-400">{roomCode}</code> •{" "}
          <span>{participantCount} participants</span>
        </p>
      </div>
    </footer>
  );
}