"use client";
import { Briefcase, Clock, GraduationCap, HeartHandshake, MapPin, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { apiService } from "@/services/apiService";
import { trackClarityEvent, setClarityTag } from "@/lib/clarity";
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

interface JobPublic {
  _id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description?: string;
  responsibilities?: string[];
  requirements?: string[];
  isActive: boolean;
}

const perks = [
  {
    icon: <Sparkles className="w-6 h-6 text-primary" strokeWidth={1.5} />,
    title: "Growth & Learning",
    description:
      "Continuous upskilling programs and clear promotion paths across every role.",
  },
  {
    icon: <HeartHandshake className="w-6 h-6 text-primary" strokeWidth={1.5} />,
    title: "Supportive Culture",
    description:
      "A collaborative team that celebrates wins together and cares about wellbeing.",
  },
  {
    icon: <Clock className="w-6 h-6 text-primary" strokeWidth={1.5} />,
    title: "Flexible Work",
    description:
      "Remote-friendly roles and flexible schedules to help you balance life.",
  },
  {
    icon: <GraduationCap className="w-6 h-6 text-primary" strokeWidth={1.5} />,
    title: "Training & Certifications",
    description:
      "Industry certifications and leadership training to advance your expertise.",
  },
];

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

export default function CareerContent() {
  const [jobs, setJobs] = useState<JobPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [applyJob, setApplyJob] = useState<JobPublic | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    resume: null as File | null,
    coverLetterFile: null as File | null,
  });

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await apiService.get<JobPublic[]>("/jobs");
        if (res.success) setJobs(res.data || []);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const openApply = (job: JobPublic) => {
    setApplyJob(job);
    setForm({ name: "", email: "", phone: "", resume: null, coverLetterFile: null });
    setIsApplyOpen(true);
    trackClarityEvent("apply_opened");
    setClarityTag("apply_job", job.title);
  };

  const submitApplication = async () => {
    if (!applyJob) return;
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      toast.error("Name, email and phone are required");
      return;
    }
    try {
      setSubmitting(true);
      let resume: string | undefined;
      let coverLetterFile: string | undefined;
      try {
        if (form.resume) resume = await fileToDataUrl(form.resume);
        if (form.coverLetterFile)
          coverLetterFile = await fileToDataUrl(form.coverLetterFile);
      } catch {
        toast.error("Could not read the selected file.");
        setSubmitting(false);
        return;
      }
      const res = await apiService.post(`/jobs/${applyJob._id}/apply`, {
        name: form.name,
        email: form.email,
        phone: form.phone,
        resume,
        coverLetterFile,
      });
      if (res.success) {
        toast.success("Application submitted successfully!");
        trackClarityEvent("application_submitted");
        setClarityTag("apply_job", applyJob.title);
        setIsApplyOpen(false);
      } else {
        toast.error(res.message || "Failed to submit application");
      }
    } catch {
      toast.error("Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full h-auto bg-soft-green overflow-x-hidden">
      {/* Intro */}
      <div className="w-full bg-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#12352A] mb-6">
              Build Your Future With Us
            </h2>
            <p className="text-lg text-gray-600">
              Join Cross Cart Global International Express and help us connect
              people, parcels and possibilities across the globe. We are always
              looking for passionate individuals who want to make shipping
              simple.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
            {perks.map((perk, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-6 border border-border shadow-card hover:shadow-lg transition-shadow"
              >
                <div className="bg-soft-green rounded-full w-14 h-14 flex items-center justify-center mb-4">
                  {perk.icon}
                </div>
                <h3 className="text-lg font-semibold text-[#12352A] mb-2">
                  {perk.title}
                </h3>
                <p className="text-sm text-gray-600">{perk.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Open Positions */}
      <div className="w-full bg-section">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#12352A] mb-4">
              Open Positions
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Explore current openings. Dont see the right role? Reach out — we
              are always open to great talent.
            </p>
          </div>

          {loading ? (
            <p className="text-center text-gray-400">Loading positions…</p>
          ) : jobs.length === 0 ? (
            <p className="text-center text-gray-400">
              No open positions right now. Please check back soon.
            </p>
          ) : (
            <div className="max-w-4xl mx-auto space-y-4">
              {jobs.map((role) => (
                <div
                  key={role._id || role.title}
                  className="bg-white rounded-lg p-6 border border-border shadow-card"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-[#12352A]">
                        {role.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4 text-primary" />
                          {role.type}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-primary" />
                          {role.location}
                        </span>
                        {role.department && (
                          <Badge className="bg-[#EAF3EE] text-[#006B45] border-none">
                            {role.department}
                          </Badge>
                        )}
                      </div>
                      {role.description && (
                        <p className="mt-3 text-sm text-gray-600 max-w-2xl">
                          {role.description}
                        </p>
                      )}
                      {role.requirements && role.requirements.length > 0 && (
                        <ul className="mt-3 list-disc list-inside text-sm text-gray-600 space-y-0.5">
                          {role.requirements.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <Button
                      onClick={() => openApply(role)}
                      className="bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-[#087F4F] transition-colors font-semibold text-center whitespace-nowrap"
                    >
                      Apply Now
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="w-full bg-[#12352A]">
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Join the Team?
          </h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Send your CV and cover letter to our HR team. We would love to hear
            from you.
          </p>
          <a
            href="/contact"
            className="inline-block bg-primary text-white py-3 px-8 rounded-lg hover:bg-[#087F4F] transition-colors font-bold"
          >
            Contact Us
          </a>
        </div>
      </div>

      {/* Apply Dialog */}
      <Dialog open={isApplyOpen} onOpenChange={setIsApplyOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Apply: {applyJob?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your name"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+8801..."
              />
            </div>
            <div>
              <Label>Resume / CV (PDF, DOC, DOCX)</Label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx,image/png,image/jpeg"
                onChange={(e) =>
                  setForm({ ...form, resume: e.target.files?.[0] ?? null })
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Maximum 6MB. Uploaded securely to our storage.
              </p>
            </div>
            <div>
              <Label>Cover Letter (optional, PDF/DOC)</Label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) =>
                  setForm({
                    ...form,
                    coverLetterFile: e.target.files?.[0] ?? null,
                  })
                }
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsApplyOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={submitApplication}
                disabled={submitting}
                className="bg-[#006B45] hover:bg-[#087F4F]"
              >
                {submitting ? "Submitting…" : "Submit Application"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
