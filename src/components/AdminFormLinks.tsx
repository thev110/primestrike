"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Link2,
  Loader2,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Copy,
  Eye,
  X,
  FileSpreadsheet,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
  ListChecks,
  GripVertical,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";

interface FieldDef {
  key: string;
  label: string;
  type: "text" | "email" | "phone" | "select" | "textarea";
  required: boolean;
  options?: string[];
}

interface FormLinkRow {
  id: string;
  name: string;
  slug: string;
  fields: FieldDef[];
  active: boolean;
  created_at: string;
  submissionCount: number;
  url: string;
}

interface SubmissionRow {
  id: string;
  data: Record<string, string>;
  created_at: string;
}

const FIELD_TYPES = ["text", "email", "phone", "select", "textarea"] as const;

export default function AdminFormLinks() {
  const [forms, setForms] = useState<FormLinkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create form state
  const [name, setName] = useState("");
  const [fields, setFields] = useState<FieldDef[]>([
    { key: "name", label: "Full Name", type: "text", required: true },
    { key: "email", label: "Email", type: "email", required: true },
    { key: "phone", label: "Phone", type: "phone", required: true },
  ]);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<FormLinkRow | null>(null);

  // Submissions drawer state
  const [openSubsId, setOpenSubsId] = useState<string | null>(null);
  const [subs, setSubs] = useState<SubmissionRow[]>([]);
  const [subsForm, setSubsForm] = useState<{ name: string; fields: FieldDef[] } | null>(null);
  const [subsLoading, setSubsLoading] = useState(false);

  const authHeader = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token || ""}` };
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/admin/form-links", { headers: await authHeader() });
      const j = await res.json().catch(() => ({}));
      if (res.ok) setForms(j.forms || []);
      else setError(j.error || "Failed to load form links.");
    } finally {
      setLoading(false);
    }
  }, [authHeader]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Field builder helpers ──────────────────────────────────
  const updateField = (idx: number, patch: Partial<FieldDef>) => {
    setFields((prev) => prev.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  };

  const addField = () => {
    const key = `field_${Date.now().toString(36)}`;
    setFields((prev) => [
      ...prev,
      { key, label: "New Field", type: "text", required: false, options: [] },
    ]);
  };

  const removeField = (idx: number) => {
    setFields((prev) => prev.filter((_, i) => i !== idx));
  };

  const createForm = async () => {
    setError("");
    if (!name.trim()) {
      setError("Give the form link a name (e.g. \"Batch 6 Instagram Lead\").");
      return;
    }
    if (fields.length === 0) {
      setError("Add at least one field to the form.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/form-links", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeader()) },
        body: JSON.stringify({ name, fields }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Could not create form.");
      setCreated(j.form);
      setName("");
      setFields([
        { key: "name", label: "Full Name", type: "text", required: true },
        { key: "email", label: "Email", type: "email", required: true },
        { key: "phone", label: "Phone", type: "phone", required: true },
      ]);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create form.");
    } finally {
      setCreating(false);
    }
  };

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copy this link:", url);
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    try {
      await fetch(`/api/admin/form-links/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(await authHeader()) },
        body: JSON.stringify({ active }),
      });
      await load();
    } catch {
      setError("Could not toggle form.");
    }
  };

  const deleteForm = async (id: string) => {
    if (!confirm("Delete this form link and ALL its submissions?")) return;
    try {
      const res = await fetch(`/api/admin/form-links/${id}`, {
        method: "DELETE",
        headers: await authHeader(),
      });
      if (!res.ok) setError("Could not delete form.");
      await load();
    } catch {
      setError("Could not delete form.");
    }
  };

  const openSubmissions = async (form: FormLinkRow) => {
    if (openSubsId === form.id) {
      setOpenSubsId(null);
      setSubs([]);
      return;
    }
    setOpenSubsId(form.id);
    setSubsLoading(true);
    try {
      const res = await fetch(`/api/admin/form-links/${form.id}/submissions`, {
        headers: await authHeader(),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setSubs(j.submissions || []);
        setSubsForm({ name: j.form?.name || form.name, fields: j.form?.fields || form.fields });
      }
    } finally {
      setSubsLoading(false);
    }
  };

  const exportExcel = () => {
    if (!subsForm || subs.length === 0) {
      alert("No submissions to export yet.");
      return;
    }
    const headerKeys = subsForm.fields.map((f) => f.key);
    const data = subs.map((s) => {
      const row: Record<string, string> = {
        "Submitted On": new Date(s.created_at).toLocaleString("en-IN"),
      };
      for (const k of headerKeys) {
        const f = subsForm.fields.find((x) => x.key === k);
        row[f?.label || k] = s.data?.[k] ?? "";
      }
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Responses");
    XLSX.writeFile(wb, `${subsForm.name.replace(/[^a-z0-9]+/gi, "_")}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const renderFieldInput = (f: FieldDef, idx: number) => (
    <div key={idx} className="p-3 rounded-xl border border-white/10 bg-white/[0.02] space-y-2">
      <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 text-white/20 shrink-0" />
        <Input
          value={f.label}
          onChange={(e) => updateField(idx, { label: e.target.value })}
          placeholder="Field label"
          className="bg-white/5 border-white/10 text-white h-9 text-xs flex-1"
        />
        <select
          value={f.type}
          onChange={(e) => updateField(idx, { type: e.target.value as FieldDef["type"] })}
          className="bg-neutral-900 border border-white/10 rounded-lg text-white h-9 px-2 text-xs outline-none focus:border-gold/50"
        >
          {FIELD_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button
          onClick={() => updateField(idx, { required: !f.required })}
          title="Required?"
          className={`text-[9px] font-bold px-2 py-1 rounded border uppercase ${
            f.required
              ? "bg-gold/15 text-gold border-gold/30"
              : "bg-white/5 text-white/40 border-white/10"
          }`}
        >
          {f.required ? "Req" : "Opt"}
        </button>
        <button
          onClick={() => removeField(idx)}
          className="text-red-400/70 hover:text-red-300 p-1 hover:bg-red-500/10 rounded"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      {f.type === "select" && (
        <div className="flex items-center gap-1.5 pl-6">
          <input
            value={(f.options || []).join(", ")}
            onChange={(e) =>
              updateField(idx, {
                options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
              })
            }
            placeholder="Options, comma separated (e.g. Batch 1, Batch 2, Batch 3)"
            className="flex-1 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/25 h-8 px-2 text-[11px] outline-none focus:border-gold/50"
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Create form link */}
      <Card className="border border-white/10 bg-neutral-950/80 backdrop-blur-md">
        <CardHeader className="border-b border-white/5 py-4">
          <CardTitle className="text-md font-bold flex items-center gap-2 text-white font-[family-name:var(--font-poppins)]">
            <ListChecks className="h-5 w-5 text-gold" />
            Build a Form Link
          </CardTitle>
          <CardDescription className="text-white/50 text-xs">
            Design a form, generate a link, send it out, and collect responses + Excel exports.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg text-xs bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          {created && (
            <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 text-xs space-y-2">
              <p className="flex items-center gap-2">
                <Check className="h-4 w-4 shrink-0" />
                Form link created! Share it anywhere:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[11px] truncate">
                  {created.url}
                </code>
                <Button
                  onClick={() => copyLink(created.url)}
                  className="h-8 bg-gold text-gold-foreground hover:bg-gold/90 text-xs rounded-lg px-3 font-semibold flex items-center gap-1.5"
                >
                  <Copy className="h-3.5 w-3.5" /> Copy
                </Button>
                <Button asChild variant="outline" className="h-8 text-xs border-white/15 text-white/80 hover:text-white">
                  <a href={created.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">
              Link Name (shown in your dashboard)
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='e.g. "Batch 6 Instagram Lead"'
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-10 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">
              Form Fields
            </label>
            <div className="space-y-2">
              {fields.map((f, i) => renderFieldInput(f, i))}
            </div>
            <Button
              onClick={addField}
              variant="outline"
              className="h-9 text-xs border-dashed border-white/20 text-white/70 hover:text-white hover:border-gold/40 rounded-lg w-full flex items-center justify-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" /> Add Field
            </Button>
          </div>

          <Button
            onClick={createForm}
            disabled={creating}
            className="w-full h-10 bg-gold text-gold-foreground hover:bg-gold/90 font-semibold text-sm rounded-lg flex items-center justify-center gap-1.5"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
            {creating ? "Generating link..." : "Generate Link"}
          </Button>
        </CardContent>
      </Card>

      {/* Existing links */}
      <Card className="border border-white/10 bg-neutral-950/80 backdrop-blur-md">
        <CardHeader className="border-b border-white/5 py-4">
          <CardTitle className="text-md font-bold flex items-center gap-2 text-white font-[family-name:var(--font-poppins)]">
            <Link2 className="h-4.5 w-4.5 text-gold" />
            Generated Links ({forms.length})
          </CardTitle>
          <CardDescription className="text-white/50 text-xs">
            Click a link to view the data received from it.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          {loading ? (
            <div className="py-8 text-center text-white/40 flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-gold" />
              Loading form links...
            </div>
          ) : forms.length === 0 ? (
            <div className="py-8 text-center text-white/40 text-sm">
              No form links yet. Build your first one above.
            </div>
          ) : (
            forms.map((form) => (
              <div key={form.id} className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
                <div className="p-4 flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white">{form.name}</h3>
                      <span className="text-[10px] font-bold bg-gold/15 text-gold border border-gold/30 px-2 py-0.5 rounded-full">
                        {form.submissionCount} responses
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                        form.active
                          ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                          : "bg-white/5 text-white/40 border-white/10"
                      }`}>
                        {form.active ? "Live" : "Closed"}
                      </span>
                    </div>
                    <code className="text-[11px] text-gold/80 break-all">{form.url}</code>
                    <p className="text-[10px] text-white/40">
                      {form.fields.length} fields • Created{" "}
                      {new Date(form.created_at).toLocaleDateString("en-IN")}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Button
                      onClick={() => copyLink(form.url)}
                      variant="outline"
                      className="h-8 text-xs border-white/15 text-white/80 hover:text-white rounded-lg flex items-center gap-1.5"
                    >
                      <Copy className="h-3.5 w-3.5" /> Copy
                    </Button>
                    <Button
                      onClick={() => toggleActive(form.id, !form.active)}
                      variant="ghost"
                      className="h-8 text-xs text-white/60 hover:text-white rounded-lg flex items-center gap-1.5"
                      title={form.active ? "Close form" : "Open form"}
                    >
                      {form.active ? <ToggleRight className="h-4 w-4 text-emerald-400" /> : <ToggleLeft className="h-4 w-4 text-white/40" />}
                      {form.active ? "Open" : "Closed"}
                    </Button>
                    <Button
                      onClick={() => openSubmissions(form)}
                      className="h-8 text-xs bg-gold text-gold-foreground hover:bg-gold/90 font-semibold rounded-lg flex items-center gap-1.5"
                    >
                      {openSubsId === form.id ? <X className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      {openSubsId === form.id ? "Close" : "View Data"}
                    </Button>
                    <Button
                      onClick={() => deleteForm(form.id)}
                      variant="ghost"
                      className="h-8 w-8 text-red-400/70 hover:text-red-300 hover:bg-red-500/10 rounded-lg p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Submissions drawer */}
                <AnimatePresence>
                  {openSubsId === form.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-white/5 bg-black/30">
                        <div className="p-3 flex items-center justify-between">
                          <span className="text-xs text-white/50">
                            {subsForm?.name} — {subs.length} response{subs.length === 1 ? "" : "s"}
                          </span>
                          <Button
                            onClick={exportExcel}
                            disabled={subs.length === 0}
                            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center gap-1.5"
                          >
                            <FileSpreadsheet className="h-3.5 w-3.5" />
                            Download Excel
                          </Button>
                        </div>
                        {subsLoading ? (
                          <div className="p-6 text-center text-white/40 text-xs flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-gold" />
                            Loading responses...
                          </div>
                        ) : subs.length === 0 ? (
                          <div className="p-6 text-center text-white/40 text-xs">
                            No responses yet. Share the link to start collecting data.
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm border-collapse">
                              <thead>
                                <tr className="border-b border-white/5 text-white/55 text-[10px] font-semibold uppercase tracking-wider bg-white/[0.01]">
                                  <th className="py-2.5 px-4">Submitted</th>
                                  {(subsForm?.fields || []).map((f) => (
                                    <th key={f.key} className="py-2.5 px-4">{f.label}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                {subs.map((s) => (
                                  <tr key={s.id} className="hover:bg-white/[0.02]">
                                    <td className="py-2.5 px-4 text-white/40 text-[11px] whitespace-nowrap">
                                      {new Date(s.created_at).toLocaleString("en-IN", {
                                        dateStyle: "medium",
                                        timeStyle: "short",
                                      })}
                                    </td>
                                    {(subsForm?.fields || []).map((f) => (
                                      <td key={f.key} className="py-2.5 px-4 text-white/80 text-xs max-w-[220px] truncate" title={s.data?.[f.key]}>
                                        {s.data?.[f.key] || "—"}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
