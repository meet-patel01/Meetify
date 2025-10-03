import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Star, MessageSquare, Bug, Lightbulb } from "lucide-react";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId?: number;
}

export default function FeedbackModal({ isOpen, onClose, roomId }: FeedbackModalProps) {
  const { toast } = useToast();
  const [feedbackType, setFeedbackType] = useState<string>("rating");
  const [rating, setRating] = useState<number>(0);
  const [message, setMessage] = useState("");

  const submitFeedbackMutation = useMutation({
    mutationFn: async (feedbackData: any) => {
      const response = await apiRequest("POST", "/api/feedback", feedbackData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thank you!",
        description: "Your feedback has been submitted successfully",
      });
      onClose();
      resetForm();
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
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFeedbackType("rating");
    setRating(0);
    setMessage("");
  };

  const handleSubmit = () => {
    if (feedbackType === "rating" && rating === 0) {
      toast({
        title: "Rating required",
        description: "Please provide a rating before submitting",
        variant: "destructive",
      });
      return;
    }

    if ((feedbackType === "suggestion" || feedbackType === "bug") && !message.trim()) {
      toast({
        title: "Message required",
        description: "Please provide details before submitting",
        variant: "destructive",
      });
      return;
    }

    submitFeedbackMutation.mutate({
      roomId,
      type: feedbackType,
      rating: feedbackType === "rating" ? rating : null,
      message: message.trim() || null,
    });
  };

  const getFeedbackIcon = (type: string) => {
    switch (type) {
      case "rating":
        return <Star className="w-4 h-4" />;
      case "suggestion":
        return <Lightbulb className="w-4 h-4" />;
      case "bug":
        return <Bug className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="meeting-card max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">
            Share Your Feedback
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Feedback Type Selection */}
          <div>
            <Label className="text-white mb-3 block">What would you like to share?</Label>
            <RadioGroup value={feedbackType} onValueChange={setFeedbackType}>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 p-3 rounded-lg bg-gray-700 border border-gray-600">
                  <RadioGroupItem value="rating" id="rating" />
                  <label 
                    htmlFor="rating" 
                    className="flex items-center space-x-2 text-white cursor-pointer flex-1"
                  >
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span>Rate this meeting</span>
                  </label>
                </div>
                
                <div className="flex items-center space-x-2 p-3 rounded-lg bg-gray-700 border border-gray-600">
                  <RadioGroupItem value="suggestion" id="suggestion" />
                  <label 
                    htmlFor="suggestion" 
                    className="flex items-center space-x-2 text-white cursor-pointer flex-1"
                  >
                    <Lightbulb className="w-4 h-4 text-blue-400" />
                    <span>Suggest improvement</span>
                  </label>
                </div>
                
                <div className="flex items-center space-x-2 p-3 rounded-lg bg-gray-700 border border-gray-600">
                  <RadioGroupItem value="bug" id="bug" />
                  <label 
                    htmlFor="bug" 
                    className="flex items-center space-x-2 text-white cursor-pointer flex-1"
                  >
                    <Bug className="w-4 h-4 text-red-400" />
                    <span>Report an issue</span>
                  </label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Rating Stars */}
          {feedbackType === "rating" && (
            <div>
              <Label className="text-white mb-3 block">How was your experience?</Label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`p-1 transition-colors ${
                      star <= rating ? "text-yellow-400" : "text-gray-600"
                    } hover:text-yellow-300`}
                  >
                    <Star className="w-8 h-8 fill-current" />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-sm text-gray-400 mt-2">
                  {rating === 1 && "We'll work hard to improve"}
                  {rating === 2 && "Thanks for the feedback"}
                  {rating === 3 && "Good to know, we'll keep improving"}
                  {rating === 4 && "Great! We're glad you had a good experience"}
                  {rating === 5 && "Awesome! Thank you for the excellent rating"}
                </p>
              )}
            </div>
          )}

          {/* Message Input */}
          <div>
            <Label className="text-white mb-3 block">
              {feedbackType === "rating" && "Additional comments (optional)"}
              {feedbackType === "suggestion" && "What would you like to see improved?"}
              {feedbackType === "bug" && "Please describe the issue you encountered"}
            </Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                feedbackType === "rating" 
                  ? "Tell us more about your experience..."
                  : feedbackType === "suggestion"
                  ? "Share your ideas for making Meetify better..."
                  : "Describe the problem and when it occurred..."
              }
              className="bg-gray-700 border-gray-600 text-white min-h-[100px]"
            />
          </div>

          {/* Submit Button */}
          <div className="flex space-x-3">
            <Button
              onClick={handleSubmit}
              disabled={submitFeedbackMutation.isPending}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {submitFeedbackMutation.isPending ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Submitting...
                </div>
              ) : (
                <>
                  {getFeedbackIcon(feedbackType)}
                  <span className="ml-2">Submit Feedback</span>
                </>
              )}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}