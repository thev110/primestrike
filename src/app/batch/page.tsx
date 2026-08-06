"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import BatchCard from "@/components/BatchCard";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

// /batch — the link you send students so they log in with their email and
// update which batch they belong to.
export default function BatchPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?next=/batch`);
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
            Prime Strike • Batch Setup
          </span>
          <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-poppins)] mt-3">
            Which batch are you in?
          </h1>
          <p className="text-white/60 text-sm mt-2">
            Logged in as <span className="text-gold font-medium">{profile.email}</span>. Select
            your batch so we can match your live classes and recorded videos.
          </p>
        </motion.div>

        <BatchCard />
      </div>
    </div>
  );
}
