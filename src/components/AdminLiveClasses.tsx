"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Loader2,
  Check,
  AlertCircle,
  Video,
  Users,
  Eye,
  X,
  ExternalLink,
  ShieldCheck,
  MonitorPlay,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SessionItem {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  duration_minutes: number;
  zoom_meeting_id: string | null;
  zoom_start_url: string | null;
  zoom_join_url: string | null;
  batch: string | null;
  created_at: string;
  registeredCount: number;
}

interface RegistrantRow {
  id: string;
  email: string;
  name: string | null;
  status: string;
  join_url: string | null;
  created_at: string;
}

const IST_FMT = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

export default function AdminLiveClasses() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [zoomConfigured, setZoomConfigured] = useState(true);
  const [loading, setLoading] = useState(true);

  // Create form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("19:00");
  const [duration, setDuration] = useState("120");
  const [batch, setBatch] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formResult, setFormResult] = useState<string | null>(null);
  const [formResultIsError, setFormResultIsError] = useState(false);

  // Register-all state
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [registerResult, setRegisterResult] = useState<string | null>(null);
  const [registerResultIsError, setRegisterResultIsError] = useState(false);

  // Registrants drawer state
  const [openRegistrantsId, setOpenRegistrantsId] = useState<string | null>(null);
  const [registrants, setRegistrants] = useState<RegistrantRow[]>([]);
  const [registrantsLoading, setRegistrantsLoading] = useState(false);

  const authHeader = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token || ""}` };
  }, []);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/class-sessions", {
        cache: "no-store",
        headers: await authHeader(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load sessions");
      setSessions(data.sessions || []);
      setZoomConfigured(data.zoomConfigured !== false);
    } catch (err) {
      console.error("Fetch sessions error:", err);
    } finally {
      setLoading(false);
    }
  }, [authHeader]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormResult(null);
    setFormResultIsError(false);
    if (!title || !date || !time) {
      setFormError("Title, date and time are required.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/class-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeader()) },
        body: JSON.stringify({ title, description, date, time, duration: Number(duration), batch: batch || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create session");

      setFormResult(
        data.zoomCreated
          ? "Class created — Zoom meeting with registration + waiting room is live."
          : data.zoomError
          ? `Class saved, but Zoom meeting failed: ${data.zoomError}`
          : "Class saved. Zoom is not configured yet — add your Zoom API keys to enable registration."
      );
      setFormResultIsError(!!data.zoomError);
      setTitle("");
      setDescription("");
      setDate("");
      setBatch("");
      await fetchSessions();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not create session.");
    } finally {
      setCreating(false);
    }
  };

  const handleRegisterAll = async (sessionId: string) => {
    setRegisteringId(sessionId);
    setRegisterResult(null);
    setRegisterResultIsError(false);
    try {
      const res = await fetch(`/api/admin/class-sessions/${sessionId}/register`, {
        method: "POST",
        headers: await authHeader(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      const failedCount = (data.failed || []).length;
      setRegisterResult(
        `${data.registered.length} registered, ${data.already.length} already registered` +
          (failedCount > 0 ? `, ${failedCount} failed` : "") +
          ` (of ${data.total} students)`
      );
      setRegisterResultIsError(failedCount > 0);
      await fetchSessions();
    } catch (err) {
      setRegisterResult(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
      setRegisterResultIsError(true);
    } finally {
      setRegisteringId(null);
    }
  };

  const toggleRegistrants = async (sessionId: string) => {
    if (openRegistrantsId === sessionId) {
      setOpenRegistrantsId(null);
      setRegistrants([]);
      return;
    }
    setOpenRegistrantsId(sessionId);
    setRegistrantsLoading(true);
    try {
      const res = await fetch(`/api/admin/class-sessions/${sessionId}/register`, {
        cache: "no-store",
        headers: await authHeader(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load registrants");
      setRegistrants(data.registrants || []);
    } catch (err) {
      console.error("Registrants fetch error:", err);
      setRegistrants([]);
    } finally {
      setRegistrantsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Zoom config warning */}
      {!zoomConfigured && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-sm flex items-start gap-3"
        >
          <ShieldCheck className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-amber-300">Zoom API is not configured yet</p>
            <p className="text-xs text-amber-200/70 leading-relaxed">
              You can still schedule classes, but students won&apos;t get personal join links until you add{" "}
              <code className="bg-black/30 px-1.5 py-0.5 rounded text-[11px]">ZOOM_CLIENT_ID</code>,{" "}
              <code className="bg-black/30 px-1.5 py-0.5 rounded text-[11px]">ZOOM_CLIENT_SECRET</code> and{" "}
              <code className="bg-black/30 px-1.5 py-0.5 rounded text-[11px]">ZOOM_ACCOUNT_ID</code> to your
              environment (create a Server-to-Server OAuth app at marketplace.zoom.us).
            </p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Create form ─────────────────────────────────────────── */}
        <div className="lg:col-span-1">
          <Card className="border border-white/10 bg-neutral-950/80 backdrop-blur-md">
            <CardHeader className="border-b border-white/5 py-4">
              <CardTitle className="text-md font-bold flex items-center gap-2 text-white font-[family-name:var(--font-poppins)]">
                <Plus className="h-5 w-5 text-gold" />
                Schedule Live Class
              </CardTitle>
              <CardDescription className="text-white/50 text-xs">
                Creates a Zoom meeting with registration + waiting room
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleCreate} className="space-y-4">
                {formError && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}
                {formResult && (
                  <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                    formResultIsError
                      ? "bg-amber-500/10 border border-amber-500/20 text-amber-300"
                      : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                  }`}>
                    {formResultIsError ? (
                      <AlertCircle className="h-4 w-4 shrink-0" />
                    ) : (
                      <Check className="h-4 w-4 shrink-0" />
                    )}
                    <span>{formResult}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">Class Title</label>
                  <Input
                    type="text"
                    placeholder="e.g. Options Hedging Live — Batch 3"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-10 text-sm"
                    disabled={creating}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">Date (IST)</label>
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      onClick={(e) => {
                        try {
                          e.currentTarget.showPicker?.();
                        } catch {}
                      }}
                      className="bg-white/5 border-white/10 text-white h-10 text-sm cursor-pointer [color-scheme:dark]"
                      disabled={creating}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">Start Time (IST)</label>
                    <Input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="bg-white/5 border-white/10 text-white h-10 text-sm cursor-pointer [color-scheme:dark]"
                      disabled={creating}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">
                    Duration (minutes)
                  </label>
                  <Input
                    type="number"
                    min={15}
                    max={600}
                    step={15}
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="bg-white/5 border-white/10 text-white h-10 text-sm"
                    disabled={creating}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">Batch (who gets invited)</label>
                  <select
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    className="w-full bg-neutral-900 border border-white/10 rounded-lg text-white h-10 px-3 text-xs outline-none focus:border-gold/50"
                    disabled={creating}
                  >
                    <option value="" className="bg-neutral-900">All batches (every student)</option>
                    {["Batch 1", "Batch 2", "Batch 3", "Batch 4", "Batch 5", "Batch 6"].map((b) => (
                      <option key={b} value={b} className="bg-neutral-900">{b}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-white/35 pt-0.5">
                    &quot;Register All Students&quot; will only invite students of this batch.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">Description</label>
                  <Textarea
                    placeholder="Topics covered, prerequisites, etc."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[70px] text-xs resize-none"
                    disabled={creating}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={creating}
                  className="w-full h-10 bg-gold text-gold-foreground hover:bg-gold/90 font-semibold text-sm rounded-lg flex items-center justify-center gap-1.5 transition-all"
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Video className="h-4 w-4" />
                      Create Class & Meeting
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* ── Sessions list ───────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {registerResult && (
            <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              registerResultIsError
                ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
                : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
            }`}>
              {registerResultIsError ? (
                <AlertCircle className="h-4 w-4 shrink-0" />
              ) : (
                <Check className="h-4 w-4 shrink-0" />
              )}
              <span>{registerResult}</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-white/40 flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-gold" />
              Loading live classes...
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-12 text-center text-white/40 border border-dashed border-white/10 rounded-2xl">
              No live classes scheduled yet. Create your first one →
            </div>
          ) : (
            sessions.map((session) => (
              <Card key={session.id} className="border border-white/10 bg-neutral-950/80 backdrop-blur-md overflow-hidden">
                <div className="p-5 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <MonitorPlay className="h-4 w-4 text-gold shrink-0" />
                        <h3 className="text-base font-semibold text-white">{session.title}</h3>
                      </div>
                      <p className="text-xs text-white/50">{IST_FMT.format(new Date(session.starts_at))} IST • {session.duration_minutes} min</p>
                      {session.description && (
                        <p className="text-xs text-white/60 max-w-md leading-relaxed">{session.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {session.batch && (
                        <span className="text-[10px] font-bold bg-gold/15 text-gold border border-gold/30 px-2 py-1 rounded-full">
                          {session.batch}
                        </span>
                      )}
                      {session.zoom_meeting_id && (
                        <span className="text-[10px] font-mono bg-white/5 border border-white/10 text-white/60 px-2 py-1 rounded">
                          Meeting {session.zoom_meeting_id}
                        </span>
                      )}
                      <span className="text-[10px] font-bold bg-gold/15 text-gold border border-gold/30 px-2 py-1 rounded-full">
                        {session.registeredCount} registered
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Button
                      onClick={() => handleRegisterAll(session.id)}
                      disabled={registeringId === session.id || !session.zoom_meeting_id}
                      className="h-9 text-xs bg-gold text-gold-foreground hover:bg-gold/90 font-semibold rounded-lg flex items-center gap-1.5 transition-all"
                      title={!session.zoom_meeting_id ? "Register students once a Zoom meeting is linked" : "Registers every active student profile for this class"}
                    >
                      {registeringId === session.id ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Registering...
                        </>
                      ) : (
                        <>
                          <Users className="h-3.5 w-3.5" />
                          Register All Students
                        </>
                      )}
                    </Button>

                    {session.zoom_start_url && (
                      <Button
                        asChild
                        variant="outline"
                        className="h-9 text-xs border-white/15 text-white hover:bg-white/10 rounded-lg"
                      >
                        <a href={session.zoom_start_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" />
                          Start as Host
                        </a>
                      </Button>
                    )}

                    <Button
                      onClick={() => toggleRegistrants(session.id)}
                      variant="ghost"
                      className="h-9 text-xs text-white/60 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-1.5"
                    >
                      {openRegistrantsId === session.id ? (
                        <>
                          <X className="h-3.5 w-3.5" />
                          Close Registrants
                        </>
                      ) : (
                        <>
                          <Eye className="h-3.5 w-3.5" />
                          View Registrants
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Registrant drawer */}
                  <AnimatePresence>
                    {openRegistrantsId === session.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 rounded-xl border border-white/10 bg-black/30 overflow-hidden">
                          {registrantsLoading ? (
                            <div className="p-6 text-center text-white/40 text-xs flex items-center justify-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin text-gold" />
                              Loading registrants...
                            </div>
                          ) : registrants.length === 0 ? (
                            <div className="p-6 text-center text-white/40 text-xs">
                              No students registered yet. Click “Register All Students”.
                            </div>
                          ) : (
                            <table className="w-full text-left text-sm border-collapse">
                              <thead>
                                <tr className="border-b border-white/5 text-white/55 text-[10px] font-semibold uppercase tracking-wider bg-white/[0.01]">
                                  <th className="py-2.5 px-4">Student</th>
                                  <th className="py-2.5 px-4">Email</th>
                                  <th className="py-2.5 px-4">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                {registrants.map((r) => (
                                  <tr key={r.id} className="hover:bg-white/[0.02]">
                                    <td className="py-2.5 px-4 text-white/80 text-xs">{r.name || "—"}</td>
                                    <td className="py-2.5 px-4 text-white/50 text-xs">{r.email}</td>
                                    <td className="py-2.5 px-4">
                                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                                        r.status === "approved"
                                          ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                          : r.status === "pending"
                                          ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                                          : "bg-white/5 text-white/50 border-white/10"
                                      }`}>
                                        {r.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
