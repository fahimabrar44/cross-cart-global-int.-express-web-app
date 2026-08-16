"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/hooks/AuthContext";
import { UserService } from "@/services/dashboardService";
import { UserAddressManager } from "@/components/addresses/UserAddressManager";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface FullUser {
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  isVerified?: boolean;
  isActive?: boolean;
  referralCode?: string;
  lastLogin?: string;
  createdAt?: string;
  nid?: { verified?: boolean; front?: string; back?: string };
  preferences?: {
    notifications?: { email?: boolean; sms?: boolean; push?: boolean };
    privacy?: { profileVisibility?: string; dataSharing?: boolean };
  };
  profileCompletion?: {
    basicInfo?: boolean;
    contactVerified?: boolean;
    identityVerified?: boolean;
    percentage?: number;
  };
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b pb-2 gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState<FullUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "" });

  useEffect(() => {
    if (!user?.phone) return;
    const load = async () => {
      try {
        const res = await UserService.getUserByPhone(user.phone);
        if (res.status === 200 && res.data) {
          setProfile(res.data);
          setForm({ name: res.data.name || "", email: res.data.email || "" });
          return;
        }
      } catch {
        // fall through to auth context
      } finally {
        setLoading(false);
      }
      setProfile({
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
      });
      setForm({ name: user.name, email: user.email });
    };
    load();
  }, [user]);

  const handleSave = async () => {
    if (!user?.phone) return;
    setSaving(true);
    try {
      const res = await UserService.updateUser(user.phone, {
        name: form.name,
        email: form.email,
      });
      if (res.status === 200) {
        toast.success("Profile updated");
        updateUser({ name: form.name, email: form.email });
        setProfile((p) => ({ ...(p as FullUser), name: form.name, email: form.email }));
        setEditing(false);
      } else {
        toast.error(res.message || "Failed to update profile");
      }
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const display: FullUser = profile ?? {
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isVerified: user.isVerified,
    isActive: user.isActive,
    lastLogin: user.lastLogin,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">
          Your complete account information
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : editing ? (
              <>
                <div>
                  <Label>Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? "Saving…" : "Save"}
                  </Button>
                  <Button variant="outline" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Row label="Name" value={display.name} />
                <Row label="Email" value={display.email} />
                <Row label="Phone" value={display.phone} />
                <Row
                  label="Role"
                  value={<Badge className="capitalize">{display.role}</Badge>}
                />
                <Row
                  label="Verified"
                  value={
                    display.isVerified ? (
                      <Badge variant="default">Yes</Badge>
                    ) : (
                      <Badge variant="secondary">No</Badge>
                    )
                  }
                />
                <Row
                  label="Active"
                  value={
                    display.isActive ? (
                      <Badge variant="default">Yes</Badge>
                    ) : (
                      <Badge variant="destructive">No</Badge>
                    )
                  }
                />
                <Row label="Referral Code" value={display.referralCode || "—"} />
                <Row
                  label="Last Login"
                  value={
                    display.lastLogin
                      ? new Date(display.lastLogin).toLocaleString()
                      : "—"
                  }
                />
                <Row
                  label="Joined"
                  value={
                    display.createdAt
                      ? new Date(display.createdAt).toLocaleDateString()
                      : "—"
                  }
                />
                <Button onClick={() => setEditing(true)}>Edit Profile</Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Identity &amp; Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Row
              label="NID Verified"
              value={display.nid?.verified ? "Yes" : "No"}
            />
            <Row
              label="Profile Completion"
              value={
                display.profileCompletion?.percentage != null
                  ? `${display.profileCompletion.percentage}%`
                  : "—"
              }
            />
            <Row
              label="Email Notifications"
              value={display.preferences?.notifications?.email ? "On" : "Off"}
            />
            <Row
              label="SMS Notifications"
              value={display.preferences?.notifications?.sms ? "On" : "Off"}
            />
            <Row
              label="Push Notifications"
              value={display.preferences?.notifications?.push ? "On" : "Off"}
            />
            <Row
              label="Profile Visibility"
              value={display.preferences?.privacy?.profileVisibility || "—"}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Address Book</CardTitle>
        </CardHeader>
        <CardContent>
          <UserAddressManager />
        </CardContent>
      </Card>
    </div>
  );
}
