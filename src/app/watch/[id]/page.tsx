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

  // Anti-capture deterrents & strict focus guards.
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

    const handleWindowBlur = () => {
      if (videoRef.current) {
        videoRef.current.pause();
      }
      setPaused(true);
    };

    const handleWindowFocus = () => {
      setPaused(false);
    };

    const onVisibility = () => {
      if (document.hidden) {
        handleWindowBlur();
      } else {
        handleWindowFocus();
      }
    };

    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("keydown", blockKeys);
    document.addEventListener("contextmenu", blockCtx);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
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

          {/* Dual dynamic watermarks: student email burned across the video frame */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="watermark-drift-1 absolute whitespace-nowrap text-white/25 text-xs font-mono select-none drop-shadow-md">
              {watermark} · Prime Strike Protected
            </div>
            <div className="watermark-drift-2 absolute whitespace-nowrap text-gold/30 text-xs font-mono select-none drop-shadow-md">
              {watermark} · Confidential Stream
            </div>
          </div>

          {/* Screen recording / window blur protection overlay */}
          {paused && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/98 text-center p-6 space-y-3 z-30">
              <ShieldAlert className="h-10 w-10 text-gold animate-bounce" />
              <h3 className="text-lg font-bold text-white">Screen Protection Active</h3>
              <p className="text-xs text-neutral-400 max-w-md">
                Playback paused. Switch focus back to this browser window to resume watching. External screen recording, screenshotting, or sharing is strictly prohibited and tracked to <strong className="text-gold">{watermark}</strong>.
              </p>
            </div>
          )}
        </div>

        <p className="mt-4 text-xs text-neutral-500 text-center">
          Private viewing for {watermark}. Recording, downloading, or sharing is prohibited and traceable.
        </p>
      </div>

      <style jsx>{`
        .watermark-drift-1 {
          top: 10%;
          left: 10%;
          animation: drift1 19s linear infinite alternate;
        }
        .watermark-drift-2 {
          bottom: 15%;
          right: 10%;
          animation: drift2 23s linear infinite alternate;
        }
        @keyframes drift1 {
          0% { top: 8%; left: 6%; }
          25% { top: 75%; left: 65%; }
          50% { top: 35%; left: 15%; }
          75% { top: 82%; left: 80%; }
          100% { top: 12%; left: 45%; }
        }
        @keyframes drift2 {
          0% { bottom: 10%; right: 8%; }
          30% { bottom: 80%; right: 70%; }
          60% { bottom: 25%; right: 30%; }
          100% { bottom: 85%; right: 15%; }
        }
      `}</style>
    </div>
  );
}
