"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/AuthContext";
import { RoleGuard } from "@/middleware/roleGuard";
import { UserService } from "@/services/dashboardService";
import { UserAddressManager } from "@/components/addresses/UserAddressManager";
import {
  BadgeCheck,
  Bell,
  Camera,
  Loader2,
  MapPin,
  Save,
  Settings,
  Shield,
  UploadCloud,
  User,
} from "lucide-react";
import { useEffect, useState, ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface ProfileFormData {
  name: string;
  email: string;
  phone: string;
}

interface NotificationSettings {
  email: boolean;
  sms: boolean;
  push: boolean;
}

interface PrivacySettings {
  profileVisibility: "public" | "private";
  dataSharing: boolean;
}

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>({
      email: true,
      sms: true,
      push: true,
    });
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    profileVisibility: "public",
    dataSharing: false,
  });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingNidSide, setUploadingNidSide] = useState<
    "front" | "back" | null
  >(null);

  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

  const handleFileUpload = async (
    type: "avatar" | "nid-front" | "nid-back",
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !user?.phone) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be 5MB or smaller");
      return;
    }

    if (type === "avatar") {
      setUploadingAvatar(true);
    } else {
      setUploadingNidSide(type === "nid-front" ? "front" : "back");
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      const response = await UserService.uploadFile(user.phone, type, dataUrl);

      if (response.status == 200) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const url = (response.data as any)?.url;
        if (type === "avatar") {
          updateUser({ avatar: url });
          toast.success("Profile photo uploaded");
        } else {
          const side = type === "nid-front" ? "front" : "back";
          const nid = { ...(user.nid || {}), [side]: url, verified: false };
          updateUser({ nid });
          toast.success(
            "NID document uploaded. It is now pending admin verification."
          );
        }
      } else {
        toast.error(response.message || "Upload failed");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploadingAvatar(false);
      setUploadingNidSide(null);
    }
  };

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    },
  });

  useEffect(() => {
    if (user) {
      setValue("name", user.name);
      setValue("email", user.email);
      setValue("phone", user.phone);
    }
  }, [user, setValue]);

  const onSubmitProfile = async (data: ProfileFormData) => {
    try {
      setLoading(true);

      if (!user?.phone) {
        toast.error("User phone not available");
        return;
      }

      const response = await UserService.updateUser(user.phone, data);

      if (response.status == 200) {
        updateUser(data);
        toast.success("Profile updated successfully");
      } else {
        toast.error(response.message || "Failed to update profile");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationUpdate = async (
    key: keyof NotificationSettings,
    value: boolean
  ) => {
    try {
      const updatedSettings = { ...notificationSettings, [key]: value };
      setNotificationSettings(updatedSettings);

      // Update user preferences
      if (user?.phone) {
        const response = await UserService.updateUser(user.phone, {
          preferences: {
            notifications: updatedSettings,
            privacy: privacySettings,
          },
        });

        if (response.status == 200) {
          toast.success("Notification settings updated");
        } else {
          // Revert on failure
          setNotificationSettings(notificationSettings);
          toast.error("Failed to update settings");
        }
      }
    } catch {
      setNotificationSettings(notificationSettings);
      toast.error("An error occurred");
    }
  };

  const handlePrivacyUpdate = async (
    key: keyof PrivacySettings,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any
  ) => {
    try {
      const updatedSettings = { ...privacySettings, [key]: value };
      setPrivacySettings(updatedSettings);

      if (user?.phone) {
        const response = await UserService.updateUser(user.phone, {
          preferences: {
            notifications: notificationSettings,
            privacy: updatedSettings,
          },
        });

        if (response.status == 200) {
          toast.success("Privacy settings updated");
        } else {
          setPrivacySettings(privacySettings);
          toast.error("Failed to update settings");
        }
      }
    } catch {
      setPrivacySettings(privacySettings);
      toast.error("An error occurred");
    }
  };

  return (
    <RoleGuard allowedRoles={["admin", "moderator", "user"]}>
      <div className="space-y-6" data-testid="settings-page">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-6">
            <TabsTrigger
              value="profile"
              className="flex items-center space-x-2"
            >
              <User className="h-4 w-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex items-center space-x-2"
            >
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
            </TabsTrigger>
            <TabsTrigger
              value="privacy"
              className="flex items-center space-x-2"
            >
              <Shield className="h-4 w-4" />
              <span>Privacy</span>
            </TabsTrigger>
            <TabsTrigger
              value="addresses"
              className="flex items-center space-x-2"
            >
              <MapPin className="h-4 w-4" />
              <span>Addresses</span>
            </TabsTrigger>
            <TabsTrigger
              value="advanced"
              className="flex items-center space-x-2"
            >
              <Settings className="h-4 w-4" />
              <span>Advanced</span>
            </TabsTrigger>
            <TabsTrigger
              value="verification"
              className="flex items-center space-x-2"
            >
              <BadgeCheck className="h-4 w-4" />
              <span>Verification</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card data-testid="profile-settings">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Profile Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleSubmit(onSubmitProfile)}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        {...register("name", { required: "Name is required" })}
                        data-testid="profile-name-input"
                      />
                      {errors.name && (
                        <p className="text-sm text-red-600">
                          {errors.name.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        {...register("email", {
                          required: "Email is required",
                        })}
                        data-testid="profile-email-input"
                      />
                      {errors.email && (
                        <p className="text-sm text-red-600">
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        {...register("phone")}
                        disabled
                        data-testid="profile-phone-input"
                      />
                      <p className="text-xs text-gray-500">
                        Phone number cannot be changed
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Account Status</Label>
                      <div className="flex space-x-2">
                        <Badge
                          variant={user?.isActive ? "default" : "destructive"}
                        >
                          {user?.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Badge
                          variant={user?.isVerified ? "default" : "secondary"}
                        >
                          {user?.isVerified ? "Verified" : "Unverified"}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {user?.role}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={loading}
                      data-testid="save-profile-btn"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card data-testid="notification-settings">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Notification Preferences</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notifications">
                        Email Notifications
                      </Label>
                      <p className="text-sm text-gray-500">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={notificationSettings.email}
                      onCheckedChange={(checked) =>
                        handleNotificationUpdate("email", checked)
                      }
                      data-testid="email-notifications-switch"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sms-notifications">
                        SMS Notifications
                      </Label>
                      <p className="text-sm text-gray-500">
                        Receive notifications via SMS
                      </p>
                    </div>
                    <Switch
                      id="sms-notifications"
                      checked={notificationSettings.sms}
                      onCheckedChange={(checked) =>
                        handleNotificationUpdate("sms", checked)
                      }
                      data-testid="sms-notifications-switch"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="push-notifications">
                        Push Notifications
                      </Label>
                      <p className="text-sm text-gray-500">
                        Receive push notifications in the app
                      </p>
                    </div>
                    <Switch
                      id="push-notifications"
                      checked={notificationSettings.push}
                      onCheckedChange={(checked) =>
                        handleNotificationUpdate("push", checked)
                      }
                      data-testid="push-notifications-switch"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6">
            <Card data-testid="privacy-settings">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Privacy Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="profile-visibility">
                        Profile Visibility
                      </Label>
                      <p className="text-sm text-gray-500">
                        Control who can see your profile
                      </p>
                    </div>
                    <select
                      id="profile-visibility"
                      value={privacySettings.profileVisibility}
                      onChange={(e) =>
                        handlePrivacyUpdate("profileVisibility", e.target.value)
                      }
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      data-testid="profile-visibility-select"
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="data-sharing">Data Sharing</Label>
                      <p className="text-sm text-gray-500">
                        Allow sharing of anonymized data for analytics
                      </p>
                    </div>
                    <Switch
                      id="data-sharing"
                      checked={privacySettings.dataSharing}
                      onCheckedChange={(checked) =>
                        handlePrivacyUpdate("dataSharing", checked)
                      }
                      data-testid="data-sharing-switch"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="addresses" className="space-y-6">
            <UserAddressManager />
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <Card data-testid="advanced-settings">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Advanced Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label>Account Information</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div>
                        <Label className="text-sm text-gray-500">User ID</Label>
                        <p className="font-mono text-sm">{user?.id}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-500">
                          Last Login
                        </Label>
                        <p className="text-sm">
                          {user?.lastLogin
                            ? new Date(user.lastLogin).toLocaleString()
                            : "Never"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {user?.role === "admin" && (
                    <div>
                      <Label>Admin Tools</Label>
                      <p className="text-sm text-gray-500 mb-2">
                        Additional administrative functions and system settings
                      </p>
                      <Button variant="outline" className="mr-2">
                        System Configuration
                      </Button>
                      <Button variant="outline">User Management</Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="verification" className="space-y-6">
            <Card data-testid="verification-settings">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BadgeCheck className="h-5 w-5" />
                  <span>Account Verification</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={user?.avatar} alt={user?.name} />
                      <AvatarFallback>
                        {user?.name?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">Identity Verification</p>
                      <p className="text-sm text-muted-foreground">
                        Upload your NID documents to get your account verified.
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      user?.nid?.verified ? "default" : "secondary"
                    }
                    data-testid="identity-status-badge"
                  >
                    {user?.nid?.verified
                      ? "Verified"
                      : user?.nid?.front || user?.nid?.back
                      ? "Pending Review"
                      : "Not Submitted"}
                  </Badge>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Profile Photo</Label>
                    <div className="border rounded-lg p-4 flex flex-col items-center gap-3">
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt="Profile"
                          className="h-24 w-24 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center">
                          <Camera className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <label
                        className="cursor-pointer inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
                        htmlFor="avatar-upload"
                      >
                        {uploadingAvatar ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <UploadCloud className="h-4 w-4 mr-2" />
                        )}
                        {uploadingAvatar ? "Uploading..." : "Upload Photo"}
                      </label>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload("avatar", e)}
                      />
                      <p className="text-xs text-muted-foreground">
                        JPG or PNG, max 5MB
                      </p>
                    </div>
                  </div>

                  {(["front", "back"] as const).map((side) => {
                    const uploading =
                      uploadingNidSide === side;
                    const currentUrl = user?.nid?.[side];
                    return (
                      <div key={side} className="space-y-2">
                        <Label className="capitalize">NID {side}</Label>
                        <div className="border rounded-lg p-4 flex flex-col items-center gap-3">
                          {currentUrl ? (
                            <img
                              src={currentUrl}
                              alt={`NID ${side}`}
                              className="h-24 w-24 object-cover rounded-md"
                            />
                          ) : (
                            <div className="h-24 w-24 bg-muted flex items-center justify-center">
                              <BadgeCheck className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                          <label
                            className="cursor-pointer inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
                            htmlFor={`nid-${side}-upload`}
                          >
                            {uploading ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <UploadCloud className="h-4 w-4 mr-2" />
                            )}
                            {uploading
                              ? "Uploading..."
                              : currentUrl
                              ? "Replace"
                              : "Upload"}
                          </label>
                          <input
                            id={`nid-${side}-upload`}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              handleFileUpload(
                                side === "front" ? "nid-front" : "nid-back",
                                e
                              )
                            }
                          />
                          <p className="text-xs text-muted-foreground">
                            JPG or PNG, max 5MB
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RoleGuard>
  );
}
