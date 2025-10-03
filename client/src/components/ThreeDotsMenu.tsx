
import React from 'react';
import { MoreVertical, Settings, UserPlus, LogOut, Camera, Mic, MicOff, CameraOff } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface ThreeDotsMenuProps {
  onInviteParticipants?: () => void;
  onToggleCamera?: () => void;
  onToggleMicrophone?: () => void;
  onSettings?: () => void;
  onLeave?: () => void;
  isCameraOn?: boolean;
  isMicrophoneOn?: boolean;
}

export const ThreeDotsMenu: React.FC<ThreeDotsMenuProps> = ({
  onInviteParticipants,
  onToggleCamera,
  onToggleMicrophone,
  onSettings,
  onLeave,
  isCameraOn = true,
  isMicrophoneOn = true,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="h-8 w-8 p-0 hover:bg-accent"
          aria-label="More options"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {onToggleCamera && (
          <DropdownMenuItem 
            onClick={onToggleCamera}
            className="cursor-pointer"
          >
            {isCameraOn ? (
              <>
                <CameraOff className="mr-2 h-4 w-4" />
                Turn off camera
              </>
            ) : (
              <>
                <Camera className="mr-2 h-4 w-4" />
                Turn on camera
              </>
            )}
          </DropdownMenuItem>
        )}
        {onToggleMicrophone && (
          <DropdownMenuItem 
            onClick={onToggleMicrophone}
            className="cursor-pointer"
          >
            {isMicrophoneOn ? (
              <>
                <MicOff className="mr-2 h-4 w-4" />
                Mute microphone
              </>
            ) : (
              <>
                <Mic className="mr-2 h-4 w-4" />
                Unmute microphone
              </>
            )}
          </DropdownMenuItem>
        )}
        {(onToggleCamera || onToggleMicrophone) && <DropdownMenuSeparator />}
        {onInviteParticipants && (
          <DropdownMenuItem 
            onClick={onInviteParticipants}
            className="cursor-pointer"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Invite participants
          </DropdownMenuItem>
        )}
        {onSettings && (
          <DropdownMenuItem 
            onClick={onSettings}
            className="cursor-pointer"
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
        )}
        {(onInviteParticipants || onSettings) && onLeave && <DropdownMenuSeparator />}
        {onLeave && (
          <DropdownMenuItem 
            onClick={onLeave}
            className="cursor-pointer text-red-600 focus:text-red-600"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Leave meeting
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
