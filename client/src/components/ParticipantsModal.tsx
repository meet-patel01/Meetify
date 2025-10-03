import { X, Mic, MicOff, Video, VideoOff, Monitor, Crown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Participant {
  id: string;
  name: string;
  isHost: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  stream?: MediaStream;
}

interface ParticipantsModalProps {
  participants: Participant[];
  onClose: () => void;
}

export default function ParticipantsModal({ participants, onClose }: ParticipantsModalProps) {
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (userId: string) => {
    const colors = [
      'bg-blue-500',
      'bg-emerald-500', 
      'bg-purple-500',
      'bg-yellow-500',
      'bg-pink-500',
      'bg-indigo-500'
    ];
    const index = userId.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="meeting-card max-w-md max-h-96 overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-white">
              Participants ({participants.length})
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="space-y-3 overflow-y-auto">
          {participants.map((participant) => (
            <div key={participant.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getAvatarColor(participant.id)}`}>
                  <span className="text-sm font-medium text-white">
                    {getUserInitials(participant.name)}
                  </span>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-white">{participant.name}</p>
                    {participant.isHost && (
                      <Crown className="w-4 h-4 text-yellow-400" />
                    )}
                  </div>
                  <p className="text-sm text-gray-400">
                    {participant.isHost ? 'Host' : 'Participant'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {participant.isMuted ? (
                  <MicOff className="text-red-400 w-4 h-4" />
                ) : (
                  <Mic className="text-emerald-400 w-4 h-4" />
                )}
                {participant.isVideoOff ? (
                  <VideoOff className="text-red-400 w-4 h-4" />
                ) : (
                  <Video className="text-emerald-400 w-4 h-4" />
                )}
                {participant.isScreenSharing && (
                  <Monitor className="text-blue-400 w-4 h-4" />
                )}
              </div>
            </div>
          ))}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
