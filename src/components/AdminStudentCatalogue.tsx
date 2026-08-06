"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Loader2,
  Check,
  AlertCircle,
  Search,
  Trash2,
  Pencil,
  Save,
  X,
  Users,
  Phone,
  Coins,
  IndianRupee,
  FileSpreadsheet,
  BookUser,
} from "lucide-react";
import * as XLSX from "xlsx";

interface CatalogueStudent {
  id: string;
  name: string;
  phone: string | null;
  group_name: string | null;
  fee_amount: number | null;
  amount_paid: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const GROUPS = ["Batch 1", "Batch 2", "Batch 3", "Batch 4", "Batch 5", "Batch 6"];

const INR = (v: number | null | undefined) =>
  "₹" + (Number(v) || 0).toLocaleString("en-IN");

export default function AdminStudentCatalogue() {
  const [students, setStudents] = useState<CatalogueStudent[]>([]);
  const [loading, setLoading] = useState(true);

  // Search + filter
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");

  // Add form
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [groupName, setGroupName] = useState("");
  const [feeAmount, setFeeAmount] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formResult, setFormResult] = useState<string | null>(null);

  // Edit state (inline row editing)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editGroup, setEditGroup] = useState("");
  const [editFee, setEditFee] = useState("");
  const [editPaid, setEditPaid] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const authHeader = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token || ""}` };
  }, []);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/catalogue", {
        cache: "no-store",
        headers: await authHeader(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load catalogue");
      setStudents(data.students || []);
    } catch (err) {
      console.error("Fetch catalogue error:", err);
    } finally {
      setLoading(false);
    }
  }, [authHeader]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const resetForm = () => {
    setName("");
    setPhone("");
    setGroupName("");
    setFeeAmount("");
    setAmountPaid("");
    setNotes("");
    setFormError(null);
    setFormResult(null);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormResult(null);
    if (!name.trim()) {
      setFormError("Student name is required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/catalogue", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeader()) },
        body: JSON.stringify({
          name,
          phone,
          group_name: groupName || null,
          fee_amount: feeAmount,
          amount_paid: amountPaid,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add student");
      setFormResult(`Added ${data.student.name} to the catalogue.`);
      resetForm();
      setShowForm(false);
      await fetchStudents();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not add student.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (s: CatalogueStudent) => {
    setEditingId(s.id);
    setEditName(s.name);
    setEditPhone(s.phone || "");
    setEditGroup(s.group_name || "");
    setEditFee(s.fee_amount != null ? String(s.fee_amount) : "");
    setEditPaid(s.amount_paid != null ? String(s.amount_paid) : "");
    setEditNotes(s.notes || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (s: CatalogueStudent) => {
    setEditSaving(true);
    try {
      const res = await fetch("/api/admin/catalogue", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(await authHeader()) },
        body: JSON.stringify({
          id: s.id,
          name: editName,
          phone: editPhone,
          group_name: editGroup || null,
          fee_amount: editFee,
          amount_paid: editPaid,
          notes: editNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save changes");
      setStudents((prev) => prev.map((x) => (x.id === s.id ? data.student : x)));
      setEditingId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not save changes.");
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (id: string, studentName: string) => {
    if (!confirm(`Remove "${studentName}" from the catalogue? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/catalogue?id=${id}`, {
        method: "DELETE",
        headers: await authHeader(),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
      setStudents((prev) => prev.filter((x) => x.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not delete.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportExcel = () => {
    const rows = filtered.map((s) => {
      const fee = Number(s.fee_amount) || 0;
      const paid = Number(s.amount_paid) || 0;
      const balance = Math.max(0, fee - paid);
      const status =
        fee > 0 && paid >= fee ? "FULL PAID" : paid > 0 ? "PARTIAL" : "UNPAID";
      return {
        "Student Name": s.name,
        "Phone Number": s.phone || "",
        Group: s.group_name || "",
        "Total Fee (₹)": fee,
        "Amount Paid (₹)": paid,
        "Balance (₹)": balance,
        "Payment Status": status,
        "Notes / Messages": s.notes || "",
        "Added On": new Date(s.created_at).toLocaleDateString("en-IN"),
      };
    });

    if (rows.length === 0) {
      alert("No students to export.");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Student Catalogue");
    XLSX.writeFile(
      workbook,
      `Prime_Strike_Catalogue_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const filtered = students.filter((s) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      (s.phone || "").toLowerCase().includes(q) ||
      (s.notes || "").toLowerCase().includes(q);
    const matchesGroup = groupFilter === "all" || s.group_name === groupFilter;
    return matchesSearch && matchesGroup;
  });

  // Summary stats
  const totalCollected = students.reduce(
    (acc, s) => acc + (Number(s.amount_paid) || 0),
    0
  );
  const totalFee = students.reduce(
    (acc, s) => acc + (Number(s.fee_amount) || 0),
    0
  );
  const outstanding = Math.max(0, totalFee - totalCollected);
  const fullPaidCount = students.filter(
    (s) => Number(s.fee_amount) > 0 && Number(s.amount_paid) >= Number(s.fee_amount)
  ).length;

  return (
    <div className="space-y-6">
      {/* Summary strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Students", value: String(students.length), icon: Users, color: "text-gold" },
          { label: "Collected", value: INR(totalCollected), icon: IndianRupee, color: "text-emerald-400" },
          { label: "Outstanding", value: INR(outstanding), icon: Coins, color: "text-amber-400" },
          { label: "Full Paid", value: `${fullPaidCount}/${students.length}`, icon: Check, color: "text-blue-400" },
        ].map((stat) => (
          <Card key={stat.label} className="border border-white/10 bg-neutral-950/80 backdrop-blur-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2.5 rounded-xl bg-white/5 border border-white/10 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">{stat.label}</p>
                <p className="text-lg font-bold text-white">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border border-white/10 bg-neutral-950/80 backdrop-blur-md">
        <CardHeader className="border-b border-white/5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-md font-bold flex items-center gap-2 text-white font-[family-name:var(--font-poppins)]">
              <BookUser className="h-4.5 w-4.5 text-gold" />
              Student Catalogue ({students.length})
            </CardTitle>
            <CardDescription className="text-white/50 text-xs">
              Your personal directory — add names, phone numbers, group and payments. Only you can see and edit this.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setShowForm((v) => !v)}
              className="h-9 text-xs bg-gold text-gold-foreground hover:bg-gold/90 font-semibold rounded-lg flex items-center gap-1.5 transition-all"
            >
              {showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              {showForm ? "Close Form" : "Add Student"}
            </Button>
            <Button
              onClick={handleExportExcel}
              className="h-9 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center gap-1.5 transition-all"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Download Excel (.xlsx)
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {/* Add form */}
          {showForm && (
            <div className="rounded-xl border border-gold/20 bg-gold/5 p-4">
              <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {formError && (
                  <div className="md:col-span-2 lg:col-span-3 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}
                {formResult && (
                  <div className="md:col-span-2 lg:col-span-3 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0" />
                    <span>{formResult}</span>
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">Student Name *</label>
                  <Input
                    type="text"
                    placeholder="e.g. Mahesh Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-10 text-sm"
                    disabled={saving}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">Phone Number</label>
                  <Input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-10 text-sm"
                    disabled={saving}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">Group / Batch</label>
                  <select
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full bg-neutral-900 border border-white/10 rounded-lg text-white h-10 px-3 text-xs outline-none focus:border-gold/50"
                    disabled={saving}
                  >
                    <option value="" className="bg-neutral-900">— Select group —</option>
                    {GROUPS.map((g) => (
                      <option key={g} value={g} className="bg-neutral-900">{g}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">Total Fee (₹)</label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="25000"
                    value={feeAmount}
                    onChange={(e) => setFeeAmount(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-10 text-sm"
                    disabled={saving}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">Amount Paid (₹)</label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="10000"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-10 text-sm"
                    disabled={saving}
                  />
                </div>
                <div className="space-y-1 md:col-span-2 lg:col-span-3">
                  <label className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">Notes / Messages</label>
                  <Textarea
                    placeholder="What they sent, payment reminders, remarks..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[60px] text-xs resize-none"
                    disabled={saving}
                  />
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="h-10 bg-gold text-gold-foreground hover:bg-gold/90 font-semibold text-sm rounded-lg flex items-center justify-center gap-1.5 transition-all"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Add to Catalogue
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Search + group filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <Input
                type="text"
                placeholder="Search by name, phone or notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-10 pl-9 text-sm"
              />
            </div>
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="bg-neutral-900 border border-white/10 rounded-lg text-white h-10 px-3 text-xs outline-none focus:border-gold/50 cursor-pointer"
            >
              <option value="all" className="bg-neutral-900">All Groups</option>
              {GROUPS.map((g) => (
                <option key={g} value={g} className="bg-neutral-900">{g}</option>
              ))}
            </select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="py-12 text-center text-white/40 flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-gold" />
              Loading catalogue...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-white/40 border border-dashed border-white/10 rounded-2xl">
              {students.length === 0
                ? "No students yet. Click “Add Student” to start your catalogue."
                : "No students match your search/filter."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-white/55 text-[10px] font-semibold uppercase tracking-wider bg-white/[0.01]">
                    <th className="py-2.5 px-4">Student</th>
                    <th className="py-2.5 px-4">Phone</th>
                    <th className="py-2.5 px-4">Group</th>
                    <th className="py-2.5 px-4">Fee & Payment</th>
                    <th className="py-2.5 px-4">Notes / Messages</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map((s) => {
                    const fee = Number(s.fee_amount) || 0;
                    const paid = Number(s.amount_paid) || 0;
                    const balance = Math.max(0, fee - paid);
                    const status =
                      fee > 0 && paid >= fee ? "FULL PAID" : paid > 0 ? "PARTIAL" : "UNPAID";
                    const isEditing = editingId === s.id;

                    if (isEditing) {
                      return (
                        <tr key={s.id} className="bg-gold/5">
                          <td className="py-3 px-4">
                            <Input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="bg-white/5 border-white/10 text-white h-9 text-xs"
                              disabled={editSaving}
                            />
                          </td>
                          <td className="py-3 px-4">
                            <Input
                              type="tel"
                              value={editPhone}
                              onChange={(e) => setEditPhone(e.target.value)}
                              className="bg-white/5 border-white/10 text-white h-9 text-xs"
                              disabled={editSaving}
                            />
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={editGroup}
                              onChange={(e) => setEditGroup(e.target.value)}
                              className="w-full bg-neutral-900 border border-white/10 rounded-lg text-white h-9 px-2 text-xs outline-none focus:border-gold/50"
                              disabled={editSaving}
                            >
                              <option value="" className="bg-neutral-900">—</option>
                              {GROUPS.map((g) => (
                                <option key={g} value={g} className="bg-neutral-900">{g}</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-3 px-4 space-y-1">
                            <Input
                              type="number"
                              min={0}
                              placeholder="Fee"
                              value={editFee}
                              onChange={(e) => setEditFee(e.target.value)}
                              className="bg-white/5 border-white/10 text-white h-9 text-xs"
                              disabled={editSaving}
                            />
                            <Input
                              type="number"
                              min={0}
                              placeholder="Paid"
                              value={editPaid}
                              onChange={(e) => setEditPaid(e.target.value)}
                              className="bg-white/5 border-white/10 text-white h-9 text-xs"
                              disabled={editSaving}
                            />
                          </td>
                          <td className="py-3 px-4">
                            <Input
                              type="text"
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              className="bg-white/5 border-white/10 text-white h-9 text-xs"
                              disabled={editSaving}
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex justify-end items-center gap-1.5">
                              <Button
                                onClick={() => handleSaveEdit(s)}
                                disabled={editSaving}
                                className="h-8 text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg px-3 flex items-center gap-1"
                              >
                                {editSaving ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Save className="h-3.5 w-3.5" />
                                )}
                                Save
                              </Button>
                              <Button
                                onClick={cancelEdit}
                                disabled={editSaving}
                                variant="ghost"
                                className="h-8 text-[11px] text-white/60 hover:text-white hover:bg-white/5 rounded-lg px-3"
                              >
                                Cancel
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={s.id} className="hover:bg-white/[0.02] transition-all">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white text-sm">{s.name}</div>
                          <div className="text-[10px] text-white/35">
                            Added {new Date(s.created_at).toLocaleDateString("en-IN")}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {s.phone ? (
                            <a
                              href={`https://wa.me/${s.phone.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-white/80 hover:text-gold transition-colors"
                              title="Open WhatsApp chat"
                            >
                              <Phone className="h-3.5 w-3.5 text-gold shrink-0" />
                              {s.phone}
                            </a>
                          ) : (
                            <span className="text-white/30 text-xs">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {s.group_name ? (
                            <span className="text-[10px] font-bold bg-gold/15 text-gold border border-gold/30 px-2 py-1 rounded-full">
                              {s.group_name}
                            </span>
                          ) : (
                            <span className="text-white/30 text-xs">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 space-y-1">
                          {fee > 0 && (
                            <div className="text-[11px] text-white/50">
                              Fee: <span className="text-white font-semibold">{INR(fee)}</span>
                            </div>
                          )}
                          <div className="text-[11px] text-white/80">
                            Paid: <span className="text-emerald-400 font-bold">{INR(paid)}</span>
                          </div>
                          {fee > 0 && (
                            <div className="text-[11px]">
                              <span className="text-white/40">Balance: </span>
                              <span className={`font-bold ${balance > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                                {INR(balance)}
                              </span>
                            </div>
                          )}
                          <div className="pt-0.5">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                              status === "FULL PAID"
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                : status === "PARTIAL"
                                ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                            }`}>
                              {status}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 max-w-[200px]">
                          {s.notes ? (
                            <p className="text-xs text-white/70 line-clamp-2" title={s.notes}>
                              {s.notes}
                            </p>
                          ) : (
                            <span className="text-white/30 text-xs">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end items-center gap-1.5">
                            <Button
                              onClick={() => startEdit(s)}
                              variant="ghost"
                              className="text-gold hover:text-gold hover:bg-gold/10 p-2 h-8 w-8 rounded-lg transition-all"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleDelete(s.id, s.name)}
                              disabled={deletingId === s.id}
                              variant="ghost"
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 h-8 w-8 rounded-lg transition-all"
                              title="Delete"
                            >
                              {deletingId === s.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
