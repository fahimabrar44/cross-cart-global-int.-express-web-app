"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/AuthContext";
import { RoleGuard } from "@/middleware/roleGuard";
import { apiService } from "@/services/apiService";
import { MessageSquareHeart, ThumbsUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function FeedbackPage() {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState("");
  const [category, setCategory] = useState("feedback");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      toast.error("Please share your feedback");
      return;
    }
    setSubmitting(true);
    try {
      const response = await apiService.post("/contacts", {
        name: user?.name || "Feedback User",
        email: user?.email || "user@example.com",
        phone: user?.phone || "",
        category,
        message: feedback.trim(),
      });
      if (response.success) {
        toast.success("Feedback submitted. Thank you!");
        setFeedback("");
      } else {
        toast.error(response.message || "Failed to submit feedback");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const options = [
    { value: "feedback", label: "General Feedback" },
    { value: "complaint", label: "Complaint" },
    { value: "inquiry", label: "Inquiry" },
  ];

  return (
    <RoleGuard allowedRoles={["user", "admin", "moderator"]}>
      <div className="space-y-6 max-w-2xl mx-auto" data-testid="feedback-page">
        <div className="text-center">
          <div className="mx-auto bg-soft-green rounded-full p-4 inline-flex">
            <MessageSquareHeart className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mt-4">
            Your Feedback Matters
          </h1>
          <p className="text-muted-foreground mt-2">
            Help us improve our services with your valuable feedback
          </p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-6">
            <div>
              <Label>Feedback Type</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                {options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setCategory(option.value)}
                    className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                      category === option.value
                        ? "border-primary bg-soft-green text-primary"
                        : "border-border text-muted-foreground hover:border-primary"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Your Feedback *</Label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Tell us what you think..."
                rows={6}
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full flex items-center justify-center space-x-2"
            >
              <ThumbsUp className="h-4 w-4" />
              <span>{submitting ? "Submitting..." : "Submit Feedback"}</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}