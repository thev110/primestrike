"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Video, Loader2, Check, X, Clock, RefreshCw, Plus, EyeOff, Eye, Send, KeyRound, UploadCloud,
} from "lucide-react";

interface ReqRow {
  id: string;
  email: string;
  videoTitle: string;
  status: "pending" | "granted" | "denied";
  grantedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  live: boolean;
  requestCount: number;
  grantCount: number;
  viewCount: number;
}

interface CatalogRow {
  id: string;
  title: string;
  description: string | null;
  storage_path: string;
  active: boolean;
}

export default function AdminVideoRequests() {
  const [requests, setRequests] = useState<ReqRow[]>([]);
  const [catalog, setCatalog] = useState<CatalogRow[]>([]);
  const [unlinked, setUnlinked] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  // publish form
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPath, setNewPath] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const authHeader = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token || ""}` };
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const headers = await authHeader();
      const [rRes, vRes] = await Promise.all([
        fetch("/api/admin/video-requests", { headers }),
        fetch("/api/admin/videos", { headers }),
      ]);
      const rText = await rRes.text();
      const vText = await vRes.text();
      const rJson = rText ? JSON.parse(rText) : {};
      const vJson = vText ? JSON.parse(vText) : {};
      if (rRes.ok) setRequests(rJson.requests || []);
      else setError(rJson.error || "Failed to load requests.");
      if (vRes.ok) {
        setCatalog(vJson.catalog || []);
        setUnlinked(vJson.unlinkedFiles || []);
      }
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }, [authHeader]);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (requestId: string, decision: "grant" | "deny") => {
    try {
      setBusyId(requestId);
      const res = await fetch("/api/admin/video-requests/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeader()) },
        body: JSON.stringify({ requestId, decision }),
      });
      if (res.ok) await load();
      else {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "Action failed.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setBusyId(null);
    }
  };

  const publish = async () => {
    if (!newTitle) return;

    try {
      setPublishing(true);
      setError("");

      // Option 1: Direct file upload from computer via server route
      if (uploadFile) {
        setUploading(true);
        const fd = new FormData();
        fd.append("file", uploadFile);
        fd.append("title", newTitle);
        fd.append("description", newDesc);

        const res = await fetch("/api/admin/videos/upload", {
          method: "POST",
          headers: await authHeader(),
          body: fd,
        });

        if (res.ok) {
          setNewTitle("");
          setNewDesc("");
          setNewPath("");
          setUploadFile(null);
          await load();
        } else {
          const j = await res.json().catch(() => ({}));
          setError(j.error || "Server upload failed.");
        }
        return;
      }

      // Option 2: Existing bucket file selection
      if (!newPath) {
        setError("Please choose a video file or select a bucket file.");
        return;
      }

      const res = await fetch("/api/admin/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeader()) },
        body: JSON.stringify({ title: newTitle, description: newDesc, storagePath: newPath }),
      });

      if (res.ok) {
        setNewTitle("");
        setNewDesc("");
        setNewPath("");
        setUploadFile(null);
        await load();
      } else {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "Publish failed.");
      }
    } catch {
      setError("Network error publishing video.");
    } finally {
      setPublishing(false);
      setUploading(false);
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    try {
      setBusyId(id);
      const res = await fetch("/api/admin/videos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(await authHeader()) },
        body: JSON.stringify({ id, active }),
      });
      if (res.ok) await load();
    } finally {
      setBusyId(null);
    }
  };

  const fmt = (s: string | null) =>
    s ? new Date(s).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";

  const totalRequests = requests.reduce((acc, r) => acc + (r.requestCount || 1), 0);
  const totalGrants = requests.reduce((acc, r) => acc + (r.grantCount || 0), 0);
  const totalViews = requests.reduce((acc, r) => acc + (r.viewCount || 0), 0);
  const activeGrants = requests.filter((r) => r.live).length;

  return (
    <div className="space-y-6">
      {/* Metrics Header Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border border-white/10 bg-neutral-950/80 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50">Total Requests</span>
            <Send className="h-4 w-4 text-gold/70" />
          </div>
          <p className="text-2xl font-bold text-white mt-1">{totalRequests}</p>
        </Card>
        <Card className="border border-white/10 bg-neutral-950/80 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50">Active Access</span>
            <Clock className="h-4 w-4 text-emerald-400/70" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{activeGrants}</p>
        </Card>
        <Card className="border border-white/10 bg-neutral-950/80 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50">Total Grants</span>
            <KeyRound className="h-4 w-4 text-purple-400/70" />
          </div>
          <p className="text-2xl font-bold text-white mt-1">{totalGrants}</p>
        </Card>
        <Card className="border border-white/10 bg-neutral-950/80 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50">Total Video Views</span>
            <Eye className="h-4 w-4 text-blue-400/70" />
          </div>
          <p className="text-2xl font-bold text-white mt-1">{totalViews}</p>
        </Card>
      </div>

      {error && (
        <div className="p-3 rounded-lg text-xs bg-red-500/10 border border-red-500/20 text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Requests table */}
        <div className="lg:col-span-2">
          <Card className="border border-white/10 bg-neutral-950/80 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 py-4">
              <div>
                <CardTitle className="text-md font-bold flex items-center gap-2 text-white font-[family-name:var(--font-poppins)]">
                  <Video className="h-4.5 w-4.5 text-gold" /> Video Access Requests
                </CardTitle>
                <CardDescription className="text-white/50 text-xs">
                  Approve to give 48-hour in-app access. Nothing is downloadable.
                </CardDescription>
              </div>
              <Button
                onClick={load}
                variant="ghost"
                className="h-9 px-3 border border-white/10 text-white/70 hover:text-white rounded-lg shrink-0"
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </CardHeader>
            <CardContent className="pt-4">
              {loading ? (
                <div className="h-32 flex items-center justify-center text-white/40">
                  <Loader2 className="h-6 w-6 animate-spin text-gold" />
                </div>
              ) : requests.length === 0 ? (
                <p className="text-center py-8 text-sm text-white/40">No requests yet.</p>
              ) : (
                <div className="space-y-3">
                  {requests.map((r) => (
                    <div key={r.id} className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{r.email}</p>
                          <p className="text-[11px] text-white/50 mt-0.5">{r.videoTitle}</p>
                          <p className="text-[10px] text-white/30 mt-1">Requested {fmt(r.createdAt)}</p>
                          {r.status === "granted" && (
                            <p className="text-[10px] text-emerald-400/70 mt-0.5 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {r.live ? `Expires ${fmt(r.expiresAt)}` : `Expired ${fmt(r.expiresAt)}`}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-2">
                          <StatusBadge status={r.status} live={r.live} />
                          {r.status === "pending" && (
                            <div className="flex gap-1.5">
                              <Button
                                onClick={() => decide(r.id, "grant")}
                                disabled={busyId === r.id}
                                className="h-8 px-3 bg-emerald-500/90 hover:bg-emerald-500 text-black text-xs font-semibold rounded-lg flex items-center gap-1"
                              >
                                {busyId === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                Grant
                              </Button>
                              <Button
                                onClick={() => decide(r.id, "deny")}
                                disabled={busyId === r.id}
                                variant="outline"
                                className="h-8 px-3 border-white/10 text-white/70 hover:text-white text-xs rounded-lg flex items-center gap-1"
                              >
                                <X className="h-3.5 w-3.5" /> Deny
                              </Button>
                            </div>
                          )}
                          {(r.status === "granted" || r.status === "denied") && (
                            <Button
                              onClick={() => decide(r.id, r.status === "granted" ? "deny" : "grant")}
                              disabled={busyId === r.id}
                              variant="ghost"
                              className="h-7 px-2 text-[11px] text-white/50 hover:text-white"
                            >
                              {r.status === "granted" ? "Revoke" : "Grant now"}
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Row counters */}
                      <div className="flex items-center gap-4 text-[10px] text-white/40 pt-2 border-t border-white/5">
                        <span className="flex items-center gap-1" title="Times requested by student">
                          <Send className="h-3 w-3 text-gold/70" />
                          Requested: <strong className="text-white/80">{r.requestCount}</strong>
                        </span>
                        <span className="flex items-center gap-1" title="Times access granted">
                          <KeyRound className="h-3 w-3 text-emerald-400/70" />
                          Grants: <strong className="text-white/80">{r.grantCount}</strong>
                        </span>
                        <span className="flex items-center gap-1" title="Times watched">
                          <Eye className="h-3 w-3 text-blue-400/70" />
                          Views: <strong className="text-white/80">{r.viewCount}</strong>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Catalog management */}
        <div className="space-y-6">
          <Card className="border border-white/10 bg-neutral-950/80 backdrop-blur-md">
            <CardHeader className="border-b border-white/5 py-4">
              <CardTitle className="text-md font-bold flex items-center gap-2 text-white font-[family-name:var(--font-poppins)]">
                <Plus className="h-4.5 w-4.5 text-gold" /> Publish a Video
              </CardTitle>
              <CardDescription className="text-white/50 text-xs">
                Add a bucket file to the catalog so students can request it.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <Input
                placeholder="Title (shown to students)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="bg-white/5 border-white/10 text-white h-10 text-sm"
              />
              <Input
                placeholder="Short description (optional)"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="bg-white/5 border-white/10 text-white h-10 text-sm"
              />

              {/* Computer Device File Upload Option */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gold uppercase tracking-wider block">
                  Option 1: Upload Video from Computer
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="video/*"
                    id="device-video-file"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setUploadFile(f);
                      if (f && !newTitle) {
                        setNewTitle(f.name.replace(/\.[^/.]+$/, "").replace(/_/g, " "));
                      }
                    }}
                  />
                  <label
                    htmlFor="device-video-file"
                    className="w-full flex items-center justify-center gap-2 bg-white/5 border border-dashed border-white/20 hover:border-gold/50 text-white/80 hover:text-white rounded-lg h-11 px-3 text-xs cursor-pointer transition-all"
                  >
                    <UploadCloud className="h-4 w-4 text-gold shrink-0" />
                    <span className="truncate">
                      {uploadFile ? uploadFile.name : "Choose video file (.mp4, .mov)..."}
                    </span>
                  </label>
                </div>
              </div>

              {/* Select existing bucket file Option */}
              {unlinked.length > 0 && (
                <div className="space-y-1 pt-1">
                  <label className="text-[10px] font-semibold text-white/40 uppercase tracking-wider block">
                    Option 2: Or select existing bucket file
                  </label>
                  <select
                    value={newPath}
                    onChange={(e) => {
                      setNewPath(e.target.value);
                      setUploadFile(null);
                    }}
                    className="w-full bg-neutral-900 border border-white/10 rounded-lg text-white h-10 px-3 text-xs outline-none focus:border-gold/50"
                  >
                    <option value="">Select bucket file…</option>
                    {unlinked.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              )}

              <Button
                onClick={publish}
                disabled={publishing || uploading || !newTitle || (!uploadFile && !newPath)}
                className="w-full h-10 bg-gold text-gold-foreground hover:bg-gold/90 font-semibold text-sm rounded-lg flex items-center justify-center gap-1.5 mt-2"
              >
                {publishing || uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {uploading ? "Uploading file..." : "Publishing..."}
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Upload & Publish Video
                  </>
                )}
              </Button>
              {unlinked.length === 0 && !uploadFile && (
                <p className="text-[11px] text-white/40 text-center">
                  Select a video file from your computer above to publish.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border border-white/10 bg-neutral-950/80 backdrop-blur-md">
            <CardHeader className="border-b border-white/5 py-4">
              <CardTitle className="text-md font-bold text-white font-[family-name:var(--font-poppins)]">
                Catalog ({catalog.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 divide-y divide-white/5">
              {catalog.length === 0 ? (
                <p className="text-sm text-white/40 py-4">No videos published yet.</p>
              ) : (
                catalog.map((v) => (
                  <div key={v.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${v.active ? "text-white" : "text-white/40"}`}>
                        {v.title}
                      </p>
                      <p className="text-[10px] text-white/30 truncate">{v.storage_path}</p>
                    </div>
                    <button
                      onClick={() => toggleActive(v.id, !v.active)}
                      disabled={busyId === v.id}
                      title={v.active ? "Hide from students" : "Show to students"}
                      className="text-white/40 hover:text-white p-1.5 hover:bg-white/5 rounded transition-all shrink-0"
                    >
                      {v.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status, live }: { status: string; live: boolean }) {
  if (status === "pending")
    return <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">Pending</span>;
  if (status === "denied")
    return <span className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">Denied</span>;
  if (status === "granted" && live)
    return <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Active</span>;
  return <span className="text-[10px] text-neutral-400 bg-neutral-500/10 border border-neutral-500/20 px-2 py-0.5 rounded-full">Expired</span>;
}
