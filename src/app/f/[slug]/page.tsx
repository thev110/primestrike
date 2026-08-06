"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle2, AlertCircle, Send } from "lucide-react";
import { motion } from "framer-motion";

interface FieldDef {
  key: string;
  label: string;
  type: "text" | "email" | "phone" | "select" | "textarea";
  required: boolean;
  options?: string[];
}

interface FormDef {
  id: string;
  name: string;
  fields: FieldDef[];
  active: boolean;
  slug: string;
}

// /f/[slug] — the public page behind every generated form link. No login needed;
// anyone with the link can respond. Responses land in the admin "Generated Links"
// tab with Excel export.
export default function PublicFormPage() {
  const { slug } = useParams<{ slug: string }>();
  const [form, setForm] = useState<FormDef | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/form-links/${slug}`);
        const j = await res.json().catch(() => ({}));
        if (res.ok) {
          setForm(j.form);
          const init: Record<string, string> = {};
          for (const f of (j.form?.fields || [])) init[f.key] = "";
          setValues(init);
        } else {
          setError(j.error || "Form not found.");
        }
      } catch {
        setError("Network error.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/form-links/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: values }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Could not submit.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-28 pb-16 px-4 relative overflow-hidden">
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gold/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-lg mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 md:p-8 rounded-2xl border border-white/10 bg-neutral-950/80 backdrop-blur-md shadow-2xl"
        >
          {loading ? (
            <div className="py-16 flex items-center justify-center text-white/40">
              <Loader2 className="h-7 w-7 animate-spin text-gold" />
            </div>
          ) : error && !form ? (
            <div className="py-10 text-center space-y-3">
              <AlertCircle className="h-10 w-10 text-red-400 mx-auto" />
              <p className="text-white/70 text-sm">{error}</p>
            </div>
          ) : done ? (
            <div className="py-10 text-center space-y-3">
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <CheckCircle2 className="h-14 w-14 text-emerald-400 mx-auto" />
              </motion.div>
              <h2 className="text-xl font-bold text-white font-[family-name:var(--font-poppins)]">
                Response received!
              </h2>
              <p className="text-sm text-white/60">
                Thank you. Our team will get back to you shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="text-center space-y-1.5 mb-2">
                <span className="text-gold text-[10px] font-semibold uppercase tracking-widest bg-gold/10 px-3 py-1 rounded-full">
                  Prime Strike
                </span>
                <h1 className="text-xl md:text-2xl font-bold text-white font-[family-name:var(--font-poppins)]">
                  {form?.name || "Enquiry Form"}
                </h1>
              </div>

              {error && (
                <div className="p-3 rounded-lg text-xs bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {(form?.fields || []).map((f) => (
                <div key={f.key} className="space-y-1">
                  <label className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">
                    {f.label} {f.required && <span className="text-gold">*</span>}
                  </label>
                  {f.type === "textarea" ? (
                    <Textarea
                      value={values[f.key] || ""}
                      onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                      required={f.required}
                      placeholder={`Your ${f.label.toLowerCase()}`}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[80px] text-sm resize-none"
                    />
                  ) : f.type === "select" ? (
                    <select
                      value={values[f.key] || ""}
                      onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                      required={f.required}
                      className="w-full bg-neutral-900 border border-white/10 rounded-lg text-white h-11 px-3 text-sm outline-none focus:border-gold/50"
                    >
                      <option value="" className="bg-neutral-900">Select...</option>
                      {(f.options || []).map((o) => (
                        <option key={o} value={o} className="bg-neutral-900">{o}</option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      type={f.type === "email" ? "email" : f.type === "phone" ? "tel" : "text"}
                      value={values[f.key] || ""}
                      onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                      required={f.required}
                      placeholder={`Your ${f.label.toLowerCase()}`}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-11 text-sm"
                    />
                  )}
                </div>
              ))}

              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-11 bg-gold text-gold-foreground hover:bg-gold/90 font-semibold rounded-lg flex items-center justify-center gap-2 mt-4"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {submitting ? "Submitting..." : "Submit"}
              </Button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
