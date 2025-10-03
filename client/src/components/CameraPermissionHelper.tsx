import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, Mic, AlertCircle, CheckCircle } from "lucide-react";
import { getUserMedia } from "@/lib/webrtc";

interface CameraPermissionHelperProps {
  isOpen: boolean;
  onClose: () => void;
  onPermissionGranted: () => void;
}

export default function CameraPermissionHelper({ 
  isOpen, 
  onClose, 
  onPermissionGranted 
}: CameraPermissionHelperProps) {
  const [isTestingPermissions, setIsTestingPermissions] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');

  const testPermissions = async () => {
    setIsTestingPermissions(true);
    try {
      const stream = await getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach(track => track.stop()); // Clean up
      setPermissionStatus('granted');
      setTimeout(() => {
        onPermissionGranted();
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Permission test failed:', error);
      setPermissionStatus('denied');
    } finally {
      setIsTestingPermissions(false);
    }
  };

  const getInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome') || userAgent.includes('chromium')) {
      return (
        <div className="space-y-3">
          <p>In Chrome:</p>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Look for the camera icon in your address bar</li>
            <li>Click on it and select "Always allow"</li>
            <li>Refresh the page</li>
          </ol>
        </div>
      );
    } else if (userAgent.includes('firefox')) {
      return (
        <div className="space-y-3">
          <p>In Firefox:</p>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Look for the camera/microphone icon in your address bar</li>
            <li>Click "Allow" when prompted</li>
            <li>Refresh the page if needed</li>
          </ol>
        </div>
      );
    } else if (userAgent.includes('safari')) {
      return (
        <div className="space-y-3">
          <p>In Safari:</p>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Go to Safari → Preferences → Websites</li>
            <li>Select "Camera" and "Microphone" from the sidebar</li>
            <li>Set this website to "Allow"</li>
            <li>Refresh the page</li>
          </ol>
        </div>
      );
    }
    
    return (
      <div className="space-y-3">
        <p>To enable camera and microphone:</p>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Look for permission icons in your browser's address bar</li>
          <li>Click to allow camera and microphone access</li>
          <li>Refresh the page after granting permissions</li>
        </ol>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center space-x-2">
            <Camera className="w-5 h-5 text-primary" />
            <span>Camera & Microphone Access</span>
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            This meeting requires camera and microphone permissions to work properly.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {permissionStatus === 'denied' && (
            <Alert className="border-red-600 bg-red-950">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-200">
                Camera and microphone access was denied. Please follow the instructions below to enable permissions.
              </AlertDescription>
            </Alert>
          )}

          {permissionStatus === 'granted' && (
            <Alert className="border-green-600 bg-green-950">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-200">
                Permissions granted! Starting your camera...
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <Camera className="w-4 h-4 text-primary" />
              <Mic className="w-4 h-4 text-primary" />
              <span className="text-white text-sm font-medium">How to Enable Permissions</span>
            </div>
            <div className="text-gray-300 text-sm">
              {getInstructions()}
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={testPermissions}
              disabled={isTestingPermissions}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {isTestingPermissions ? 'Testing...' : 'Test Permissions'}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
          </div>

          <div className="text-xs text-gray-400 text-center">
            If you continue to have issues, try refreshing the page or using a different browser.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}