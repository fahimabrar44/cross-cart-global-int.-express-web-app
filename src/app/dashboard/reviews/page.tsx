"use client";
import { DataTable } from "@/components/Dashboard/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/AuthContext";
import { RoleGuard } from "@/middleware/roleGuard";
import { ContentService } from "@/services/dashboardService";
import { CheckCircle, Clock, Star, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

function ReviewsContent() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status");

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);{/*eslint-disable-next-line @typescript-eslint/no-explicit-any*/}
      const params: any = { limit: 50 };

      const response = await ContentService.getReviews(params);
      if (response.success) {
        let filteredReviews = response.data || [];

        // Apply status filter if present
        if (statusFilter) {
          filteredReviews = filteredReviews.filter(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (review: any) => review.status === statusFilter
          );
        }

                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
        setReviews(filteredReviews);
      } else {
        toast.error(response.message || "Failed to fetch reviews");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);
{/*eslint-disable-next-line @typescript-eslint/no-explicit-any*/}
  const handleView = (review: any) => {
    setSelectedReview(review);
    setIsDialogOpen(true);
  };
{/*eslint-disable-next-line @typescript-eslint/no-explicit-any*/}
  const handleApprove = async (review: any) => {
    try {
      const response = await ContentService.updateReview(review._id, {
        ...review,
        status: "approved",
      });

      if (response.success) {
        toast.success("Review approved successfully");
        fetchReviews();
      } else {
        toast.error(response.message || "Failed to approve review");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    }
  };
{/*eslint-disable-next-line @typescript-eslint/no-explicit-any*/}
  const handleReject = async (review: any) => {
    try {
      const response = await ContentService.updateReview(review._id, {
        ...review,
        status: "rejected",
      });

      if (response.success) {
        toast.success("Review rejected successfully");
        fetchReviews();
      } else {
        toast.error(response.message || "Failed to reject review");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    }
  };
{/*eslint-disable-next-line @typescript-eslint/no-explicit-any*/}
  const handleDelete = async (review: any) => {
    if (!confirm(`Are you sure you want to delete this review?`)) {
      return;
    }

    try {
      const response = await ContentService.deleteReview(review._id);
      if (response.success) {
        toast.success("Review deleted successfully");
        fetchReviews();
      } else {
        toast.error(response.message || "Failed to delete review");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "secondary",
      approved: "default",
      rejected: "destructive",
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {status}
      </Badge>
    );
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-2 text-sm font-medium">{rating}/5</span>
      </div>
    );
  };

  const columns = [
    {
      key: "rating",
      label: "Rating",
      render: (value: number) => renderStars(value || 0),
    },
    {
      key: "title",
      label: "Title",
      sortable: true,// eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (value: string, row: any) => (
        <div>
          <p className="font-medium">{value || "No title"}</p>
          <p className="text-sm text-gray-500 truncate max-w-md">
            {row.comment ? row.comment.substring(0, 60) + "..." : "No comment"}
          </p>
        </div>
      ),
    },
    {
      key: "user",
      label: "Reviewer",// eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (value: any) => (
        <div>
          <p className="font-medium">{value?.name || "Anonymous"}</p>
          <p className="text-sm text-gray-500">{value?.email || "No email"}</p>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value: string) => getStatusBadge(value || "pending"),
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
  ];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ReviewDetails = ({ review }: { review: any }) => (
    <div className="space-y-6" data-testid="review-details">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold">{review.title || "Review"}</h3>
          {renderStars(review.rating || 0)}
        </div>
        {getStatusBadge(review.status || "pending")}
      </div>

      {review.comment && (
        <div>
          <Label className="text-sm font-medium text-gray-500">Comment</Label>
          <p className="mt-1 text-sm whitespace-pre-wrap">{review.comment}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium text-gray-500">Reviewer</Label>
          <p className="font-medium">{review.user?.name || "Anonymous"}</p>
          {review.user?.email && (
            <p className="text-sm text-gray-500">{review.user.email}</p>
          )}
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-500">
            Service/Product
          </Label>
          <p className="font-medium">
            {review.service || review.product || "General"}
          </p>
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-500">
            Created At
          </Label>
          <p className="font-medium">
            {new Date(review.createdAt).toLocaleString()}
          </p>
        </div>

        {review.updatedAt && (
          <div>
            <Label className="text-sm font-medium text-gray-500">
              Updated At
            </Label>
            <p className="font-medium">
              {new Date(review.updatedAt).toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {(review.status === "pending" || user?.role === "admin") && (
        <div className="flex flex-wrap space-x-2 pt-4 border-t">
          {review.status === "pending" && (
            <>
              <Button
                onClick={() => handleApprove(review)}
                className="flex items-center space-x-2"
                data-testid="approve-review-btn"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Approve</span>
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleReject(review)}
                className="flex items-center space-x-2"
                data-testid="reject-review-btn"
              >
                <X className="h-4 w-4" />
                <span>Reject</span>
              </Button>
            </>
          )}
          {user?.role === "admin" && (
            <Button
              variant="outline"
              onClick={() => handleDelete(review)}
              className="flex items-center space-x-2"
              data-testid="delete-review-btn"
            >
              <X className="h-4 w-4" />
              <span>Delete</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );

  const Label = ({
    className,
    children,
  }: {
    className?: string;
    children: React.ReactNode;
  }) => <label className={className}>{children}</label>;

  return (
    <RoleGuard allowedRoles={["admin", "moderator"]}>
      <div className="space-y-6" data-testid="reviews-page">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Review Management
            </h1>
            <p className="text-muted-foreground">
              Manage customer reviews and feedback
              {statusFilter && ` - Filtered by status: ${statusFilter}`}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Reviews
                  </p>
                  <p className="text-2xl font-bold">{reviews.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold">
                    {
                      reviews.filter(// eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (review: any) => review.status === "pending"
                      ).length
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-bold">
                    {
                      reviews.filter(// eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (review: any) => review.status === "approved"
                      ).length
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Avg Rating
                  </p>
                  <p className="text-2xl font-bold">
                    {reviews.length > 0
                      ? (
                          reviews.reduce(// eslint-disable-next-line @typescript-eslint/no-explicit-any
                            (sum: number, review: any) =>
                              sum + (review.rating || 0),
                            0
                          ) / reviews.length
                        ).toFixed(1)
                      : "0.0"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DataTable
          title="Customer Reviews"
          data={reviews}
          columns={columns}
          searchKeys={["title", "comment", "user.name"]}
          onView={handleView}
          loading={loading}
          actions={[
            {
              label: "View Review",
              onClick: handleView,
              variant: "default",
            },
            {
              label: "Approve",
              onClick: handleApprove,
              variant: "default",
              condition: (review) => review.status === "pending",
            },
            {
              label: "Reject",
              onClick: handleReject,
              variant: "destructive",
              condition: (review) => review.status === "pending",
            },
            {
              label: "Delete",
              onClick: handleDelete,
              variant: "destructive",
              condition: () => user?.role === "admin",
            },
          ]}
        />

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Details</DialogTitle>
            </DialogHeader>
            {selectedReview && <ReviewDetails review={selectedReview} />}
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  );
}

export default function ReviewsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <ReviewsContent />
    </Suspense>
  );
}
