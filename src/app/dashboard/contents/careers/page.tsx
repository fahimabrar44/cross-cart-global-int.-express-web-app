"use client";
import { RoleGuard } from "@/middleware/roleGuard";
import { apiService } from "@/services/apiService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2, Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface JobRow {
  _id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description?: string;
  responsibilities?: string[];
  requirements?: string[];
  isActive: boolean;
  applicationEmail?: string;
  createdAt: string;
}

interface ApplicationRow {
  _id: string;
  jobTitle: string;
  name: string;
  email: string;
  phone: string;
  resumeUrl?: string;
  coverLetter?: string;
  coverLetterUrl?: string;
  status: string;
  job?: { title?: string; location?: string; type?: string } | null;
  createdAt: string;
}

const EMPTY_FORM = {
  title: "",
  department: "",
  location: "",
  type: "Full-time",
  description: "",
  responsibilities: "",
  requirements: "",
  isActive: true,
  applicationEmail: "",
};

const STATUS_OPTIONS = ["new", "reviewed", "rejected", "hired"];

function CareersPage() {
  const [tab, setTab] = useState<"positions" | "applications">("positions");
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const [viewApp, setViewApp] = useState<ApplicationRow | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  useEffect(() => {
    fetchJobs();
    fetchApplications();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await apiService.get<JobRow[]>("/jobs?all=true");
      if (res.success) setJobs(res.data || []);
      else toast.error(res.message || "Failed to fetch positions");
    } catch {
      toast.error("Failed to fetch positions");
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const res = await apiService.get<ApplicationRow[]>("/job-applications", {
        limit: 100,
      });
      if (res.success) setApplications(res.data || []);
      else toast.error(res.message || "Failed to fetch applications");
    } catch {
      toast.error("Failed to fetch applications");
    }
  };

  const openCreate = () => {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setDialogMode("create");
    setIsDialogOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openEdit = (job: any) => {
    setForm({
      title: job.title || "",
      department: job.department || "",
      location: job.location || "",
      type: job.type || "Full-time",
      description: job.description || "",
      responsibilities: (job.responsibilities || []).join("\n"),
      requirements: (job.requirements || []).join("\n"),
      isActive: job.isActive !== false,
      applicationEmail: job.applicationEmail || "",
    });
    setEditingId(job._id);
    setDialogMode("edit");
    setIsDialogOpen(true);
  };

  const saveJob = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        title: form.title.trim(),
        department: form.department.trim(),
        location: form.location.trim(),
        type: form.type,
        description: form.description,
        responsibilities: form.responsibilities
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        requirements: form.requirements
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        isActive: form.isActive,
        applicationEmail: form.applicationEmail.trim(),
      };

      const res = dialogMode === "edit" && editingId
        ? await apiService.put<JobRow>(`/jobs/${editingId}`, payload)
        : await apiService.post<JobRow>("/jobs", payload);

      if (res.success) {
        toast.success(
          dialogMode === "edit"
            ? "Position updated"
            : "Position created"
        );
        setIsDialogOpen(false);
        fetchJobs();
      } else {
        toast.error(res.message || "Failed to save position");
      }
    } catch {
      toast.error("Failed to save position");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (job: JobRow) => {
    try {
      const res = await apiService.put(`/jobs/${job._id}`, {
        isActive: !job.isActive,
      });
      if (res.success) {
        toast.success("Status updated");
        fetchJobs();
      } else {
        toast.error(res.message || "Failed to update");
      }
    } catch {
      toast.error("Failed to update");
    }
  };

  const deleteJob = async (id: string) => {
    if (!confirm("Delete this position?")) return;
    try {
      const res = await apiService.delete(`/jobs/${id}`);
      if (res.success) {
        toast.success("Position deleted");
        fetchJobs();
      } else {
        toast.error(res.message || "Failed to delete");
      }
    } catch {
      toast.error("Failed to delete");
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await apiService.put(`/job-applications/${id}`, { status });
      if (res.success) {
        toast.success("Application status updated");
        fetchApplications();
        if (viewApp) setViewApp({ ...viewApp, status });
      } else {
        toast.error(res.message || "Failed to update");
      }
    } catch {
      toast.error("Failed to update");
    }
  };

  const deleteApplication = async (id: string) => {
    if (!confirm("Delete this application?")) return;
    try {
      const res = await apiService.delete(`/job-applications/${id}`);
      if (res.success) {
        toast.success("Application deleted");
        fetchApplications();
        setIsViewOpen(false);
      } else {
        toast.error(res.message || "Failed to delete");
      }
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="w-full p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#12352A]">Career Management</h1>
          <p className="text-sm text-gray-500">
            Manage open positions and review job applications.
          </p>
        </div>
        {tab === "positions" && (
          <Button onClick={openCreate} className="bg-[#006B45] hover:bg-[#087F4F]">
            <Plus className="w-4 h-4 mr-2" /> Add Position
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {[
          { key: "positions", label: "Open Positions" },
          { key: "applications", label: "Applications" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as "positions" | "applications")}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? "border-[#006B45] text-[#006B45]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
            {t.key === "applications" && applications.length > 0 && (
              <span className="ml-2 bg-[#006B45] text-white text-xs rounded-full px-2 py-0.5">
                {applications.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : tab === "positions" ? (
        <div className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gradient-to-r from-[#12352A] to-[#1c4a36] text-white">
              <tr>
                <th className="px-5 py-4 text-left font-semibold">Title</th>
                <th className="px-5 py-4 text-left font-semibold">Department</th>
                <th className="px-5 py-4 text-left font-semibold">Location</th>
                <th className="px-5 py-4 text-left font-semibold">Type</th>
                <th className="px-5 py-4 text-left font-semibold">Status</th>
                <th className="px-5 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-400">
                    No positions yet.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr
                    key={job._id}
                    className="border-t border-gray-100 hover:bg-[#f3faf7]"
                  >
                    <td className="px-5 py-4 font-medium text-[#12352A]">
                      {job.title}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {job.department || "—"}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {job.location || "—"}
                    </td>
                    <td className="px-5 py-4">
                      <Badge className="bg-gray-100 text-gray-700 border-none">
                        {job.type}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => toggleActive(job)}
                        className={`text-xs font-semibold rounded-full px-3 py-1 border ${
                          job.isActive
                            ? "bg-[#EAF3EE] text-[#006B45] border-[#006B45]/30"
                            : "bg-gray-100 text-gray-500 border-gray-300"
                        }`}
                      >
                        {job.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(job)}
                        className="mr-2"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => deleteJob(job._id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gradient-to-r from-[#12352A] to-[#1c4a36] text-white">
              <tr>
                <th className="px-5 py-4 text-left font-semibold">Applicant</th>
                <th className="px-5 py-4 text-left font-semibold">Position</th>
                <th className="px-5 py-4 text-left font-semibold">Contact</th>
                <th className="px-5 py-4 text-left font-semibold">Status</th>
                <th className="px-5 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-gray-400">
                    No applications yet.
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr
                    key={app._id}
                    className="border-t border-gray-100 hover:bg-[#f3faf7]"
                  >
                    <td className="px-5 py-4 font-medium text-[#12352A]">
                      {app.name}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {app.jobTitle || app.job?.title || "—"}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      <div>{app.email}</div>
                      <div className="text-xs text-gray-400">{app.phone}</div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        className={`border-none ${
                          app.status === "new"
                            ? "bg-blue-100 text-blue-700"
                            : app.status === "reviewed"
                            ? "bg-amber-100 text-amber-700"
                            : app.status === "hired"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {app.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        className="mr-2"
                        onClick={() => {
                          setViewApp(app);
                          setIsViewOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" /> View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => deleteApplication(app._id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Position form dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "edit" ? "Edit Position" : "Add Position"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Logistics Operations Executive"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Department</Label>
                <Input
                  value={form.department}
                  onChange={(e) =>
                    setForm({ ...form, department: e.target.value })
                  }
                  placeholder="Operations"
                />
              </div>
              <div>
                <Label>Location</Label>
                <Input
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  placeholder="Dhaka, Bangladesh"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>
              <div>
                <Label>Application Email (optional)</Label>
                <Input
                  value={form.applicationEmail}
                  onChange={(e) =>
                    setForm({ ...form, applicationEmail: e.target.value })
                  }
                  placeholder="hr@crosscartglobal.com"
                />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Short description of the role"
              />
            </div>
            <div>
              <Label>Responsibilities (one per line)</Label>
              <Textarea
                rows={4}
                value={form.responsibilities}
                onChange={(e) =>
                  setForm({ ...form, responsibilities: e.target.value })
                }
                placeholder={"Plan routes\nCoordinate pickups"}
              />
            </div>
            <div>
              <Label>Requirements (one per line)</Label>
              <Textarea
                rows={4}
                value={form.requirements}
                onChange={(e) =>
                  setForm({ ...form, requirements: e.target.value })
                }
                placeholder={"2+ years experience\nFluent English"}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm({ ...form, isActive: e.target.checked })
                }
              />
              Active (visible on public career page)
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={saveJob}
                disabled={saving}
                className="bg-[#006B45] hover:bg-[#087F4F]"
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {dialogMode === "edit" ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Application detail dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>
          {viewApp && (
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500">Name: </span>
                <span className="font-medium text-[#12352A]">
                  {viewApp.name}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Position: </span>
                {viewApp.jobTitle || viewApp.job?.title || "—"}
              </div>
              <div>
                <span className="text-gray-500">Email: </span>
                {viewApp.email}
              </div>
              <div>
                <span className="text-gray-500">Phone: </span>
                {viewApp.phone}
              </div>
              {viewApp.resumeUrl && (
                <div>
                  <span className="text-gray-500">Resume: </span>
                  <a
                    href={viewApp.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#006B45] underline"
                  >
                    View CV
                  </a>
                </div>
              )}
              {viewApp.coverLetterUrl && (
                <div>
                  <span className="text-gray-500">Cover Letter: </span>
                  <a
                    href={viewApp.coverLetterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#006B45] underline"
                  >
                    View file
                  </a>
                </div>
              )}
              {!viewApp.coverLetterUrl && viewApp.coverLetter && (
                <div>
                  <span className="text-gray-500">Cover Letter: </span>
                  <p className="mt-1 p-3 bg-gray-50 rounded-lg whitespace-pre-wrap">
                    {viewApp.coverLetter}
                  </p>
                </div>
              )}
              <div className="pt-2">
                <Label>Update Status</Label>
                <select
                  value={viewApp.status}
                  onChange={(e) => updateStatus(viewApp._id, e.target.value)}
                  className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CareersPageWrapped() {
  return (
    <RoleGuard allowedRoles={["admin", "moderator"]}>
      <CareersPage />
    </RoleGuard>
  );
}
