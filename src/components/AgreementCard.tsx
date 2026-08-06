"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FileSignature,
  Loader2,
  Check,
  AlertCircle,
  Camera,
  RotateCcw,
  ShieldCheck,
  PenLine,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const AGREEMENT_TEXT = `PRIME STRIKE TRADING ACADEMY — DIGITAL LEARNING AGREEMENT

By signing below, I confirm that:

1. All recorded videos, live class links, study materials and content provided by
   Prime Strike Trading Academy are strictly personal and for my own learning only.

2. I will NOT share, record, copy, screenshot, re-upload or distribute any video,
   class link or course content to any third party, on any platform.

3. Course fees are non-refundable once the batch begins. If I miss a live class, a
   recorded video will be made available to me per the video access policy.

4. I understand that each student's access is linked to their personal account, and
   that sharing access links is traceable back to me and may result in termination
   of my access without refund.

5. I agree to provide accurate details (name, address, phone) for record-keeping
   and legal purposes.`;

// AgreementCard — students read the agreement, capture a webcam selfie, draw an
// on-screen signature, and enter their address/phone. All stored in their record.
export default function AgreementCard({ onSigned }: { onSigned?: () => void }) {
  const [signed, setSigned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  // Webcam state
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [selfie, setSelfie] = useState<string | null>(null);

  // Signature pad state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const [signature, setSignature] = useState<string | null>(null);

  const authHeader = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token || ""}` };
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, email")
        .eq("id", session.user.id)
        .single();
      if (profile?.name) setName(profile.name);

      const res = await fetch("/api/agreement", { headers: await authHeader() });
      const j = await res.json().catch(() => ({}));
      setSigned(!!j.signed);
    } finally {
      setLoading(false);
    }
  }, [authHeader]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Webcam ────────────────────────────────────────────────
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
      setSelfie(null);
    } catch {
      setError("Camera access was denied. Please allow camera access to continue.");
    }
  };

  const captureSelfie = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setSelfie(canvas.toDataURL("image/jpeg", 0.85));
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  };

  useEffect(() => () => stopCamera(), []);

  // ── Signature pad ─────────────────────────────────────────
  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const onPointerUp = () => {
    drawingRef.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Keep the transparent background (white strokes) — check for content.
    const dataUrl = canvas.toDataURL("image/png");
    setSignature(dataUrl.length > 2000 ? dataUrl : null);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setSignature(null);
  };

  // Ensure the canvas backing store is sized to its CSS box.
  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(dpr, dpr);
    }
  };

  useEffect(() => {
    if (open) {
      setTimeout(resizeCanvas, 60);
    }
  }, [open]);

  // ── Submit ────────────────────────────────────────────────
  const submit = async () => {
    setError("");
    if (!name.trim() || !address.trim() || !phone.trim()) {
      setError("Please fill in your name, address and phone number.");
      return;
    }
    if (!selfie) {
      setError("Please capture a webcam photo of yourself.");
      return;
    }
    if (!signature) {
      setError("Please draw your signature on the pad.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/agreement", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeader()) },
        body: JSON.stringify({
          name,
          address,
          phone,
          selfie,
          signature,
          agreementText: AGREEMENT_TEXT,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Could not submit agreement.");
      setSigned(true);
      setOpen(false);
      stopCamera();
      onSigned?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit agreement.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border border-white/10 bg-neutral-950/80 backdrop-blur-md">
      <CardHeader className="border-b border-white/5 py-4">
        <CardTitle className="text-md font-bold flex items-center gap-2 text-white font-[family-name:var(--font-poppins)]">
          <FileSignature className="h-4.5 w-4.5 text-gold" />
          Digital Learning Agreement
        </CardTitle>
        <CardDescription className="text-white/50 text-xs">
          {signed
            ? "You have signed the agreement. Thank you!"
            : "Read, sign and verify your identity to unlock full access."}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {loading ? (
          <div className="py-4 flex items-center justify-center text-white/40">
            <Loader2 className="h-5 w-5 animate-spin text-gold" />
          </div>
        ) : signed ? (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0" />
            Agreement signed and verified. Your access is active.
          </div>
        ) : (
          <Button
            onClick={() => {
              setError("");
              setOpen(true);
            }}
            className="w-full h-10 bg-gold text-gold-foreground hover:bg-gold/90 font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5"
          >
            <PenLine className="h-4 w-4" />
            Read & Sign the Agreement
          </Button>
        )}
      </CardContent>

      {/* Signature modal */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-950 border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-5 border-b border-white/10 flex items-start justify-between bg-neutral-900/50">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gold bg-gold/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Digital Agreement
                  </span>
                  <h2 className="text-lg font-bold text-white font-[family-name:var(--font-poppins)]">
                    Sign & Verify
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setOpen(false);
                    stopCamera();
                  }}
                  className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* Agreement text */}
                <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] max-h-48 overflow-y-auto">
                  <p className="text-[11px] text-white/70 leading-relaxed whitespace-pre-line">
                    {AGREEMENT_TEXT}
                  </p>
                </div>

                {error && (
                  <div className="p-3 rounded-lg text-xs bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">
                      Full Name (as per ID)
                    </label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-10 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">
                      Phone Number
                    </label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 ..."
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-10 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">
                    Residential Address (for records)
                  </label>
                  <Textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House no, street, city, state, pincode"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[60px] text-xs resize-none"
                  />
                </div>

                {/* Webcam selfie */}
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-white/60 uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="h-3.5 w-3.5 text-gold" /> Identity Photo (webcam)
                  </label>
                  <div className="rounded-xl overflow-hidden border border-white/10 bg-black aspect-video flex items-center justify-center relative">
                    {selfie ? (
                      <img src={selfie} alt="Captured" className="w-full h-full object-cover" />
                    ) : cameraOn ? (
                      <video
                        ref={videoRef}
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white/30 text-xs">Camera is off</span>
                    )}
                    {cameraOn && !selfie && (
                      <div className="absolute bottom-2 inset-x-0 flex justify-center">
                        <Button
                          onClick={captureSelfie}
                          className="h-9 bg-gold text-gold-foreground hover:bg-gold/90 text-xs rounded-full px-5 font-semibold flex items-center gap-1.5"
                        >
                          <Camera className="h-3.5 w-3.5" /> Capture Photo
                        </Button>
                      </div>
                    )}
                    {!selfie && !cameraOn && (
                      <Button
                        onClick={startCamera}
                        variant="outline"
                        className="border-gold/40 text-gold hover:bg-gold/10 text-xs rounded-full px-5 h-9 flex items-center gap-1.5"
                      >
                        <Camera className="h-3.5 w-3.5" /> Start Camera
                      </Button>
                    )}
                    {selfie && (
                      <button
                        onClick={() => {
                          setSelfie(null);
                          startCamera();
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg text-[10px] flex items-center gap-1"
                      >
                        <RotateCcw className="h-3 w-3" /> Retake
                      </button>
                    )}
                  </div>
                </div>

                {/* Signature pad */}
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-white/60 uppercase tracking-wider flex items-center gap-1.5">
                    <PenLine className="h-3.5 w-3.5 text-gold" /> Draw Your Signature
                  </label>
                  <div className="relative rounded-xl overflow-hidden border border-white/15 bg-neutral-900">
                    <canvas
                      ref={canvasRef}
                      onPointerDown={onPointerDown}
                      onPointerMove={onPointerMove}
                      onPointerUp={onPointerUp}
                      onPointerLeave={onPointerUp}
                      className="w-full h-36 touch-none cursor-crosshair"
                      style={{ background: "transparent" }}
                    />
                    {!signature && (
                      <span className="absolute inset-0 flex items-center justify-center text-white/20 text-xs pointer-events-none">
                        Draw your signature here
                      </span>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={clearSignature}
                      variant="ghost"
                      className="h-8 text-[11px] text-white/50 hover:text-white"
                    >
                      <RotateCcw className="h-3 w-3" /> Clear
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={submit}
                  disabled={submitting}
                  className="w-full h-10 bg-gold text-gold-foreground hover:bg-gold/90 font-semibold text-sm rounded-lg flex items-center justify-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      I Agree & Sign
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Card>
  );
}
