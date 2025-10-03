import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  BookOpen, 
  Plus, 
  FileText, 
  Link2, 
  Download, 
  Trash2, 
  Search,
  Video,
  LogOut,
} from "lucide-react";

interface Resource {
  id: number;
  title: string;
  description?: string;
  url?: string;
  fileType?: string;
  uploadedBy: string;
  tags: string[];
  createdAt: string;
}

export default function Resources() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newResource, setNewResource] = useState({
    title: "",
    description: "",
    url: "",
    fileType: "",
    tags: "",
  });

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ["/api/resources"],
    retry: false,
  });

  const createResourceMutation = useMutation({
    mutationFn: async (resourceData: any) => {
      const response = await apiRequest("POST", "/api/resources", {
        ...resourceData,
        tags: resourceData.tags.split(",").map((tag: string) => tag.trim()).filter(Boolean),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Resource added",
        description: "Resource has been successfully added to the hub",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      setShowAddModal(false);
      setNewResource({
        title: "",
        description: "",
        url: "",
        fileType: "",
        tags: "",
      });
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
        description: "Failed to add resource. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteResourceMutation = useMutation({
    mutationFn: async (resourceId: number) => {
      await apiRequest("DELETE", `/api/resources/${resourceId}`);
    },
    onSuccess: () => {
      toast({
        title: "Resource deleted",
        description: "Resource has been removed from the hub",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
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
        description: "Failed to delete resource.",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    fetch("/api/logout", { method: "POST" })
      .then(() => {
        window.location.reload();
      })
      .catch((error) => {
        console.error("Logout error:", error);
        window.location.reload();
      });
  };

  const filteredResources = resources.filter((resource: Resource) =>
    resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getFileTypeIcon = (fileType?: string) => {
    if (!fileType) return <FileText className="w-5 h-5" />;
    if (fileType.includes("video")) return <Video className="w-5 h-5" />;
    if (fileType.includes("pdf")) return <BookOpen className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading resources...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <header className="border-b border-gray-700 bg-gray-800/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Meetify Resource Hub</h1>
              <p className="text-sm text-gray-400">Study materials and resources</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div 
                className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center"
                style={{
                  backgroundImage: user?.profileImageUrl ? `url(${user.profileImageUrl})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {!user?.profileImageUrl && (
                  <span className="text-sm font-medium text-white">
                    {user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </span>
                )}
              </div>
              <span className="text-sm font-medium">
                {user?.firstName || user?.email || 'User'}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-300 hover:text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search resources by title, description, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-600 text-white"
              />
            </div>
            
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Resource
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-800 text-white">
                <DialogHeader>
                  <DialogTitle>Add New Resource</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newResource.title}
                      onChange={(e) => setNewResource({...newResource, title: e.target.value})}
                      className="bg-gray-700 border-gray-600"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newResource.description}
                      onChange={(e) => setNewResource({...newResource, description: e.target.value})}
                      className="bg-gray-700 border-gray-600"
                    />
                  </div>
                  <div>
                    <Label htmlFor="url">URL</Label>
                    <Input
                      id="url"
                      type="url"
                      value={newResource.url}
                      onChange={(e) => setNewResource({...newResource, url: e.target.value})}
                      className="bg-gray-700 border-gray-600"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fileType">File Type</Label>
                    <Input
                      id="fileType"
                      placeholder="e.g., PDF, Video, Document"
                      value={newResource.fileType}
                      onChange={(e) => setNewResource({...newResource, fileType: e.target.value})}
                      className="bg-gray-700 border-gray-600"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      placeholder="e.g., math, calculus, study-guide"
                      value={newResource.tags}
                      onChange={(e) => setNewResource({...newResource, tags: e.target.value})}
                      className="bg-gray-700 border-gray-600"
                    />
                  </div>
                  <Button
                    onClick={() => createResourceMutation.mutate(newResource)}
                    disabled={createResourceMutation.isPending || !newResource.title.trim()}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    {createResourceMutation.isPending ? "Adding..." : "Add Resource"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">
                  {searchQuery ? "No resources found" : "No resources yet"}
                </h3>
                <p className="text-gray-400">
                  {searchQuery 
                    ? "Try adjusting your search terms" 
                    : "Add the first resource to get started"
                  }
                </p>
              </div>
            ) : (
              filteredResources.map((resource: Resource) => (
                <Card key={resource.id} className="bg-gray-800 border-gray-700 hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        {getFileTypeIcon(resource.fileType)}
                        <CardTitle className="text-white text-sm font-medium line-clamp-2">
                          {resource.title}
                        </CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteResourceMutation.mutate(resource.id)}
                        className="text-gray-400 hover:text-red-400 h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {resource.description && (
                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                        {resource.description}
                      </p>
                    )}
                    
                    {resource.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {resource.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs bg-gray-700 text-gray-300">
                            {tag}
                          </Badge>
                        ))}
                        {resource.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-300">
                            +{resource.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{formatDate(resource.createdAt)}</span>
                      {resource.url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(resource.url, '_blank')}
                          className="text-primary hover:text-primary/80 h-8 px-2"
                        >
                          <Link2 className="w-3 h-3 mr-1" />
                          Open
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}