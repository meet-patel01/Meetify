import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import JoinRoomModal from "@/components/JoinRoomModal";
import FeedbackModal from "@/components/FeedbackModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, LogOut, Users, Calendar, BookOpen, MessageSquare } from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [modalMode, setModalMode] = useState<'join' | 'create'>('join');

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <header className="border-b border-gray-700 bg-gray-800/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Video className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold">Meetify</h1>
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
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">
              Welcome back, {user?.firstName || 'Student'}!
            </h2>
            <p className="text-gray-300">Ready to connect with your classmates?</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <Users className="w-5 h-5 mr-2 text-blue-400" />
                  Quick Meeting
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 mb-4">Start an instant meeting with your study group</p>
                <Button 
                  onClick={() => {
                    setModalMode('create');
                    setShowJoinModal(true);
                  }}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  Start Meeting
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <Calendar className="w-5 h-5 mr-2 text-emerald-400" />
                  Join Meeting
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 mb-4">Join an existing meeting with a room code</p>
                <Button 
                  onClick={() => {
                    setModalMode('join');
                    setShowJoinModal(true);
                  }}
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Join Room
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <BookOpen className="w-5 h-5 mr-2 text-purple-400" />
                  Resource Hub
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 mb-4">Access study materials and resources</p>
                <Link href="/resources">
                  <Button 
                    variant="outline"
                    className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Browse Resources
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <MessageSquare className="w-5 h-5 mr-2 text-yellow-400" />
                  Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 mb-4">Share your thoughts and suggestions</p>
                <Button 
                  onClick={() => setShowFeedbackModal(true)}
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Give Feedback
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {showJoinModal && (
        <JoinRoomModal 
          onClose={() => setShowJoinModal(false)} 
          mode={modalMode}
        />
      )}

      {showFeedbackModal && (
        <FeedbackModal 
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
        />
      )}
    </div>
  );
}
