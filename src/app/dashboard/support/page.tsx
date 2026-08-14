"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/AuthContext";
import { RoleGuard } from "@/middleware/roleGuard";
import { apiService } from "@/services/apiService";
import { Headset, LifeBuoy, Mail, Phone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function SupportPage() {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error("Please describe your issue");
      return;
    }
    setSubmitting(true);
    try {
      const response = await apiService.post("/contacts", {
        name: user?.name || "Support User",
        email: user?.email || "user@example.com",
        phone: user?.phone || "",
        category: "support",
        message: subject
          ? `Subject: ${subject}\n\n${message}`
          : message,
      });
      if (response.success) {
        toast.success("Support request submitted");
        setMessage("");
        setSubject("");
      } else {
        toast.error(response.message || "Failed to submit request");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["user", "admin", "moderator"]}>
      <div className="space-y-6" data-testid="support-page">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support</h1>
          <p className="text-muted-foreground">
            Need help? Our team is ready to assist you around the clock
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="bg-soft-green rounded-full p-3">
                  <Headset className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Contact Support</h3>
                  <p className="text-sm text-muted-foreground">
                    Submit a support ticket
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label>Subject</Label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief summary of your issue"
                  />
                </div>
                <div>
                  <Label>Message *</Label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your issue in detail..."
                    rows={5}
                  />
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full"
                >
                  {submitting ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardContent className="p-6 flex items-start space-x-4">
                <div className="bg-section rounded-full p-3">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Email Us</h3>
                  <p className="text-sm text-muted-foreground">
                    support@crosscartglobal.com
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-start space-x-4">
                <div className="bg-section rounded-full p-3">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Call Us</h3>
                  <p className="text-sm text-muted-foreground">
                    +8801XXXXXXXXX (24/7 support line)
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-start space-x-4">
                <div className="bg-section rounded-full p-3">
                  <LifeBuoy className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Help Center</h3>
                  <p className="text-sm text-muted-foreground">
                    Visit our{" "}
                    <a
                      href="/help-and-support"
                      className="text-primary hover:underline"
                    >
                      Help & Support
                    </a>{" "}
                    page for guides and FAQs.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}