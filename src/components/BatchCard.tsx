"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layers, Loader2, Check, AlertCircle, ShieldCheck } from "lucide-react";

const BATCHES = ["Batch 1", "Batch 2", "Batch 3", "Batch 4", "Batch 5", "Batch 6"];

// BatchCard — lets a logged-in student view and update their batch.
// Used on the student dashboard AND on the standalone /batch page that
// students are sent to via a shareable link.
export default function BatchCard({
  compact = false,
  onSaved,
}: {
  compact?: boolean;
  onSaved?: () => void;
}) {
  const [currentBatch, setCurrentBatch] = useState<string | null>(null);
  const [selected, setSelected] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const authHeader = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token || ""}` };
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase
        .from("profiles")
        .select("batch")
        .eq("id", session.user.id)
        .single();
      setCurrentBatch(data?.batch || null);
      setSelected(data?.batch || "");
    } catch {
      // ignore — auth guard on the page handles the rest
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!selected) {
      setError("Please select your batch.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/profile/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeader()) },
        body: JSON.stringify({ batch: selected }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Could not save batch.");
      }
      setCurrentBatch(selected);
      setSaved(true);
      onSaved?.();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save batch.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border border-white/10 bg-neutral-950/80 backdrop-blur-md">
      <CardHeader className="border-b border-white/5 py-4">
        <CardTitle className="text-md font-bold flex items-center gap-2 text-white font-[family-name:var(--font-poppins)]">
          <Layers className="h-4.5 w-4.5 text-gold" />
          My Batch
        </CardTitle>
        <CardDescription className="text-white/50 text-xs">
          {currentBatch
            ? `You are in ${currentBatch}.`
            : "Select the batch you belong to. Your classes and videos are matched to it."}
        </CardDescription>
      </CardHeader>
      <CardContent className={`pt-4 space-y-3 ${compact ? "" : ""}`}>
        {error && (
          <div className="p-2.5 rounded-lg text-xs bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-2">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-4 flex items-center justify-center text-white/40">
            <Loader2 className="h-5 w-5 animate-spin text-gold" />
          </div>
        ) : currentBatch ? (
          <div className="rounded-xl border border-gold/20 bg-gold/5 p-5 text-center space-y-2.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-gold/15 border border-gold/30 px-4 py-1.5">
              <Layers className="h-4 w-4 text-gold" />
              <span className="text-sm font-bold text-gold">{currentBatch}</span>
            </div>
            <p className="text-xs text-white/55">
              Your batch is locked and can only be changed by an admin.
            </p>
            <p className="text-[11px] text-white/40 flex items-center justify-center gap-1.5">
              <ShieldCheck className="h-3 w-3 shrink-0 text-gold/70" />
              Only {currentBatch} classes and recorded videos are shown to you.
            </p>
            <p className="text-[11px] text-white/35">
              Picked the wrong batch? Message Prime Strike — an admin can update it in a minute.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2">
              {BATCHES.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => {
                    setSelected(b);
                    setSaved(false);
                  }}
                  className={`h-9 rounded-lg border text-xs font-semibold transition-all ${
                    selected === b
                      ? "bg-gold text-gold-foreground border-gold shadow-lg shadow-gold/20"
                      : "bg-white/5 border-white/10 text-white/70 hover:text-white hover:border-white/25"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>

            <Button
              onClick={save}
              disabled={saving || !selected || selected === currentBatch}
              className="w-full h-9 bg-gold text-gold-foreground hover:bg-gold/90 font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : saved ? (
                <Check className="h-3.5 w-3.5" />
              ) : null}
              {saving ? "Saving..." : saved ? "Batch saved!" : "Save My Batch"}
            </Button>

            <p className="text-[10px] text-white/35 flex items-center gap-1.5 pt-0.5">
              <ShieldCheck className="h-3 w-3 shrink-0" />
              You can only set this once — classes and recorded videos get matched to it.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
