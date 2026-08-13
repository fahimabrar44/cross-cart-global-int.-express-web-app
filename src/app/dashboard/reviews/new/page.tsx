"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/AuthContext";
import { RoleGuard } from "@/middleware/roleGuard";
import { apiService } from "@/services/apiService";
import { Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function NewReviewPage() {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error("You must be signed in to leave a review");
      return;
    }
    if (!comment.trim()) {
      toast.error("Please write a review comment");
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiService.post("/reviews", {
        user: user.id,
        rating,
        comment: comment.trim(),
      });
      if (response.success) {
        toast.success("Review submitted successfully");
        setComment("");
        setRating(5);
      } else {
        toast.error(response.message || "Failed to submit review");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["user", "admin", "moderator"]}>
      <div className="space-y-6 max-w-2xl mx-auto" data-testid="new-review-page">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Write a Review</h1>
          <p className="text-muted-foreground">
            Share your experience with CrossCart Global Int Express
          </p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-6">
            <div>
              <Label>Rating</Label>
              <div className="flex items-center space-x-1 mt-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onMouseEnter={() => setHoverRating(value)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(value)}
                    className="p-1"
                  >
                    <Star
                      className={`h-8 w-8 transition-colors ${
                        value <= (hoverRating || rating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {rating} out of 5 stars
              </p>
            </div>

            <div>
              <Label htmlFor="review-comment">Your Review *</Label>
              <Textarea
                id="review-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell us about your shipping experience..."
                rows={5}
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full"
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}