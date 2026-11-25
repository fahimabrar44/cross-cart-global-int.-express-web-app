"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { CreateUserData, UpdateUserData, User } from "@/types";
import { CountryPhoneInput } from "@/components/ui/phone-input";
import { validatePhone } from "@/lib/phoneCountries";
import { Eye, EyeOff } from "lucide-react";

const userFormSchema = z.object({
  name: z.string().min(1, "Name is required").min(2, "Name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required").refine((v) => validatePhone(v).valid, "Enter a valid phone number"),
  
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  role: z.enum(["admin", "moderator", "user"], {
    message: "Please select a role",
  }),
  password: z.string().optional(),
  isActive: z.boolean().default(true),
  isVerified: z.boolean().default(false),
  avatar: z.string().optional(),
  preferences: z.object({
    notifications: z.object({
      email: z.boolean().default(true),
      sms: z.boolean().default(true),
      push: z.boolean().default(true),
    }),
    privacy: z.object({
      profileVisibility: z.enum(["public", "private"]).default("public"),
      dataSharing: z.boolean().default(false),
    }),
  }),
  nid: z.object({
    front: z.string().optional(),
    back: z.string().optional(),
    verified: z.boolean().default(false),
  }),
  referralCode: z.string().optional(),
  referredBy: z.string().optional(),
  referralRewards: z.coerce.number().default(0),
  loginAttempts: z.coerce.number().default(0),
  lockUntil: z.string().optional(),
  profileCompletionPercentage: z.coerce.number().min(0).max(100).default(0),
});

// For create mode, password is required
const createUserSchema = userFormSchema.extend({
  password: z.string().min(1, "Password is required").min(8, "Password must be at least 8 characters"),
});

// For edit mode, password is optional
const editUserSchema = userFormSchema.extend({
  password: z.string().optional().refine((val) => {
    if (val && val.length > 0) {
      return val.length >= 8;
    }
    return true;
  }, "Password must be at least 8 characters if provided"),
});

interface UserFormProps {
  user?: User;
  onSubmit: (data: CreateUserData | UpdateUserData) => void;
  onCancel: () => void;
  loading?: boolean;
  currentUserRole: "admin" | "moderator" | "user";
}

