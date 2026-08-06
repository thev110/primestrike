"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AgreementCard from "@/components/AgreementCard";
import { Loader2, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

// /agreement — the link you send students so they log in and sign the digital
// learning agreement (webcam photo + on-screen signature + address). Mirrors
// the /batch setup page.
export default function AgreementPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?next=/agreement`);
    }
  }, [authLoading, user, router]);

  if (authLoading || !user || !profile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-16 px-4 relative overflow-hidden">
      <div className="absolute top-10 left-10 w-[400px] h-[400px] bg-gold/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="max-w-md mx-auto space-y-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl border border-white/10 bg-gradient-to-r from-neutral-950 via-neutral-900/50 to-neutral-950 text-center"
        >
          <span className="text-gold text-xs font-semibold uppercase tracking-widest bg-gold/10 px-3 py-1 rounded-full">
            Prime Strike • Digital Agreement
          </span>
          <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-poppins)] mt-3">
            Sign your Learning Agreement
          </h1>
          <p className="text-white/60 text-sm mt-2">
            Logged in as <span className="text-gold font-medium">{profile.email}</span>. Read the
            terms, capture a photo and draw your signature — it takes about 2 minutes.
          </p>
        </motion.div>

        <AgreementCard />

        <p className="text-[11px] text-white/35 text-center flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-gold/70 shrink-0" />
          This is a legally binding digital record. For questions, contact Prime Strike directly.
        </p>
      </div>
    </div>
  );
}
