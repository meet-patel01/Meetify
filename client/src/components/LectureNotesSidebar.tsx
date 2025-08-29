import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, 
  Plus, 
  Save, 
  Trash2, 
  X, 
  Download,
  Clock,
  Edit3
} from "lucide-react";

interface LectureNote {
  id: number;
  roomId: number;
  title: string;
  content: string;
  capturedAt: string;
  capturedBy: string;
}

interface LectureNotesSidebarProps {
  roomId: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function LectureNotesSidebar({ roomId, isOpen, onClose }: LectureNotesSidebarProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
  });

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["/api/rooms", roomId, "notes"],
    enabled: isOpen && !!roomId,
    retry: false,
  });

  const createNoteMutation = useMutation({
    mutationFn: async (noteData: { title: string; content: string }) => {
      const response = await apiRequest("POST", `/api/rooms/${roomId}/notes`, noteData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Note saved",
        description: "Lecture note has been saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms", roomId, "notes"] });
      setIsCreating(false);
      setNewNote({ title: "", content: "" });
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
        description: "Failed to save note. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: number) => {
      await apiRequest("DELETE", `/api/notes/${noteId}`);
    },
    onSuccess: () => {
      toast({
        title: "Note deleted",
        description: "Lecture note has been removed",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms", roomId, "notes"] });
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
        description: "Failed to delete note.",
        variant: "destructive",
      });
    },
  });

  // Auto-capture transcript functionality (simulated)
  useEffect(() => {
    if (!isOpen) return;

    const autoCapture = () => {
      // This would be connected to speech recognition API in a real implementation
      const capturedText = "Auto-captured from meeting discussion...";
      
      if (isCreating && !newNote.content) {
        setNewNote(prev => ({
          ...prev,
          content: capturedText,
          title: prev.title || `Meeting Notes - ${new Date().toLocaleTimeString()}`
        }));
      }
    };

    // Simulate auto-capture every 30 seconds during active note creation
    const interval = setInterval(autoCapture, 30000);
    return () => clearInterval(interval);
  }, [isOpen, isCreating, newNote.content]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const downloadNote = (note: LectureNote) => {
    const content = `# ${note.title}\n\nCaptured: ${formatDate(note.capturedAt)} at ${formatTime(note.capturedAt)}\n\n${note.content}`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <aside className="w-80 meeting-card border-l meeting-border flex flex-col">
      <div className="p-4 border-b meeting-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-lg text-white">Lecture Notes</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-400 mt-1">Auto-capture and save meeting notes</p>
      </div>

      <ScrollArea className="flex-1 p-4">
        {/* Create New Note */}
        {!isCreating ? (
          <Button
            onClick={() => setIsCreating(true)}
            className="w-full mb-4 bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Note
          </Button>
        ) : (
          <Card className="bg-gray-700 border-gray-600 mb-4">
            <CardHeader className="pb-3">
              <Input
                placeholder="Note title..."
                value={newNote.title}
                onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                className="bg-gray-800 border-gray-600 text-white text-sm"
              />
            </CardHeader>
            <CardContent className="pt-0">
              <Textarea
                placeholder="Start typing or let auto-capture fill this..."
                value={newNote.content}
                onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                className="bg-gray-800 border-gray-600 text-white text-sm min-h-[120px] mb-3"
              />
              <div className="flex space-x-2">
                <Button
                  onClick={() => createNoteMutation.mutate(newNote)}
                  disabled={createNoteMutation.isPending || !newNote.title.trim()}
                  size="sm"
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  <Save className="w-3 h-3 mr-1" />
                  Save
                </Button>
                <Button
                  onClick={() => {
                    setIsCreating(false);
                    setNewNote({ title: "", content: "" });
                  }}
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-gray-300"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center text-gray-400 py-8">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-sm">Loading notes...</p>
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No notes yet</p>
              <p className="text-xs">Create your first lecture note</p>
            </div>
          ) : (
            notes.map((note: LectureNote) => (
              <Card key={note.id} className="bg-gray-700 border-gray-600">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-white text-sm font-medium line-clamp-2">
                      {note.title}
                    </CardTitle>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadNote(note)}
                        className="text-gray-400 hover:text-blue-400 h-6 w-6 p-0"
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNoteMutation.mutate(note.id)}
                        className="text-gray-400 hover:text-red-400 h-6 w-6 p-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-gray-300 text-xs mb-3 line-clamp-3">
                    {note.content}
                  </p>
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>{formatTime(note.capturedAt)}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Auto-capture indicator */}
      {isCreating && (
        <div className="p-3 border-t meeting-border">
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Auto-capture active</span>
          </div>
        </div>
      )}
    </aside>
  );
}