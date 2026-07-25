"use client";

import { useEffect, useRef, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, ShieldAlert } from "lucide-react";

// Login-gated in-app player. Verifies the student holds a live 48h grant,
// opens a proxied playback session (real URL hidden in an httpOnly cookie),
// and overlays the student's email as a moving watermark.
export default function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [errMsg, setErrMsg] = useState("");
  const [title, setTitle] = useState("");
  const [watermark, setWatermark] = useState("");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [remaining, setRemaining] = useState("");
  const [paused, setPaused] = useState(false);

  // Redirect unauthenticated visitors to login.
  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  // Open the playback session once we know who the user is.
  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;

    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch("/api/video/session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token || ""}`,
          },
          body: JSON.stringify({ videoId: id }),
        });
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;

        if (!res.ok) {
          const map: Record<string, string> = {
            no_access: "You do not have access to this video. Request it from your dashboard.",
            expired: "Your access window has ended. Request access again to watch.",
            not_found: "This video is no longer available.",
            unauthorized: "Please log in to watch.",
          };
          setErrMsg(map[json.error] || "Unable to start playback.");
          setState("error");
          return;
        }

        setTitle(json.title || "");
        setWatermark(json.watermark || user.email || "");
        setExpiresAt(json.expiresAt || null);
        setState("ready");
      } catch {
        if (!cancelled) {
          setErrMsg("Network error. Please try again.");
          setState("error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, id]);

  // Countdown to expiry.
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const ms = new Date(expiresAt).getTime() - Date.now();
      if (ms <= 0) {
        setRemaining("Expired");
        setState("error");
        setErrMsg("Your access window has ended.");
        return;
      }
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      setRemaining(`${h}h ${m}m left`);
    };
    tick();
    const iv = setInterval(tick, 60000);
    return () => clearInterval(iv);
  }, [expiresAt]);

  // Anti-capture deterrents (raise effort; cannot stop a phone camera).
  useEffect(() => {
    if (state !== "ready") return;
    const blockKeys = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (
        k === "printscreen" ||
        (e.ctrlKey && (k === "s" || k === "u" || k === "p")) ||
        (e.ctrlKey && e.shiftKey && (k === "i" || k === "j" || k === "c"))
      ) {
        e.preventDefault();
      }
    };
    const blockCtx = (e: MouseEvent) => e.preventDefault();
    const onVisibility = () => {
      if (document.hidden) {
        videoRef.current?.pause();
        setPaused(true);
      } else {
        setPaused(false);
      }
    };
    document.addEventListener("keydown", blockKeys);
    document.addEventListener("contextmenu", blockCtx);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("keydown", blockKeys);
      document.removeEventListener("contextmenu", blockCtx);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [state]);

  if (authLoading || state === "loading") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <ShieldAlert className="h-10 w-10 text-gold mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-white mb-3">Access unavailable</h1>
          <p className="text-neutral-400">{errMsg}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-6 inline-block bg-gold text-gold-foreground font-semibold px-6 py-2.5 rounded-lg hover:bg-gold/90 transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-16 px-4 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-white">{title}</h1>
          {remaining && (
            <span className="text-xs font-medium text-gold bg-gold/10 border border-gold/20 px-3 py-1 rounded-full">
              {remaining}
            </span>
          )}
        </div>

        <div className="relative w-full select-none overflow-hidden rounded-xl border border-neutral-800 bg-black">
          <video
            ref={videoRef}
            src="/api/video/stream"
            controls
            controlsList="nodownload noremoteplayback noplaybackrate"
            disablePictureInPicture
            onContextMenu={(e) => e.preventDefault()}
            autoPlay
            className="w-full bg-black"
          />

          {/* Moving watermark: student email burned over the frame. */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="watermark-drift absolute whitespace-nowrap text-white/20 text-sm font-mono">
              {watermark} · Prime Strike
            </div>
          </div>

          {paused && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/95 text-neutral-300 text-sm">
              Playback paused — return to this tab to continue.
            </div>
          )}
        </div>

        <p className="mt-4 text-xs text-neutral-500 text-center">
          Private viewing for {watermark}. Recording, downloading, or sharing is prohibited and traceable.
        </p>
      </div>

      <style jsx>{`
        .watermark-drift {
          top: 10%;
          left: 10%;
          animation: drift 17s linear infinite alternate;
        }
        @keyframes drift {
          0% { top: 8%; left: 6%; }
          25% { top: 70%; left: 60%; }
          50% { top: 40%; left: 20%; }
          75% { top: 80%; left: 75%; }
          100% { top: 15%; left: 50%; }
        }
      `}</style>
    </div>
  );
}
