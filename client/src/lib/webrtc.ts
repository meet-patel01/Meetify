export async function getUserMedia(constraints: MediaStreamConstraints = { video: true, audio: true }): Promise<MediaStream> {
  try {
    // Check if browser supports getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('getUserMedia is not supported in this browser');
    }

    // Request permission and get media stream
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    
    // Verify we got the expected tracks
    const videoTracks = stream.getVideoTracks();
    const audioTracks = stream.getAudioTracks();
    
    console.log(`Media access granted - Video tracks: ${videoTracks.length}, Audio tracks: ${audioTracks.length}`);
    
    return stream;
  } catch (error: any) {
    console.error('Error accessing media devices:', error);
    
    // Provide more helpful error messages
    if (error.name === 'NotAllowedError') {
      throw new Error('Camera and microphone access denied. Please allow permissions and refresh the page.');
    } else if (error.name === 'NotFoundError') {
      throw new Error('No camera or microphone found. Please connect a device and try again.');
    } else if (error.name === 'NotReadableError') {
      throw new Error('Camera or microphone is already in use by another application.');
    } else if (error.name === 'OverconstrainedError') {
      // Try with less strict constraints
      console.log('Attempting with fallback constraints...');
      try {
        return await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 }, 
          audio: true 
        });
      } catch (fallbackError) {
        throw new Error('Camera constraints not supported. Please check your camera settings.');
      }
    } else {
      throw new Error(`Media access failed: ${error.message || 'Unknown error'}`);
    }
  }
}

export async function getDisplayMedia(): Promise<MediaStream> {
  try {
    // Check if browser supports getDisplayMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      throw new Error('Screen sharing is not supported in this browser');
    }

    const stream = await navigator.mediaDevices.getDisplayMedia({ 
      video: true, 
      audio: true 
    });
    
    console.log('Screen sharing access granted');
    return stream;
  } catch (error: any) {
    console.error('Error accessing display media:', error);
    
    if (error.name === 'NotAllowedError') {
      throw new Error('Screen sharing permission denied');
    } else if (error.name === 'NotFoundError') {
      throw new Error('No screen available for sharing');
    } else {
      throw new Error(`Screen sharing failed: ${error.message || 'Unknown error'}`);
    }
  }
}

export function createPeerConnection(): RTCPeerConnection {
  const configuration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  return new RTCPeerConnection(configuration);
}

export class WebRTCManager {
  private localStream: MediaStream | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private socket: WebSocket | null = null;
  private onRemoteStream?: (userId: string, stream: MediaStream) => void;

  constructor(socket: WebSocket | null) {
    this.socket = socket;
  }

  setOnRemoteStream(callback: (userId: string, stream: MediaStream) => void) {
    this.onRemoteStream = callback;
  }

  async initializeLocalStream(): Promise<MediaStream> {
    try {
      this.localStream = await getUserMedia();
      return this.localStream;
    } catch (error) {
      console.error('Failed to initialize local stream:', error);
      throw error;
    }
  }

  async createOffer(userId: string): Promise<void> {
    if (!this.localStream || !this.socket) return;

    const peerConnection = createPeerConnection();
    this.peerConnections.set(userId, peerConnection);

    // Add local stream tracks
    this.localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, this.localStream!);
    });

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      const remoteStream = event.streams[0];
      if (this.onRemoteStream) {
        this.onRemoteStream(userId, remoteStream);
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.socket) {
        this.socket.send(JSON.stringify({
          type: 'ice-candidate',
          candidate: event.candidate,
          targetUserId: userId,
        }));
      }
    };

    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      if (this.socket) {
        this.socket.send(JSON.stringify({
          type: 'offer',
          offer,
          targetUserId: userId,
        }));
      }
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  }

  async handleOffer(userId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.localStream || !this.socket) return;

    const peerConnection = createPeerConnection();
    this.peerConnections.set(userId, peerConnection);

    // Add local stream tracks
    this.localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, this.localStream!);
    });

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      const remoteStream = event.streams[0];
      if (this.onRemoteStream) {
        this.onRemoteStream(userId, remoteStream);
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.socket) {
        this.socket.send(JSON.stringify({
          type: 'ice-candidate',
          candidate: event.candidate,
          targetUserId: userId,
        }));
      }
    };

    try {
      await peerConnection.setRemoteDescription(offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      if (this.socket) {
        this.socket.send(JSON.stringify({
          type: 'answer',
          answer,
          targetUserId: userId,
        }));
      }
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }

  async handleAnswer(userId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const peerConnection = this.peerConnections.get(userId);
    if (peerConnection) {
      try {
        await peerConnection.setRemoteDescription(answer);
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    }
  }

  async handleIceCandidate(userId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const peerConnection = this.peerConnections.get(userId);
    if (peerConnection) {
      try {
        await peerConnection.addIceCandidate(candidate);
      } catch (error) {
        console.error('Error handling ICE candidate:', error);
      }
    }
  }

  cleanup(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }

    this.peerConnections.forEach(pc => pc.close());
    this.peerConnections.clear();
  }
}
