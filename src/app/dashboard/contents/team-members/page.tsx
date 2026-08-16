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
import { apiService } from "@/services/apiService";
import { TeamMemberService } from "@/services/dashboardService";
import { Edit, Eye, ImagePlus, Loader2, Plus, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Controller } from "react-hook-form";
import { CountryPhoneInput } from "@/components/ui/phone-input";
import { validatePhone } from "@/lib/phoneCountries";
import { toast } from "sonner";

interface TeamMemberFormData {
  name: string;
  position: string;
  image: string;
  bio: string;
  experience: string;
  location: string;
  keyAchievement: string;
  email: string;
  phone: string;
  order: number;
  isActive: boolean;
}

interface TeamMemberRow {
  _id: string;
  name: string;
  position: string;
  image?: string;
  bio?: string;
  experience?: string;
  location?: string;
  keyAchievement?: string;
  social?: { email?: string; phone?: string };
  isActive: boolean;
  order: number;
  createdAt: string;
}

export default function TeamMembersPage() {
  const [members, setMembers] = useState<TeamMemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<TeamMemberRow | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | "view">(
    "create"
  );
  const [uploading, setUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TeamMemberFormData>({
    defaultValues: {
      name: "",
      position: "",
      image: "",
      bio: "",
      experience: "",
      location: "",
      keyAchievement: "",
      email: "",
      phone: "",
      order: 0,
      isActive: true,
    },
  });

  const imageValue = watch("image");

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await TeamMemberService.getTeamMembers({
        includeInactive: true,
      });
      if (response.success) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setMembers((response.data as any[]) || []);
      } else {
        toast.error(response.message || "Failed to fetch team members");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    reset();
    setSelectedMember(null);
    setDialogMode("create");
    setIsDialogOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEdit = (member: any) => {
    setSelectedMember(member);
    setDialogMode("edit");
    setValue("name", member.name || "");
    setValue("position", member.position || "");
    setValue("image", member.image || "");
    setValue("bio", member.bio || "");
    setValue("experience", member.experience || "");
    setValue("location", member.location || "");
    setValue("keyAchievement", member.keyAchievement || "");
    setValue("email", member.social?.email || "");
    setValue("phone", member.social?.phone || "");
    setValue("order", typeof member.order === "number" ? member.order : 0);
    setValue("isActive", member.isActive !== false);
    setIsDialogOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleView = (member: any) => {
    setSelectedMember(member);
    setDialogMode("view");
    setIsDialogOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDelete = async (member: any) => {
    if (!confirm(`Are you sure you want to delete "${member.name}"?`)) {
      return;
    }

    try {
      const response = await TeamMemberService.deleteTeamMember(member._id);
      if (response.success) {
        toast.success("Team member deleted successfully");
        fetchMembers();
      } else {
        toast.error(response.message || "Failed to delete team member");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    }
  };

  const onSubmit = async (data: TeamMemberFormData) => {
    try {
      const payload = {
        ...data,
        social: { email: data.email, phone: data.phone },
      };

      let response;
      if (dialogMode === "edit" && selectedMember) {
        response = await TeamMemberService.updateTeamMember(
          selectedMember._id,
          payload
        );
      } else {
        response = await TeamMemberService.createTeamMember(payload);
      }

      if (response.success) {
        toast.success(
          `Team member ${dialogMode === "edit" ? "updated" : "created"} successfully`
        );
        setIsDialogOpen(false);
        fetchMembers();
      } else {
        toast.error(response.message || `Failed to ${dialogMode} team member`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    }
  };

  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Image is larger than 3MB");
      return;
    }

    setUploading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const res = await apiService.post("/uploads", {
        dataUrl,
        folder: "zypco/team",
      });
      const url = (res.data as { url?: string } | undefined)?.url;
      if (!res.success || !url) {
        toast.error(res.message || "Image upload failed");
        return;
      }
      setValue("image", url);
      toast.success("Image uploaded successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const getStatusBadge = (isActive: boolean) => (
    <Badge variant={isActive ? "default" : "secondary"}>
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );

  const columns = [
    {
      key: "image",
      label: "Photo",
      render: (value: string) =>
        value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt="member"
            className="w-12 h-12 rounded-full object-cover border"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-section flex items-center justify-center text-gray-400">
            <Users className="w-5 h-5" />
          </div>
        ),
    },
    {
      key: "name",
      label: "Name",
      sortable: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (value: string, row: any) => (
        <div>
          <p className="font-medium">{value}</p>
          <p className="text-sm text-gray-500">{row.position}</p>
        </div>
      ),
    },
    {
      key: "location",
      label: "Location",
      render: (value: string) => value || "-",
    },
    {
      key: "order",
      label: "Order",
      sortable: true,
      render: (value: number) => value ?? 0,
    },
    {
      key: "isActive",
      label: "Status",
      render: (value: boolean) => getStatusBadge(value),
    },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MemberDetails = ({ member }: { member: any }) => (
    <div className="space-y-4" data-testid="team-member-details">
      <div className="flex items-start gap-4">
        {member.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={member.image}
            alt={member.name}
            className="w-20 h-20 rounded-full object-cover border"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-section flex items-center justify-center text-gray-400">
            <Users className="w-8 h-8" />
          </div>
        )}
        <div>
          <h2 className="text-2xl font-bold">{member.name}</h2>
          <p className="text-primary font-semibold">{member.position}</p>
          {getStatusBadge(member.isActive !== false)}
        </div>
      </div>

      {member.bio && (
        <div>
          <Label className="text-sm font-medium text-gray-500">Bio</Label>
          <p className="mt-1 text-sm text-gray-700">{member.bio}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {member.experience && (
          <div>
            <Label className="text-sm font-medium text-gray-500">
              Experience
            </Label>
            <p className="mt-1 text-sm text-gray-700">{member.experience}</p>
          </div>
        )}
        {member.location && (
          <div>
            <Label className="text-sm font-medium text-gray-500">Location</Label>
            <p className="mt-1 text-sm text-gray-700">{member.location}</p>
          </div>
        )}
        {member.keyAchievement && (
          <div>
            <Label className="text-sm font-medium text-gray-500">
              Key Achievement
            </Label>
            <p className="mt-1 text-sm text-gray-700">{member.keyAchievement}</p>
          </div>
        )}
        <div>
          <Label className="text-sm font-medium text-gray-500">Order</Label>
          <p className="mt-1 text-sm text-gray-700">{member.order ?? 0}</p>
        </div>
      </div>

      {(member.social?.email || member.social?.phone) && (
        <div>
          <Label className="text-sm font-medium text-gray-500">Contact</Label>
          <div className="mt-1 space-y-1 text-sm text-gray-700">
            {member.social?.email && <p>Email: {member.social.email}</p>}
            {member.social?.phone && <p>Phone: {member.social.phone}</p>}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <RoleGuard allowedRoles={["admin", "moderator"]}>
      <div className="space-y-6" data-testid="team-members-page">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Team Members
            </h1>
            <p className="text-muted-foreground">
              Add, edit and manage team members shown on the website
            </p>
          </div>
          <Button onClick={handleCreate} data-testid="create-member-btn">
            <Plus className="h-4 w-4 mr-2" />
            Add Team Member
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{members.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold">
                    {members.filter((m) => m.isActive !== false).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Inactive</p>
                  <p className="text-2xl font-bold">
                    {members.filter((m) => m.isActive === false).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DataTable
          title="Team Members"
          data={members}
          columns={columns}
          searchKeys={["name", "position", "location"]}
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
                {dialogMode === "create" && "Add Team Member"}
                {dialogMode === "edit" && "Edit Team Member"}
                {dialogMode === "view" && "Team Member Details"}
              </DialogTitle>
            </DialogHeader>

            {dialogMode === "view" && selectedMember ? (
              <MemberDetails member={selectedMember} />
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    {...register("name", { required: "Name is required" })}
                    placeholder="Full name"
                    data-testid="member-name-input"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    {...register("position", {
                      required: "Position is required",
                    })}
                    placeholder="e.g. Marque Associate"
                    data-testid="member-position-input"
                  />
                  {errors.position && (
                    <p className="text-sm text-red-600">
                      {errors.position.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Photo</Label>
                  <div className="flex items-center gap-3">
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      data-testid="member-image-input"
                      onChange={(e) => handleImageUpload(e.target.files)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploading}
                      onClick={() => imageInputRef.current?.click()}
                      data-testid="member-image-upload-btn"
                    >
                      {uploading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <ImagePlus className="h-4 w-4 mr-2" />
                      )}
                      {uploading ? "Uploading..." : "Upload Photo"}
                    </Button>
                    {imageValue && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imageValue}
                        alt="preview"
                        className="w-14 h-14 rounded-full object-cover border"
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    {...register("bio")}
                    placeholder="Short bio"
                    rows={3}
                    data-testid="member-bio-input"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="experience">Experience</Label>
                    <Input
                      id="experience"
                      {...register("experience")}
                      placeholder="e.g. 2+ years in courier operations"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      {...register("location")}
                      placeholder="e.g. Chittagong"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keyAchievement">Key Achievement</Label>
                  <Input
                    id="keyAchievement"
                    {...register("keyAchievement")}
                    placeholder="e.g. Best Delivery Associate 2024"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register("email")}
                      placeholder="email@example.com"
                    />
                  </div>
                  <Controller
                    name="phone"
                    control={control}
                    rules={{
                      validate: (v) =>
                        !v || validatePhone(v).valid || "Enter a valid phone number",
                    }}
                    render={({ field }) => (
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <CountryPhoneInput
                          id="phone"
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          placeholder="1XXXXXXXXX"
                        />
                        {errors.phone && (
                          <p className="text-sm text-red-600">
                            {errors.phone.message as string}
                          </p>
                        )}
                      </div>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div className="space-y-2">
                    <Label htmlFor="isActive">Status</Label>
                    <select
                      {...register("isActive")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      data-testid="member-status-select"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    data-testid="member-form-cancel"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" data-testid="member-form-submit">
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
