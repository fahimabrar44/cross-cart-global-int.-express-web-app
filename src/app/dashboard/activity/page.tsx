"use client";

import { useEffect, useState, useCallback } from "react";
import { RoleGuard } from "@/middleware/roleGuard";
import { apiService } from "@/services/apiService";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TrackingEvent {
  _id: string;
  visitorId: string;
  userId?: string;
  type: string;
  path: string;
  title?: string;
  referrer?: string;
  userAgent?: string;
  payload?: Record<string, unknown>;
  createdAt?: string;
}

const TYPE_COLORS: Record<string, string> = {
  page_view: "default",
  page_leave: "secondary",
  event: "outline",
  lead: "destructive",
};

export default function ActivityPage() {
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [selected, setSelected] = useState<TrackingEvent | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params: Record<string, string> = {
        page: String(page),
        limit: "50",
      };
      if (type !== "all") params.type = type;
      if (search) params.path = search;
      const response = await apiService.get("/tracking/events", params);
      if (response.success) {
        setEvents((response.data as TrackingEvent[]) || []);
        if (response.meta) setMeta(response.meta as typeof meta);
      } else {
        setError(response.message || "Failed to fetch activity");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch activity");
    } finally {
      setLoading(false);
    }
  }, [page, type, search]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEvents();
  };

  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleString() : "—";

  return (
    <RoleGuard allowedRoles={["admin", "moderator"]}>
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">User Activity</h1>
            <p className="text-muted-foreground text-sm">
              Tracked visitor events (page views, interactions, leads).
            </p>
          </div>
          <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
            <Select value={type} onValueChange={(v) => { setType(v); setPage(1); }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="page_view">Page View</SelectItem>
                <SelectItem value="page_leave">Page Leave</SelectItem>
                <SelectItem value="event">Event</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Search path..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-56"
            />
            <Button type="submit">Search</Button>
          </form>
        </div>

        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Path</TableHead>
                  <TableHead>Visitor</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>When</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      No activity found.
                    </TableCell>
                  </TableRow>
                ) : (
                  events.map((ev) => (
                    <TableRow key={ev._id}>
                      <TableCell>
                        <Badge variant={(TYPE_COLORS[ev.type] as any) || "outline"}>
                          {ev.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{ev.path}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {ev.visitorId?.slice(0, 8) || "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {ev.userId ? ev.userId.slice(0, 8) : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(ev.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => setSelected(ev)}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {!loading && meta.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {meta.page} of {meta.totalPages} · {meta.total} total
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={meta.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={meta.page >= meta.totalPages}
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected?.type}</DialogTitle>
            <DialogDescription>Event details</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <DetailRow label="Path" value={selected.path} />
              <DetailRow label="Visitor ID" value={selected.visitorId} />
              <DetailRow label="User ID" value={selected.userId || "—"} />
              <DetailRow label="Title" value={selected.title || "—"} />
              <DetailRow label="Referrer" value={selected.referrer || "—"} />
              <DetailRow label="When" value={formatDate(selected.createdAt)} />
              <div className="rounded-md border p-3">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  Payload
                </span>
                <pre className="mt-1 overflow-auto whitespace-pre-wrap break-words text-xs">
                  {selected.payload ? JSON.stringify(selected.payload, null, 2) : "—"}
                </pre>
              </div>
              {selected.userAgent && (
                <div className="rounded-md border p-3">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    User Agent
                  </span>
                  <p className="mt-1 break-words text-xs">{selected.userAgent}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </RoleGuard>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-md border p-3">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="break-words font-medium">{value || "—"}</span>
    </div>
  );
}
