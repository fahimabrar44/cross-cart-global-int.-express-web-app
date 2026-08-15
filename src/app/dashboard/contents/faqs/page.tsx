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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RoleGuard } from "@/middleware/roleGuard";
import { FaqService } from "@/services/dashboardService";
import { Edit, Eye, HelpCircle, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface FaqFormData {
  question: string;
  answer: string;
  category: string;
  order: number;
  isActive: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface FaqRow {
  _id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  isActive: boolean;
  createdAt: string;
}

export default function FaqsPage() {
  const [faqs, setFaqs] = useState<FaqRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFaq, setSelectedFaq] = useState<FaqRow | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | "view">(
    "create"
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FaqFormData>({
    defaultValues: {
      question: "",
      answer: "",
      category: "General",
      order: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const response = await FaqService.getFaqs({ limit: 200 });
      if (response.success) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setFaqs((response.data as any[]) || []);
      } else {
        toast.error(response.message || "Failed to fetch FAQs");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    reset();
    setSelectedFaq(null);
    setDialogMode("create");
    setIsDialogOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEdit = (faq: any) => {
    setSelectedFaq(faq);
    setDialogMode("edit");
    setValue("question", faq.question || "");
    setValue("answer", faq.answer || "");
    setValue("category", faq.category || "General");
    setValue("order", typeof faq.order === "number" ? faq.order : 0);
    setValue("isActive", faq.isActive !== false);
    setIsDialogOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleView = (faq: any) => {
    setSelectedFaq(faq);
    setDialogMode("view");
    setIsDialogOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDelete = async (faq: any) => {
    if (!confirm(`Are you sure you want to delete this FAQ?`)) {
      return;
    }

    try {
      const response = await FaqService.deleteFaq(faq._id);
      if (response.success) {
        toast.success("FAQ deleted successfully");
        fetchFaqs();
      } else {
        toast.error(response.message || "Failed to delete FAQ");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    }
  };

  const onSubmit = async (data: FaqFormData) => {
    try {
      let response;
      if (dialogMode === "edit" && selectedFaq) {
        response = await FaqService.updateFaq(selectedFaq._id, data);
      } else {
        response = await FaqService.createFaq(data);
      }

      if (response.success) {
        toast.success(
          `FAQ ${dialogMode === "edit" ? "updated" : "created"} successfully`
        );
        setIsDialogOpen(false);
        fetchFaqs();
      } else {
        toast.error(response.message || `Failed to ${dialogMode} FAQ`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    }
  };

  const getStatusBadge = (isActive: boolean) => (
    <Badge variant={isActive ? "default" : "secondary"}>
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );

  const columns = [
    {
      key: "question",
      label: "Question",
      sortable: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (value: string, row: any) => (
        <div>
          <p className="font-medium line-clamp-2">{value}</p>
          <p className="text-sm text-gray-500">{row.category}</p>
        </div>
      ),
    },
    {
      key: "category",
      label: "Category",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (value: string) => <Badge variant="outline">{value}</Badge>,
    },
    {
      key: "order",
      label: "Order",
      sortable: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (value: number) => value ?? 0,
    },
    {
      key: "isActive",
      label: "Status",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (value: boolean) => getStatusBadge(value),
    },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const FaqDetails = ({ faq }: { faq: any }) => (
    <div className="space-y-4" data-testid="faq-details">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-xl font-bold">{faq.question}</h2>
        {getStatusBadge(faq.isActive !== false)}
      </div>
      <div>
        <Label className="text-sm font-medium text-gray-500">Category</Label>
        <p className="mt-1 text-sm text-gray-700">{faq.category}</p>
      </div>
      <div>
        <Label className="text-sm font-medium text-gray-500">Answer</Label>
        <p className="mt-1 whitespace-pre-line text-sm text-gray-700">
          {faq.answer}
        </p>
      </div>
      <div>
        <Label className="text-sm font-medium text-gray-500">Order</Label>
        <p className="mt-1 text-sm text-gray-700">{faq.order ?? 0}</p>
      </div>
    </div>
  );

  return (
    <RoleGuard allowedRoles={["admin", "moderator"]}>
      <div className="space-y-6" data-testid="faqs-page">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">FAQ Management</h1>
            <p className="text-muted-foreground">
              Add, edit and manage frequently asked questions
            </p>
          </div>
          <Button onClick={handleCreate} data-testid="create-faq-btn">
            <Plus className="h-4 w-4 mr-2" />
            Add FAQ
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{faqs.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <HelpCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold">
                    {faqs.filter((f) => f.isActive !== false).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <HelpCircle className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Inactive</p>
                  <p className="text-2xl font-bold">
                    {faqs.filter((f) => f.isActive === false).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DataTable
          title="FAQs"
          data={faqs}
          columns={columns}
          searchKeys={["question", "answer", "category"]}
          onEdit={handleEdit}
          onView={handleView}
          onDelete={handleDelete}
          loading={loading}
          actions={[
            { label: "View", onClick: handleView, variant: "default" },
            { label: "Edit", onClick: handleEdit, variant: "default" },
            { label: "Delete", onClick: handleDelete, variant: "destructive" },
          ]}
        />

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {dialogMode === "create" && "Add FAQ"}
                {dialogMode === "edit" && "Edit FAQ"}
                {dialogMode === "view" && "FAQ Details"}
              </DialogTitle>
            </DialogHeader>

            {dialogMode === "view" && selectedFaq ? (
              <FaqDetails faq={selectedFaq} />
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="question">Question</Label>
                  <Input
                    id="question"
                    {...register("question", {
                      required: "Question is required",
                    })}
                    placeholder="e.g. How can I track my shipment?"
                    data-testid="faq-question-input"
                  />
                  {errors.question && (
                    <p className="text-sm text-red-600">
                      {errors.question.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="answer">Answer</Label>
                  <Textarea
                    id="answer"
                    {...register("answer", {
                      required: "Answer is required",
                    })}
                    placeholder="Write the answer here"
                    rows={5}
                    data-testid="faq-answer-input"
                  />
                  {errors.answer && (
                    <p className="text-sm text-red-600">{errors.answer.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      {...register("category")}
                      placeholder="e.g. General, Shipping, Billing"
                      data-testid="faq-category-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="order">Display Order</Label>
                    <Input
                      id="order"
                      type="number"
                      {...register("order", { valueAsNumber: true })}
                    />
                    <p className="text-xs text-gray-500">
                      Lower numbers appear first
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="isActive">Status</Label>
                  <select
                    {...register("isActive")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    data-testid="faq-status-select"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>

                <div className="flex flex-wrap justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    data-testid="faq-form-cancel"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" data-testid="faq-form-submit">
                    {dialogMode === "edit" ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  );
}
