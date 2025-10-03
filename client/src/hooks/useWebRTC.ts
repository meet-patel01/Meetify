import { useRef, useState, useCallback, useEffect } from "react";
import { createPeerConnection, getUserMedia, getDisplayMedia } from "@/lib/webrtc";
import { VideoEffectsProcessor } from "@/lib/videoEffects";
import type { BackgroundOption, FilterOption } from "@/components/VirtualBackgroundSelector";

export function useWebRTC(socket: WebSocket | null, userId: string | undefined) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [currentBackground, setCurrentBackground] = useState<BackgroundOption>({ id: 'none', name: 'None', type: 'none' });
  const [currentFilter, setCurrentFilter] = useState<FilterOption>({ id: 'none', name: 'None', type: 'none' });
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const screenStreamRef = useRef<MediaStream | null>(null);
  const originalStreamRef = useRef<MediaStream | null>(null);
  const effectsProcessor = useRef<VideoEffectsProcessor | null>(null);

  const startLocalStream = useCallback(async () => {
    try {
      console.log('Requesting camera and microphone access...');
      const stream = await getUserMedia();
      originalStreamRef.current = stream;
      
      // Initialize effects processor
      if (!effectsProcessor.current) {
        effectsProcessor.current = new VideoEffectsProcessor();
      }
      
      // Apply current effects
      const processedStream = await effectsProcessor.current.processStream(
        stream,
        currentBackground,
        currentFilter
      );
      
      setLocalStream(processedStream);
      localStreamRef.current = processedStream;
      console.log('Local stream started successfully');
      return processedStream;
    } catch (error) {
      console.error('Error starting local stream:', error);
      
      // Try to provide a fallback with audio only if video fails
      try {
        console.log('Attempting audio-only fallback...');
        const audioOnlyStream = await getUserMedia({ video: false, audio: true });
        originalStreamRef.current = audioOnlyStream;
        setLocalStream(audioOnlyStream);
        localStreamRef.current = audioOnlyStream;
        console.log('Audio-only stream started as fallback');
        return audioOnlyStream;
      } catch (audioError) {
        console.error('Audio-only fallback also failed:', audioError);
        
        // Create a completely empty stream as last resort
        console.log('Creating empty stream as final fallback...');
        const emptyStream = new MediaStream();
        setLocalStream(emptyStream);
        localStreamRef.current = emptyStream;
        
        throw new Error('Camera and microphone access denied. Please click the camera icon in your browser address bar and allow permissions, then refresh the page.');
      }
    }
  }, [currentBackground, currentFilter]);

  const stopLocalStream = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }
    
    if (originalStreamRef.current) {
      originalStreamRef.current.getTracks().forEach(track => track.stop());
      originalStreamRef.current = null;
    }
    
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
      setIsScreenSharing(false);
    }

    if (effectsProcessor.current) {
      effectsProcessor.current.cleanup();
      effectsProcessor.current = null;
    }

    // Close all peer connections
    peerConnections.current.forEach(pc => pc.close());
    peerConnections.current.clear();
    setRemoteStreams(new Map());
  }, []);

  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      }
    }
  }, []);

  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await getDisplayMedia();
      screenStreamRef.current = screenStream;
      setIsScreenSharing(true);

      // Replace video track in all peer connections
      const videoTrack = screenStream.getVideoTracks()[0];
      peerConnections.current.forEach(async (pc) => {
        const sender = pc.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }
      });

      // Update local stream with screen share
      if (localStreamRef.current) {
        const audioTrack = localStreamRef.current.getAudioTracks()[0];
        const newStream = new MediaStream([videoTrack]);
        if (audioTrack) {
          newStream.addTrack(audioTrack);
        }
        setLocalStream(newStream);
        localStreamRef.current = newStream;
      }

      // Handle screen share ending
      videoTrack.onended = async () => {
        setIsScreenSharing(false);
        screenStreamRef.current = null;
        
        // Restart camera when screen share ends
        try {
          const cameraStream = await getUserMedia();
          const newVideoTrack = cameraStream.getVideoTracks()[0];
          
          // Replace screen share track with camera track
          peerConnections.current.forEach(async (pc) => {
            const sender = pc.getSenders().find(s => 
              s.track && s.track.kind === 'video'
            );
            if (sender) {
              await sender.replaceTrack(newVideoTrack);
            }
          });

          // Update local stream
          const audioTrack = localStreamRef.current?.getAudioTracks()[0];
          const newStream = new MediaStream([newVideoTrack]);
          if (audioTrack) {
            newStream.addTrack(audioTrack);
          }
          setLocalStream(newStream);
          localStreamRef.current = newStream;
        } catch (error) {
          console.error('Error restarting camera after screen share:', error);
        }
      };

      return screenStream;
    } catch (error) {
      console.error('Error starting screen share:', error);
      throw error;
    }
  }, []);

  const stopScreenShare = useCallback(async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
      setIsScreenSharing(false);

      // Restart camera
      try {
        const cameraStream = await getUserMedia();
        const videoTrack = cameraStream.getVideoTracks()[0];
        
        // Replace screen share track with camera track
        peerConnections.current.forEach(async (pc) => {
          const sender = pc.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          if (sender) {
            await sender.replaceTrack(videoTrack);
          }
        });

        // Update local stream
        const audioTrack = localStreamRef.current?.getAudioTracks()[0];
        const newStream = new MediaStream([videoTrack]);
        if (audioTrack) {
          newStream.addTrack(audioTrack);
        }
        setLocalStream(newStream);
        localStreamRef.current = newStream;
      } catch (error) {
        console.error('Error restarting camera after stopping screen share:', error);
      }
    }
  }, []);

  const createPeerConnection = useCallback((userId: string) => {
    if (!socket || !localStreamRef.current) return;

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    // Add local stream tracks
    localStreamRef.current.getTracks().forEach(track => {
      pc.addTrack(track, localStreamRef.current!);
    });

    // Handle remote stream
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      setRemoteStreams(prev => new Map(prev.set(userId, remoteStream)));
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.send(JSON.stringify({
          type: 'ice-candidate',
          candidate: event.candidate,
          targetUserId: userId,
        }));
      }
    };

    peerConnections.current.set(userId, pc);
    return pc;
  }, [socket]);

  const changeBackground = useCallback(async (background: BackgroundOption) => {
    setCurrentBackground(background);
    
    if (effectsProcessor.current && originalStreamRef.current) {
      effectsProcessor.current.updateBackground(background);
    }
  }, []);

  const changeFilter = useCallback(async (filter: FilterOption) => {
    setCurrentFilter(filter);
    
    if (effectsProcessor.current && originalStreamRef.current) {
      effectsProcessor.current.updateFilter(filter);
    }
  }, []);

  // Handle WebSocket messages for WebRTC signaling
  useEffect(() => {
    if (!socket || !userId) return;

    const handleMessage = async (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'user-joined':
            if (message.userId !== userId && localStreamRef.current) {
              // Create peer connection for new user
              console.log('Creating peer connection for new user:', message.userName);
              const pc = createPeerConnection(message.userId);
              if (pc) {
                // Create offer for the new user
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                socket.send(JSON.stringify({
                  type: 'webrtc-offer',
                  offer: offer,
                  targetUserId: message.userId,
                  fromUserId: userId,
                }));
              }
            }
            break;

          case 'webrtc-offer':
            if (message.targetUserId === userId) {
              console.log('Received WebRTC offer from:', message.fromUserId);
              const pc = createPeerConnection(message.fromUserId);
              if (pc) {
                await pc.setRemoteDescription(new RTCSessionDescription(message.offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.send(JSON.stringify({
                  type: 'webrtc-answer',
                  answer: answer,
                  targetUserId: message.fromUserId,
                  fromUserId: userId,
                }));
              }
            }
            break;

          case 'webrtc-answer':
            if (message.targetUserId === userId) {
              console.log('Received WebRTC answer from:', message.fromUserId);
              const pc = peerConnections.current.get(message.fromUserId);
              if (pc) {
                await pc.setRemoteDescription(new RTCSessionDescription(message.answer));
              }
            }
            break;

          case 'ice-candidate':
            if (message.targetUserId === userId) {
              console.log('Received ICE candidate from:', message.fromUserId);
              const pc = peerConnections.current.get(message.fromUserId);
              if (pc) {
                await pc.addIceCandidate(new RTCIceCandidate(message.candidate));
              }
            }
            break;

          case 'user-left':
            if (message.userId !== userId) {
              console.log('User left, cleaning up peer connection:', message.userId);
              const pc = peerConnections.current.get(message.userId);
              if (pc) {
                pc.close();
                peerConnections.current.delete(message.userId);
              }
              setRemoteStreams(prev => {
                const newStreams = new Map(prev);
                newStreams.delete(message.userId);
                return newStreams;
              });
            }
            break;
        }
      } catch (error) {
        console.error('Error handling WebRTC message:', error);
      }
    };

    socket.addEventListener('message', handleMessage);

    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket, userId, createPeerConnection]);

  return {
    localStream,
    remoteStreams,
    isScreenSharing,
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
    createPeerConnection,
  };
}
