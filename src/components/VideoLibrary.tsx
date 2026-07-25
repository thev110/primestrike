"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Loader2, Lock, Clock, CheckCircle2, XCircle, PlayCircle, Eye, Send, KeyRound } from "lucide-react";

interface CatalogItem {
  id: string;
  title: string;
  description: string | null;
  access: "none" | "pending" | "granted" | "expired" | "denied";
  expiresAt: string | null;
  requestCount: number;
  grantCount: number;
  viewCount: number;
}

export default function VideoLibrary() {
  const router = useRouter();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const authHeader = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token || ""}` };
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/videos/catalog", { headers: await authHeader() });
      const text = await res.text();
      const json = text ? JSON.parse(text) : {};
      if (res.ok) setItems(json.videos || []);
      else setError(json.error || "Failed to load videos.");
    } catch {
      setError("Network error loading videos.");
    } finally {
      setLoading(false);
    }
  }, [authHeader]);

  useEffect(() => {
    load();
  }, [load]);

  const requestAccess = async (videoId: string) => {
    try {
      setBusyId(videoId);
      const res = await fetch("/api/videos/request", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeader()) },
        body: JSON.stringify({ videoId }),
      });
      if (res.ok) await load();
      else {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "Request failed.");
      }
    } catch {
      setError("Network error sending request.");
    } finally {
      setBusyId(null);
    }
  };

  const badge = (item: CatalogItem) => {
    switch (item.access) {
      case "pending":
        return (
          <span className="flex items-center gap-1 text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
            <Clock className="h-3 w-3" /> Awaiting approval
          </span>
        );
      case "granted":
        return (
          <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="h-3 w-3" /> Access granted
          </span>
        );
      case "expired":
        return (
          <span className="flex items-center gap-1 text-[11px] text-neutral-400 bg-neutral-500/10 border border-neutral-500/20 px-2 py-0.5 rounded-full">
            <XCircle className="h-3 w-3" /> Expired
          </span>
        );
      case "denied":
        return (
          <span className="flex items-center gap-1 text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
            <XCircle className="h-3 w-3" /> Denied
          </span>
        );
      default:
        return null;
    }
  };

  const action = (item: CatalogItem) => {
    if (item.access === "granted") {
      return (
        <Button
          onClick={() => router.push(`/watch/${item.id}`)}
          className="h-9 bg-gold text-gold-foreground hover:bg-gold/90 font-semibold text-xs rounded-lg flex items-center gap-1.5"
        >
          <PlayCircle className="h-4 w-4" /> Watch Now
        </Button>
      );
    }
    if (item.access === "pending") {
      return (
        <Button disabled className="h-9 text-xs rounded-lg bg-white/5 text-white/40 cursor-not-allowed">
          Requested
        </Button>
      );
    }
    // none / denied / expired -> can (re)request
    return (
      <Button
        onClick={() => requestAccess(item.id)}
        disabled={busyId === item.id}
        variant="outline"
        className="h-9 text-xs rounded-lg border-white/10 text-white/80 hover:text-white hover:bg-white/5 flex items-center gap-1.5"
      >
        {busyId === item.id ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Lock className="h-3.5 w-3.5" />
        )}
        {item.access === "denied" || item.access === "expired" ? "Request Again" : "Request Access"}
      </Button>
    );
  };

  return (
    <Card className="border border-white/10 bg-neutral-950/80 backdrop-blur-md">
      <CardHeader className="border-b border-white/5 py-4">
        <CardTitle className="text-md font-bold flex items-center gap-2 text-white font-[family-name:var(--font-poppins)]">
          <Video className="h-4.5 w-4.5 text-gold" />
          Video Library
        </CardTitle>
        <CardDescription className="text-white/50 text-xs">
          Request access to recorded sessions. Approved videos play in-app for 48 hours.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {error && (
          <div className="mb-3 p-2.5 rounded-lg text-xs bg-red-500/10 border border-red-500/20 text-red-400">
            {error}
          </div>
        )}
        {loading ? (
          <div className="h-32 flex items-center justify-center text-white/40">
            <Loader2 className="h-6 w-6 animate-spin text-gold" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-center py-8 text-sm text-white/40">No videos available yet.</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-white truncate">{item.title}</h4>
                    {item.description && (
                      <p className="text-[11px] text-white/40 mt-0.5 line-clamp-2">{item.description}</p>
                    )}
                  </div>
                  {badge(item)}
                </div>
                
                {/* Stats indicators */}
                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <div className="flex items-center gap-3 text-[10px] text-white/40">
                    <span className="flex items-center gap-1" title="Times requested by you">
                      <Send className="h-3 w-3 text-gold/70" />
                      Req: <strong className="text-white/70">{item.requestCount}</strong>
                    </span>
                    <span className="flex items-center gap-1" title="Times access granted to you">
                      <KeyRound className="h-3 w-3 text-emerald-400/70" />
                      Granted: <strong className="text-white/70">{item.grantCount}</strong>
                    </span>
                    <span className="flex items-center gap-1" title="Times watched by you">
                      <Eye className="h-3 w-3 text-blue-400/70" />
                      Viewed: <strong className="text-white/70">{item.viewCount}</strong>
                    </span>
                  </div>
                  {action(item)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
