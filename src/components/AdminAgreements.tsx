"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileSignature,
  Loader2,
  Search,
  FileSpreadsheet,
  Camera,
  PenLine,
  X,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";

interface AgreementRow {
  id: string;
  email: string;
  name: string | null;
  address: string | null;
  phone: string | null;
  agreedAt: string;
  selfieUrl: string | null;
  signatureUrl: string | null;
}

export default function AdminAgreements() {
  const [agreements, setAgreements] = useState<AgreementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  // Image viewer modal
  const [viewer, setViewer] = useState<{ title: string; url: string } | null>(null);

  const authHeader = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token || ""}` };
  }, []);

  const load = useCallback(async (query = "") => {
    try {
      setLoading(true);
      setError("");
      const q = query ? `?search=${encodeURIComponent(query)}` : "";
      const res = await fetch(`/api/admin/agreements${q}`, { headers: await authHeader() });
      const j = await res.json().catch(() => ({}));
      if (res.ok) setAgreements(j.agreements || []);
      else setError(j.error || "Failed to load agreements.");
    } finally {
      setLoading(false);
    }
  }, [authHeader]);

  useEffect(() => {
    load();
  }, [load]);

  const doSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load(search);
  };

  const exportExcel = () => {
    if (agreements.length === 0) {
      alert("No agreements to export.");
      return;
    }
    const data = agreements.map((a) => ({
      "Signed On": new Date(a.agreedAt).toLocaleString("en-IN"),
      Name: a.name || "",
      Email: a.email,
      Phone: a.phone || "",
      Address: a.address || "",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Agreements");
    XLSX.writeFile(wb, `Prime_Strike_Agreements_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <Card className="border border-white/10 bg-neutral-950/80 backdrop-blur-md">
        <CardHeader className="border-b border-white/5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-md font-bold flex items-center gap-2 text-white font-[family-name:var(--font-poppins)]">
              <FileSignature className="h-4.5 w-4.5 text-gold" />
              Signed Agreements ({agreements.length})
            </CardTitle>
            <CardDescription className="text-white/50 text-xs">
              Students who completed the digital learning agreement with photo + signature.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <form onSubmit={doSearch} className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name / email / phone..."
                  className="pl-9 bg-white/5 border-white/10 text-white h-9 text-xs w-52 placeholder:text-white/30"
                />
              </div>
              <Button type="submit" className="h-9 text-xs bg-white/10 hover:bg-white/20 text-white rounded-lg px-3">
                Search
              </Button>
            </form>
            <Button
              onClick={() => load()}
              variant="ghost"
              className="h-9 px-3 border border-white/10 text-white/70 hover:text-white rounded-lg"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              onClick={exportExcel}
              className="h-9 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center gap-1.5"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Download Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4 px-0">
          {error && (
            <div className="mx-4 mb-3 p-2.5 rounded-lg text-xs bg-red-500/10 border border-red-500/20 text-red-400">
              {error}
            </div>
          )}
          {loading ? (
            <div className="py-12 text-center text-white/40 flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-gold" />
              Loading agreements...
            </div>
          ) : agreements.length === 0 ? (
            <div className="py-12 text-center text-white/40 text-sm">
              No signed agreements yet. Students sign from their dashboard.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-white/55 text-[10px] font-semibold uppercase tracking-wider bg-white/[0.01]">
                    <th className="py-3 px-6">Student</th>
                    <th className="py-3 px-6">Contact</th>
                    <th className="py-3 px-6">Address</th>
                    <th className="py-3 px-6">Signed On</th>
                    <th className="py-3 px-6">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {agreements.map((a) => (
                    <tr key={a.id} className="hover:bg-white/[0.02] transition-all">
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-2.5">
                          {a.selfieUrl ? (
                            <button
                              onClick={() => setViewer({ title: "Identity Photo", url: a.selfieUrl! })}
                              className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 shrink-0 hover:border-gold/40 transition-all"
                            >
                              <img src={a.selfieUrl} alt="selfie" className="w-full h-full object-cover" />
                            </button>
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                              <Camera className="h-4 w-4 text-white/30" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-white">{a.name || "—"}</p>
                            <p className="text-[10px] text-emerald-400/80 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Verified signatory
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-6 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-white/80">
                          <Mail className="h-3.5 w-3.5 text-gold shrink-0" />
                          <a href={`mailto:${a.email}`} className="hover:underline hover:text-gold truncate max-w-[180px]">
                            {a.email}
                          </a>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-white/70">
                          <Phone className="h-3.5 w-3.5 text-gold shrink-0" />
                          {a.phone || "—"}
                        </div>
                      </td>
                      <td className="py-3.5 px-6 max-w-[200px]">
                        <p className="text-xs text-white/60 flex items-start gap-1.5 leading-relaxed">
                          <MapPin className="h-3.5 w-3.5 text-gold shrink-0 mt-0.5" />
                          <span className="line-clamp-2" title={a.address || ""}>{a.address || "—"}</span>
                        </p>
                      </td>
                      <td className="py-3.5 px-6 text-white/55 text-xs whitespace-nowrap">
                        {new Date(a.agreedAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="py-3.5 px-6">
                        <Button
                          onClick={() => a.signatureUrl && setViewer({ title: "Signature", url: a.signatureUrl })}
                          disabled={!a.signatureUrl}
                          variant="outline"
                          className="h-8 text-[11px] border-white/15 text-white/70 hover:text-white rounded-lg flex items-center gap-1.5"
                        >
                          <PenLine className="h-3.5 w-3.5 text-gold" />
                          View Signature
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image viewer modal */}
      <AnimatePresence>
        {viewer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setViewer(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-neutral-950 border border-white/10 rounded-2xl p-4 max-w-lg w-full"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white font-[family-name:var(--font-poppins)]">{viewer.title}</h3>
                <button
                  onClick={() => setViewer(null)}
                  className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <img src={viewer.url} alt={viewer.title} className="w-full rounded-xl border border-white/10" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
