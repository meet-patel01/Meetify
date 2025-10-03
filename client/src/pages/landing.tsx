import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Video, Users, MessageCircle, Monitor } from "lucide-react";

export default function Landing() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginData, setLoginData] = useState({
    email: "",
    name: "",
  });

  const loginMutation = useMutation({
    mutationFn: async (userData: { email: string; name: string }) => {
      const response = await apiRequest("POST", "/api/login", userData);
      return response.json();
    },
    onSuccess: (data) => {
      console.log("Login successful:", data);
      toast({
        title: "Welcome!",
        description: "You have been logged in successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setShowLoginModal(false);
      
      // Navigate to home page using router
      setTimeout(() => {
        setLocation('/');
      }, 500);
    },
    onError: (error) => {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleLogin = () => {
    if (!loginData.email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate(loginData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <Video className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            Meetify
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Connect with your classmates through high-quality video calls, 
            real-time chat, and seamless screen sharing.
          </p>
          <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
            <DialogTrigger asChild>
              <Button 
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white px-8 py-3 text-lg font-semibold"
              >
                Get Started
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-800 text-white border-gray-700">
              <DialogHeader>
                <DialogTitle>Welcome to Meetify</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="name">Your Name (Optional)</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={loginData.name}
                    onChange={(e) => setLoginData({...loginData, name: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <Button
                  onClick={handleLogin}
                  disabled={loginMutation.isPending}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {loginMutation.isPending ? "Signing in..." : "Sign In"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6 text-center">
              <Video className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-white">HD Video Calls</h3>
              <p className="text-gray-400">Crystal clear video quality for all your meetings</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6 text-center">
              <Users className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-white">Multiple Participants</h3>
              <p className="text-gray-400">Connect with multiple classmates simultaneously</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6 text-center">
              <MessageCircle className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-white">Real-time Chat</h3>
              <p className="text-gray-400">Send messages and share files during calls</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6 text-center">
              <Monitor className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-white">Screen Sharing</h3>
              <p className="text-gray-400">Share your screen for presentations and collaboration</p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <p className="text-gray-400 mb-4">Ready to connect with your study group?</p>
          <Button 
            onClick={handleLogin}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Sign In to Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
