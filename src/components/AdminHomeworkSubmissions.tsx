"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  FileText, 
  Search, 
  Download, 
  CheckCircle2, 
  Clock, 
  User, 
  Calendar, 
  MessageSquare, 
  Loader2, 
  Filter, 
  Send, 
  RefreshCw,
  FileCode,
  Image as ImageIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { HomeworkSubmission } from "./HomeworkUpload";

export default function AdminHomeworkSubmissions() {
  const [submissions, setSubmissions] = useState<HomeworkSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDateFilter, setSelectedDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "submitted" | "reviewed">("all");

  // Feedback Modal / Drawer state
  const [selectedSub, setSelectedSub] = useState<HomeworkSubmission | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchAllSubmissions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("homework_submissions")
        .select("*")
        .order("submission_date", { ascending: false });

      if (error) {
        console.error("Error fetching homework submissions:", error);
      } else if (data) {
        setSubmissions(data as HomeworkSubmission[]);
      }
    } catch (err) {
      console.error("Fetch exception:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllSubmissions();
  }, []);

  const handleDownload = async (sub: HomeworkSubmission) => {
    try {
      setDownloadingId(sub.id);
      const { data, error } = await supabase.storage
        .from("homework-submissions")
        .createSignedUrl(sub.file_path, 60);

      if (error || !data?.signedUrl) {
        alert("Could not generate download link: " + (error?.message || "File not found"));
        return;
      }

      window.open(data.signedUrl, "_blank");
    } catch (err) {
      console.error("Download error:", err);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleOpenFeedbackModal = (sub: HomeworkSubmission) => {
    setSelectedSub(sub);
    setFeedbackText(sub.mentor_feedback || "");
  };

  const handleSaveFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;

    try {
      setSavingFeedback(true);
      const { error } = await supabase
        .from("homework_submissions")
        .update({
          mentor_feedback: feedbackText.trim(),
          status: "reviewed",
          updated_at: new Date().toISOString()
        })
        .eq("id", selectedSub.id);

      if (error) {
        alert("Failed to save feedback: " + error.message);
        return;
      }

      // Refresh local state
      await fetchAllSubmissions();
      setSelectedSub(null);
    } catch (err) {
      console.error("Save feedback exception:", err);
    } finally {
      setSavingFeedback(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (fileType: string, fileName: string) => {
    if (fileType.includes("pdf") || fileName.endsWith(".pdf")) {
      return <FileText className="h-5 w-5 text-red-400" />;
    }
    if (fileType.includes("image") || /\.(png|jpe?g|webp)$/i.test(fileName)) {
      return <ImageIcon className="h-5 w-5 text-emerald-400" />;
    }
    return <FileCode className="h-5 w-5 text-blue-400" />;
  };

  // Filtered List
  const filteredSubmissions = submissions.filter((sub) => {
    const matchesQuery = 
      (sub.user_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.user_email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.file_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.notes || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDate = !selectedDateFilter || sub.submission_date === selectedDateFilter;
    const matchesStatus = statusFilter === "all" || sub.status === statusFilter;

    return matchesQuery && matchesDate && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <Card className="border border-white/10 bg-neutral-950/80 backdrop-blur-md">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                type="text"
                placeholder="Search student name, email, file..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/5 border-white/10 text-white pl-9 h-10 text-xs rounded-xl"
              />
            </div>

            {/* Date and Status Filters */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gold shrink-0" />
                <Input
                  type="date"
                  value={selectedDateFilter}
                  onChange={(e) => setSelectedDateFilter(e.target.value)}
                  style={{ colorScheme: "dark" }}
                  className="bg-white/5 border-white/10 text-white h-10 text-xs rounded-xl [color-scheme:dark]"
                />
                {selectedDateFilter && (
                  <Button
                    onClick={() => setSelectedDateFilter("")}
                    variant="ghost"
                    size="sm"
                    className="text-xs text-white/50 hover:text-white"
                  >
                    Clear
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-1 bg-white/5 border border-white/10 p-1 rounded-xl">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === "all" ? "bg-gold text-gold-foreground" : "text-white/60 hover:text-white"
                  }`}
                >
                  All ({submissions.length})
                </button>
                <button
                  onClick={() => setStatusFilter("submitted")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === "submitted" ? "bg-gold text-gold-foreground" : "text-white/60 hover:text-white"
                  }`}
                >
                  Pending ({submissions.filter((s) => s.status !== "reviewed").length})
                </button>
                <button
                  onClick={() => setStatusFilter("reviewed")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === "reviewed" ? "bg-gold text-gold-foreground" : "text-white/60 hover:text-white"
                  }`}
                >
                  Reviewed ({submissions.filter((s) => s.status === "reviewed").length})
                </button>
              </div>

              <Button
                onClick={fetchAllSubmissions}
                variant="outline"
                size="sm"
                className="border-white/10 text-white/70 hover:text-white h-10 px-3 rounded-xl"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submissions List */}
      <Card className="border border-white/10 bg-neutral-950/80 backdrop-blur-md">
        <CardHeader className="border-b border-white/5 py-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-md font-bold text-white font-[family-name:var(--font-poppins)]">
              Student Homework Submissions
            </CardTitle>
            <CardDescription className="text-white/50 text-xs">
              Showing {filteredSubmissions.length} submission{filteredSubmissions.length !== 1 ? "s" : ""}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-white/40">
              <Loader2 className="h-6 w-6 animate-spin text-gold mb-2" />
              Loading student submissions...
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="py-12 text-center text-white/40 text-sm">
              No homework submissions found matching criteria.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSubmissions.map((sub) => (
                <div 
                  key={sub.id} 
                  className="p-5 rounded-xl border border-white/10 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left Column: Student & File Info */}
                  <div className="space-y-2 max-w-xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-white bg-white/10 px-2.5 py-0.5 rounded-md flex items-center gap-1.5">
                        <User className="h-3 w-3 text-gold" />
                        {sub.user_name || sub.user_email || "Student"}
                      </span>

                      <span className="text-xs text-white/50 flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-gold" />
                        {sub.submission_date}
                      </span>

                      {sub.status === "reviewed" ? (
                        <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Reviewed
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Needs Feedback
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-white/10 flex items-center justify-center shrink-0">
                        {getFileIcon(sub.file_type, sub.file_name)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white truncate max-w-[280px] sm:max-w-[400px]">
                          {sub.file_name}
                        </p>
                        <p className="text-[11px] text-white/40">
                          {formatFileSize(sub.file_size)} • Uploaded {new Date(sub.created_at).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>

                    {sub.notes && (
                      <div className="text-xs text-white/70 bg-black/40 p-2.5 rounded-lg border border-white/5">
                        <span className="text-[10px] uppercase text-white/40 font-semibold block mb-0.5">
                          Student Notes:
                        </span>
                        {sub.notes}
                      </div>
                    )}

                    {sub.mentor_feedback && (
                      <div className="text-xs text-gold bg-gold/10 p-2.5 rounded-lg border border-gold/20">
                        <span className="text-[10px] uppercase text-gold font-semibold flex items-center gap-1 mb-0.5">
                          <MessageSquare className="h-3 w-3" />
                          Mentor Feedback:
                        </span>
                        {sub.mentor_feedback}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <Button
                      onClick={() => handleDownload(sub)}
                      disabled={downloadingId === sub.id}
                      variant="outline"
                      className="border-white/10 text-white hover:bg-white/10 h-9 px-3 text-xs rounded-lg flex items-center gap-1.5"
                    >
                      {downloadingId === sub.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5 text-gold" />
                      )}
                      Download File
                    </Button>

                    <Button
                      onClick={() => handleOpenFeedbackModal(sub)}
                      className="bg-gold text-gold-foreground hover:bg-gold/90 h-9 px-3 text-xs font-semibold rounded-lg flex items-center gap-1.5"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      {sub.mentor_feedback ? "Edit Feedback" : "Add Feedback"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mentor Feedback Modal — portaled to <body> so it escapes the animated tab wrapper. */}
      <AnimatePresence>
        {selectedSub &&
          createPortal(
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-950 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4 p-6"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <MessageSquare className="h-4.5 w-4.5 text-gold" />
                  Mentor Feedback for {selectedSub.user_name || selectedSub.user_email}
                </h3>
                <button
                  onClick={() => setSelectedSub(null)}
                  className="text-white/40 hover:text-white text-xs font-bold p-1"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-white/5 rounded-xl space-y-1">
                  <p className="text-white/60">
                    <strong className="text-white">Submission Date:</strong> {selectedSub.submission_date}
                  </p>
                  <p className="text-white/60">
                    <strong className="text-white">File:</strong> {selectedSub.file_name}
                  </p>
                </div>

                <form onSubmit={handleSaveFeedback} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">
                      Feedback & Recommendations
                    </label>
                    <Textarea
                      placeholder="Write constructive notes for the student..."
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      className="bg-white/5 border-white/10 text-white min-h-[110px] text-xs resize-none rounded-xl"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Button
                      type="button"
                      onClick={() => setSelectedSub(null)}
                      variant="ghost"
                      className="text-white/60 hover:text-white h-10 text-xs rounded-xl"
                    >
                      Cancel
                    </Button>

                    <Button
                      type="submit"
                      disabled={savingFeedback}
                      className="bg-gold text-gold-foreground hover:bg-gold/90 h-10 px-5 text-xs font-bold rounded-xl flex items-center gap-2"
                    >
                      {savingFeedback ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Save & Mark Reviewed
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>,
            document.body
          )}
      </AnimatePresence>
    </div>
  );
}
