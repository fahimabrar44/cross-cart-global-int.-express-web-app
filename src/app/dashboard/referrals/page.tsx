"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RoleGuard } from "@/middleware/roleGuard";
import { apiService } from "@/services/apiService";
import { useAuth } from "@/hooks/AuthContext";
import { Copy, Users, Gift, Award } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Referral = any;

export default function ReferralsPage() {
  const { user } = useAuth();
  const isStaff = user?.role === "admin" || user?.role === "moderator";
  const [myInfo, setMyInfo] = useState<Referral>(null);
  const [list, setList] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);

      if (isStaff) {
        const res = await apiService.get("/referrals/list", { limit: 100 });
        if (res.success) setList((res.data as Referral[]) || []);
      } else {
        const res = await apiService.get("/referrals/me");
        if (res.success) setMyInfo(res.data);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  const copyCode = async () => {
    if (!myInfo?.referralCode) return;
    try {
      await navigator.clipboard.writeText(myInfo.referralCode);
      toast.success("Referral code copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  const markRewarded = async (referralId: string) => {
    if (!confirm("Mark this referral as rewarded?")) return;
    try {
      const res = await apiService.put("/referrals/list", { referralId });
      if (res.success) {
        toast.success("Referral marked as rewarded");
        fetchData();
      } else {
        toast.error(res.message || "Failed to update referral");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    }
  };

  const baseOrigin =
    typeof window !== "undefined" ? window.location.origin : "https://crosscartglobal.com";
  const rewardsText = `Use my CrossCart referral code ${myInfo?.referralCode || ""} and get exclusive shipping discounts! Sign up here: ${baseOrigin}/auth/signup?ref=${myInfo?.referralCode || ""}`;

  return (
    <RoleGuard allowedRoles={["admin", "moderator", "user"]}>
      <div className="space-y-6" data-testid="referrals-page">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Referral Program</h1>
          <p className="text-muted-foreground">
            {isStaff
              ? "Review and manage all referrals"
              : "Invite friends and earn shipping rewards"}
          </p>
        </div>

        {!isStaff && (
          <>
            <Card className="bg-primary text-white">
              <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-white/15 rounded-full p-4">
                    <Gift className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Your Referral Code</h3>
                    <p className="text-sm opacity-90">
                      Share it to earn rewards on every successful referral
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-white/15 rounded-lg px-5 py-3 text-2xl font-bold tracking-widest">
                    {loading ? "..." : myInfo?.referralCode || "—"}
                  </div>
                  <Button
                    variant="outline"
                    className="bg-transparent border-white text-white hover:bg-white hover:text-primary"
                    onClick={copyCode}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <Users className="h-6 w-6 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{myInfo?.referralCount ?? 0}</p>
                    <p className="text-sm text-muted-foreground">Total Referrals</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <Award className="h-6 w-6 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{myInfo?.pendingCount ?? 0}</p>
                    <p className="text-sm text-muted-foreground">Pending Reward</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <Gift className="h-6 w-6 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{myInfo?.rewards ?? 0}</p>
                    <p className="text-sm text-muted-foreground">Rewards Earned</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Share on WhatsApp</h3>
                <p className="text-sm text-muted-foreground mb-3">{rewardsText}</p>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(rewardsText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="bg-[#25D366] hover:bg-[#1fb959]">
                    Share via WhatsApp
                  </Button>
                </a>
              </CardContent>
            </Card>
          </>
        )}

        {isStaff && (
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <p className="text-muted-foreground">Loading referrals...</p>
              ) : list.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium">No referrals yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Referrals will appear here when users share their codes.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="py-3 pr-4">Referrer</th>
                        <th className="py-3 pr-4">Code</th>
                        <th className="py-3 pr-4">Referred User</th>
                        <th className="py-3 pr-4">Status</th>
                        <th className="py-3 pr-4">Reward</th>
                        <th className="py-3 pr-4">Date</th>
                        <th className="py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((r) => (
                        <tr key={r._id} className="border-b">
                          <td className="py-3 pr-4">
                            {r.referrer?.name}
                            <br />
                            <span className="text-xs text-muted-foreground">
                              {r.referrer?.phone}
                            </span>
                          </td>
                          <td className="py-3 pr-4 font-medium">{r.referralCode}</td>
                          <td className="py-3 pr-4">
                            {r.referredUser?.name || r.referredPhone || "—"}
                          </td>
                          <td className="py-3 pr-4">
                            <Badge
                              variant={
                                r.status === "rewarded" ? "default" : "secondary"
                              }
                            >
                              {r.status}
                            </Badge>
                          </td>
                          <td className="py-3 pr-4">
                            {r.rewardAmount > 0 ? r.rewardAmount : "—"}
                          </td>
                          <td className="py-3 pr-4">
                            {new Date(r.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3">
                            {r.status === "pending" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-primary text-primary hover:bg-primary hover:text-white"
                                onClick={() => markRewarded(r._id)}
                              >
                                <Gift className="h-4 w-4 mr-1" />
                                Mark Rewarded
                              </Button>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                {r.status === "rewarded" ? "Rewarded" : "—"}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </RoleGuard>
  );
}