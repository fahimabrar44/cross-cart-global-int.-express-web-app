"use client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/AuthContext";
import { RoleGuard } from "@/middleware/roleGuard";
import { apiService } from "@/services/apiService";
import { History, LogIn, LogOut, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HistoryItem = any;

export default function LoginHistoryPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const phone = user?.phone || "";

  const fetchHistory = async () => {
    if (!phone) return;
    try {
      setLoading(true);
      const response = await apiService.get(`/accounts/${phone}/sigin-historys`, {
        limit: 100,
      });
      if (response.success) {
        setHistory((response.data as HistoryItem[]) || []);
      } else {
        toast.error(response.message || "Failed to fetch login history");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (phone) fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone]);

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      login: "Login",
      logout: "Logout",
      failed_login: "Failed Login",
      password_reset: "Password Reset",
      account_lock: "Account Lock",
    };
    return labels[action] || action || "Login";
  };

  const getActionIcon = (action: string) => {
    if (action === "failed_login")
      return <ShieldAlert className="h-4 w-4" />;
    if (action === "logout") return <LogOut className="h-4 w-4" />;
    return <LogIn className="h-4 w-4" />;
  };

  return (
    <RoleGuard allowedRoles={["admin", "moderator", "user"]}>
      <div className="space-y-6" data-testid="login-history-page">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Account Activity</h1>
          <p className="text-muted-foreground">
            Review recent login and security events on your account
          </p>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading activity...</p>
        ) : history.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <History className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-foreground">
                  No activity yet
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Login history will appear here as you use your account.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {history.map((item, index) => (
              <Card key={item._id || index}>
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex items-start space-x-3">
                    <div
                      className={`rounded-full p-2 ${
                        item.success === false
                          ? "bg-red-100"
                          : item.action === "logout"
                          ? "bg-gray-100"
                          : "bg-soft-green"
                      }`}
                    >
                      {getActionIcon(item.action)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-foreground">
                          {getActionLabel(item.action)}
                        </p>
                        <Badge
                          variant={
                            item.success === false ? "destructive" : "default"
                          }
                        >
                          {item.success === false ? "Failed" : "Success"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        IP: {item.ipAddress}
                      </p>
                      {item.failureReason && (
                        <p className="mt-1 text-sm text-red-600">
                          {item.failureReason}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>{new Date(item.timestamp).toLocaleString()}</p>
                    {item.deviceInfo?.browser && (
                      <p className="mt-1">
                        {item.deviceInfo.browser}
                        {item.deviceInfo.os && ` · ${item.deviceInfo.os}`}
                      </p>
                    )}
                    {item.location?.city && (
                      <p className="mt-1">
                        {item.location.city}
                        {item.location.country && `, ${item.location.country}`}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </RoleGuard>
  );
}