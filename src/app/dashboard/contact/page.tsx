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
import { RoleGuard } from "@/middleware/roleGuard";
import { apiService } from "@/services/apiService";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Mail,
  MessageCircle,
  Phone,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function ContactPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      // Using generic API service since we don't have a specific contact service
      const response = await apiService.get("/contacts", { limit: 50 });
      if (response.success) {
        
                    {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                    {/* @ts-expect-error */}
        setContacts(response.data || []);
      } else {
        toast.error(response.message || "Failed to fetch contacts");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleView = (contact: any) => {
    setSelectedContact(contact);
    setIsDialogOpen(true);
  };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMarkAsRead = async (contact: any) => {
    try {
      const response = await apiService.patch(`/contacts/${contact._id}`, {
        isRead: true,
      });
      if (response.success) {
        toast.success("Contact marked as read");
        fetchContacts();
      } else {
        toast.error(response.message || "Failed to update contact");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    }
  };

  const statusLabels = {
    "new": "New",
    "in-progress": "In Progress",
    "resolved": "Resolved",
  } as const;

  const getStatusBadge = (status: string) => {
    const variants = {
      "new": "secondary",
      "in-progress": "default",
      "resolved": "outline",
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {statusLabels[status as keyof typeof statusLabels] || status || "New"}
      </Badge>
    );
  };

  const getSubjectIcon = (category: string) => {
    if (category?.toLowerCase().includes("support"))
      return <AlertCircle className="h-4 w-4" />;
    if (category?.toLowerCase().includes("complaint"))
      return <AlertCircle className="h-4 w-4" />;
    if (category?.toLowerCase().includes("inquiry"))
      return <MessageCircle className="h-4 w-4" />;
    return <Mail className="h-4 w-4" />;
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      inquiry: "Inquiry",
      complaint: "Complaint",
      feedback: "Feedback",
      support: "Support",
    } as const;
    return labels[category as keyof typeof labels] || category || "Inquiry";
  };

  const columns = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (value: string, row: any) => (
        <div className="flex items-center space-x-2">
          {getSubjectIcon(row.category)}
          <div>
            <p className="font-medium">{value}</p>
            <p className="text-sm text-gray-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      label: "Subject",
      sortable: true,
      render: (value: string) => getCategoryLabel(value),
    },
    {
      key: "status",
      label: "Status",
      render: (value: string) => getStatusBadge(value),
    },
    {
      key: "createdAt",
      label: "Received",
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
  ];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ContactDetails = ({ contact }: { contact: any }) => (
    <div className="space-y-6" data-testid="contact-details">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">
          {contact.category ? getCategoryLabel(contact.category) : "Contact Message"}
        </h3>
        {getStatusBadge(contact.status)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-500">Name</label>
          <p className="font-medium">{contact.name}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Email</label>
          <p className="font-medium">{contact.email}</p>
        </div>
        {contact.phone && (
          <div>
            <label className="text-sm font-medium text-gray-500">Phone</label>
            <p className="font-medium">{contact.phone}</p>
          </div>
        )}
        <div>
          <label className="text-sm font-medium text-gray-500">Received</label>
          <p className="font-medium">
            {new Date(contact.createdAt).toLocaleString()}
          </p>
        </div>
      </div>

      {contact.message && (
        <div>
          <label className="text-sm font-medium text-gray-500">Message</label>
          <div className="mt-1 p-4 bg-section rounded-lg">
            <p className="text-sm whitespace-pre-wrap">{contact.message}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap space-x-2 pt-4 border-t">
        {contact.status !== "resolved" && (
          <Button
            onClick={() => handleMarkAsRead(contact)}
            className="flex items-center space-x-2"
            data-testid="mark-read-btn"
          >
            <CheckCircle className="h-4 w-4" />
            <span>Mark as Read</span>
          </Button>
        )}
        <Button
          variant="outline"
          className="flex items-center space-x-2"
          onClick={() => window.open(`mailto:${contact.email}`, "_blank")}
          data-testid="reply-email-btn"
        >
          <Mail className="h-4 w-4" />
          <span>Reply via Email</span>
        </Button>
        {contact.phone && (
          <Button
            variant="outline"
            className="flex items-center space-x-2"
            onClick={() => window.open(`tel:${contact.phone}`, "_blank")}
            data-testid="call-btn"
          >
            <Phone className="h-4 w-4" />
            <span>Call</span>
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <RoleGuard allowedRoles={["admin", "moderator"]}>
      <div className="space-y-6" data-testid="contact-page">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Contact Messages
          </h1>
          <p className="text-muted-foreground">
            View and manage customer inquiries and support requests
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Messages
                  </p>
                  <p className="text-2xl font-bold">{contacts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Unread</p>
                  <p className="text-2xl font-bold">
                    {
                      contacts.filter(
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (contact: any) =>
                          contact.status === "new" && !contact.isRead
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
                  <p className="text-sm font-medium text-gray-600">Resolved</p>
                  <p className="text-2xl font-bold">
                    {
                      contacts.filter(
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (contact: any) => contact.status === "resolved"
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
                <MessageCircle className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">This Week</p>
                  <p className="text-2xl font-bold">
                    {// eslint-disable-next-line @typescript-eslint/no-explicit-any
                      contacts.filter((contact: any) => {
                        const contactDate = new Date(contact.createdAt);
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return contactDate >= weekAgo;
                      }).length
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DataTable
          title="Contact Messages"
          data={contacts}
          columns={columns}
          searchKeys={["name", "email", "category", "message"]}
          onView={handleView}
          loading={loading}
          actions={[
            {
              label: "View Message",
              onClick: handleView,
              variant: "default",
            },
            {
              label: "Mark as Read",
              onClick: handleMarkAsRead,
              variant: "default",
              condition: (contact) => contact.status !== "resolved",
            },
            {
              label: "Reply",
              onClick: (contact) =>
                window.open(`mailto:${contact.email}`, "_blank"),
              variant: "default",
            },
          ]}
        />

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Contact Message Details</DialogTitle>
            </DialogHeader>
            {selectedContact && <ContactDetails contact={selectedContact} />}
          </DialogContent>
        </Dialog>

        {/* Empty State */}
        {contacts.length === 0 && !loading && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Mail className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-foreground">
                  No contact messages
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Contact messages will appear here when customers reach out.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </RoleGuard>
  );
}