export function UserForm({ 
  user, 
  onSubmit, 
  onCancel, 
  loading = false,
  currentUserRole 
}: UserFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isEdit = !!user;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<any>({
    resolver: zodResolver(isEdit ? editUserSchema : createUserSchema),
    defaultValues: user ? {
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      password: "",
      isActive: user.isActive,
      isVerified: user.isVerified,
      avatar: user.avatar || "",
      preferences: {
        notifications: {
          email: user.preferences?.notifications?.email ?? true,
          sms: user.preferences?.notifications?.sms ?? true,
          push: user.preferences?.notifications?.push ?? true,
        },
        privacy: {
          profileVisibility: user.preferences?.privacy?.profileVisibility ?? "public",
          dataSharing: user.preferences?.privacy?.dataSharing ?? false,
        },
      },
      nid: {
        front: user.nid?.front || "",
        back: user.nid?.back || "",
        verified: user.nid?.verified ?? false,
      },
      referralCode: user.referralCode || "",
      referredBy: user.referredBy || "",
      referralRewards: user.referralRewards ?? 0,
      loginAttempts: user.loginAttempts ?? 0,
      lockUntil: user.lockUntil ? new Date(user.lockUntil).toISOString().slice(0, 16) : "",
      profileCompletionPercentage: user.profileCompletion?.percentage ?? 0,
    } : {
      name: "",
      email: "",
      phone: "",
      role: "user",
      password: "",
      isActive: true,
      isVerified: false,
      avatar: "",
      preferences: {
        notifications: { email: true, sms: true, push: true },
        privacy: { profileVisibility: "public", dataSharing: false },
      },
      nid: { front: "", back: "", verified: false },
      referralCode: "",
      referredBy: "",
      referralRewards: 0,
      loginAttempts: 0,
      lockUntil: "",
      profileCompletionPercentage: 0,
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = (data: any) => {
    const submitData: Record<string, unknown> = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      isActive: data.isActive,
      isVerified: data.isVerified,
      avatar: data.avatar?.trim() ? data.avatar.trim() : null,
      preferences: data.preferences,
      nid: {
        front: data.nid?.front?.trim() ? data.nid.front.trim() : null,
        back: data.nid?.back?.trim() ? data.nid.back.trim() : null,
        verified: data.nid?.verified ?? false,
      },
      referralCode: data.referralCode?.trim() ? data.referralCode.trim() : null,
      referredBy: data.referredBy?.trim() ? data.referredBy.trim() : null,
      referralRewards: data.referralRewards,
      loginAttempts: data.loginAttempts,
      lockUntil: data.lockUntil ? new Date(data.lockUntil).toISOString() : null,
      profileCompletion: {
        percentage: data.profileCompletionPercentage,
      },
    };

    if (data.password && data.password.trim()) {
      submitData.password = data.password;
    } else {
      delete submitData.password;
    }

    onSubmit(submitData as CreateUserData | UpdateUserData);
  };

  // Role options based on current user's role
  const getRoleOptions = () => {
    const options = [
      { value: "user", label: "User", description: "Basic user with limited permissions" },
    ];

    if (currentUserRole === "admin" || currentUserRole === "moderator") {
      options.push({
        value: "moderator",
        label: "Moderator",
        description: "Moderate content and manage users",
      });
    }

    if (currentUserRole === "admin") {
      options.push({
        value: "admin",
        label: "Administrator",
        description: "Full system access and permissions",
      });
    }

    return options;
  };

  const roleOptions = getRoleOptions();

  return (
    <Form {...form}>
      <form 
      
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card data-testid="user-form-card">
          <CardHeader>
            <CardTitle>{isEdit ? "Edit User" : "Create New User"}</CardTitle>
            <CardDescription>
              {isEdit 
                ? "Update user information and settings" 
                : "Fill in the details to create a new user account"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter full name" 
                        {...field} 
                        data-testid="user-name-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input 
                        type="email"
                        placeholder="Enter email address" 
                        {...field} 
                        data-testid="user-email-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <CountryPhoneInput
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        placeholder="1XXXXXXXXX"
                        dataTestId="user-phone-input"
                      />
                    </FormControl>
                    <FormDescription>
                      Phone number is used as the unique identifier
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User Role</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      data-testid="user-role-select"
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select user role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roleOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex flex-col">
                              <span className="font-medium">{option.label}</span>
                              <span className="text-xs text-muted-foreground">
                                {option.description}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Password Field */}
            <FormField
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Password {isEdit && "(Leave blank to keep current password)"}
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"}
                        placeholder={isEdit ? "Enter new password (optional)" : "Enter password"} 
                        {...field} 
                        data-testid="user-password-input"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        data-testid="toggle-password-visibility"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        <span className="sr-only">
                          {showPassword ? "Hide password" : "Show password"}
                        </span>
                      </Button>
                    </div>
                  </FormControl>
                  <FormDescription>
                    {!isEdit && "Password must be at least 8 characters long"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Avatar & Preferences */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-medium">Profile & Preferences</h3>
              <FormField
                control={form.control}
                name="avatar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avatar URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} data-testid="user-avatar-input" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="preferences.notifications.email"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <FormLabel className="text-sm">Email notifications</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="user-notif-email-switch" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="preferences.notifications.sms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <FormLabel className="text-sm">SMS notifications</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="user-notif-sms-switch" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="preferences.notifications.push"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <FormLabel className="text-sm">Push notifications</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="user-notif-push-switch" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="preferences.privacy.dataSharing"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <FormLabel className="text-sm">Data sharing</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="user-data-sharing-switch" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="preferences.privacy.profileVisibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile visibility</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="user-profile-visibility-select">
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* NID Documents */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-medium">Identity (NID)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nid.front"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NID Front URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} data-testid="user-nid-front-input" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nid.back"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NID Back URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} data-testid="user-nid-back-input" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="nid.verified"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">NID Verified</FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="user-nid-verified-switch" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Admin-only fields */}
            {(currentUserRole === "admin") && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-medium">Admin Controls</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="referralCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Referral Code</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="user-referral-code-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="referredBy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Referred By</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="user-referred-by-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="referralRewards"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Referral Rewards</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} data-testid="user-referral-rewards-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="loginAttempts"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Login Attempts</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} data-testid="user-login-attempts-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lockUntil"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lock Until</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} data-testid="user-lock-until-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="profileCompletionPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profile Completion %</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} max={100} {...field} data-testid="user-profile-completion-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Status Switches - Only for Admin/Moderator */}
            {(currentUserRole === "admin" || currentUserRole === "moderator") && (
              <div className="space-y-4">
                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium mb-4">Account Status</h3>
                  
                  <div className="space-y-4">
                    <FormField
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Active Account</FormLabel>
                            <FormDescription>
                              Allow user to login and access the system
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="user-active-switch"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                      control={form.control}
                      name="isVerified"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Verified Account</FormLabel>
                            <FormDescription>
                              Mark account as verified (bypasses email verification)
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="user-verified-switch"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex flex-wrap justify-end gap-3" data-testid="user-form-actions">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            data-testid="cancel-user-btn"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            data-testid="submit-user-btn"
          >
            {loading ? "Saving..." : isEdit ? "Update User" : "Create User"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
