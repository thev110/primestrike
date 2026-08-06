"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MonitorPlay, Loader2, Lock, ExternalLink, Clock, CalendarDays, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LiveSession {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  duration_minutes: number;
  zoom_meeting_id: string | null;
  batch: string | null;
  registrant: {
    email: string;
    name: string | null;
    join_url: string | null;
    status: string;
  } | null;
}

const IST_FMT = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export default function LiveClasses() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const authHeader = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token || ""}` };
  }, []);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/class-sessions", {
        cache: "no-store",
        headers: await authHeader(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load classes");
      setSessions(data.sessions || []);
    } catch (err) {
      console.error("Live classes fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to load classes.");
    } finally {
      setLoading(false);
    }
  }, [authHeader]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleRegister = async (sessionId: string) => {
    setRegisteringId(sessionId);
    setError(null);
    try {
      const res = await fetch("/api/class-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeader()) },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed.");
      await fetchSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setRegisteringId(null);
    }
  };

  return (
    <Card className="border border-white/10 bg-neutral-950/80 backdrop-blur-md">
      <CardHeader className="border-b border-white/5 py-4">
        <CardTitle className="text-md font-bold flex items-center gap-2 text-white font-[family-name:var(--font-poppins)]">
          <MonitorPlay className="h-4.5 w-4.5 text-gold" />
          Live Classes
        </CardTitle>
        <CardDescription className="text-white/50 text-xs">
          Upcoming live sessions with your personal join link
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-xs">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-8 flex flex-col items-center justify-center text-white/40">
            <Loader2 className="h-5 w-5 animate-spin text-gold mb-2" />
            Loading live classes...
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-8 text-center text-white/40 text-sm">
            No live classes scheduled yet. Your mentor will add sessions here.
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {sessions.map((session) => {
                const joined = !!session.registrant?.join_url;
                return (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold text-white">{session.title}</h4>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/50">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3 text-gold shrink-0" />
                            {IST_FMT.format(new Date(session.starts_at))} IST
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-gold shrink-0" />
                            {session.duration_minutes} min
                          </span>
                        </div>
                        {session.description && (
                          <p className="text-xs text-white/60 leading-relaxed pt-1">{session.description}</p>
                        )}
                        {session.batch && (
                          <span className="inline-block mt-1.5 text-[9px] font-bold bg-gold/15 text-gold border border-gold/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            For {session.batch}
                          </span>
                        )}
                      </div>

                      <span className={`text-[9px] font-bold px-2 py-1 rounded-full border uppercase tracking-wider shrink-0 ${
                        joined
                          ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                          : "bg-gold/15 text-gold border-gold/30"
                      }`}>
                        {joined ? "Registered" : "Not registered"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      {joined ? (
                        <Button
                          asChild
                          className="h-9 text-xs bg-gold text-gold-foreground hover:bg-gold/90 font-bold rounded-lg flex items-center gap-1.5 transition-all flex-1"
                        >
                          <a
                            href={session.registrant?.join_url || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Join Class (Personal Link)
                          </a>
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleRegister(session.id)}
                          disabled={registeringId === session.id || !session.zoom_meeting_id}
                          className="h-9 text-xs bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg flex items-center gap-1.5 transition-all flex-1"
                        >
                          {registeringId === session.id ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Registering...
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="h-3.5 w-3.5 text-gold" />
                              Register for this Class
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                    {joined && (
                      <>
                        <p className="text-[10px] text-white/35 flex items-center gap-1.5 pt-0.5">
                          <Lock className="h-3 w-3 shrink-0" />
                          This link is personal and tied to your account — sharing it is traceable, and the host
                          still approves everyone at the door.
                        </p>
                        <p className="text-[10px] text-white/35 flex items-center gap-1.5">
                          <ShieldCheck className="h-3 w-3 shrink-0 text-gold/70" />
                          Zoom will ask you to sign in to a free Zoom account before joining.
                        </p>
                      </>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
