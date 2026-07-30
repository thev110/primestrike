"use client";

import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Trash2, 
  Download, 
  FileCheck, 
  Clock, 
  MessageSquare,
  RefreshCw,
  FileCode,
  Image as ImageIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface HomeworkSubmission {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  submission_date: string;
  file_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  notes?: string;
  status: "submitted" | "reviewed" | "resubmitted";
  mentor_feedback?: string;
  created_at: string;
  updated_at: string;
}

interface HomeworkUploadProps {
  selectedDate: Date;
  userId: string;
  userEmail?: string;
  userName?: string;
  onSubmissionChange?: () => void;
}

export default function HomeworkUpload({
  selectedDate,
  userId,
  userEmail = "",
  userName = "",
  onSubmissionChange
}: HomeworkUploadProps) {
  const formattedDate = selectedDate.toISOString().split("T")[0];
  const dateDisplay = selectedDate.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const [submission, setSubmission] = useState<HomeworkSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch homework submission for selected date
  const fetchSubmission = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      
      const { data, error } = await supabase
        .from("homework_submissions")
        .select("*")
        .eq("user_id", userId)
        .eq("submission_date", formattedDate)
        .maybeSingle();

      if (error) {
        console.error("Error fetching submission:", error);
      } else if (data) {
        setSubmission(data as HomeworkSubmission);
        setNotes(data.notes || "");
      } else {
        setSubmission(null);
        setNotes("");
      }
    } catch (err) {
      console.error("Fetch exception:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId && formattedDate) {
      setFile(null);
      setSuccessMessage(null);
      setErrorMessage(null);
      fetchSubmission();
    }
  }, [userId, formattedDate]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    setErrorMessage(null);

    // Max 20MB limit
    if (selectedFile.size > 20 * 1024 * 1024) {
      setErrorMessage("File size exceeds 20 MB. Please upload a smaller file.");
      return;
    }

    setFile(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMessage("Please select a homework file to upload.");
      return;
    }

    try {
      setUploading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      // Clean filename for storage path
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const storagePath = `${userId}/${formattedDate}_${Date.now()}_${sanitizedName}`;

      // 1. Upload to Supabase Storage Bucket
      const { error: storageError } = await supabase.storage
        .from("homework-submissions")
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: true
        });

      if (storageError) {
        throw new Error(`Storage upload error: ${storageError.message}`);
      }

      // 2. Insert or Update DB row
      const payload = {
        user_id: userId,
        user_email: userEmail,
        user_name: userName,
        submission_date: formattedDate,
        file_path: storagePath,
        file_name: file.name,
        file_type: file.type || "application/octet-stream",
        file_size: file.size,
        notes: notes.trim(),
        status: submission ? "resubmitted" : "submitted",
        updated_at: new Date().toISOString()
      };

      const { data: dbData, error: dbError } = await supabase
        .from("homework_submissions")
        .upsert(payload, { onConflict: "user_id,submission_date" })
        .select()
        .single();

      if (dbError) {
        throw new Error(`Database record error: ${dbError.message}`);
      }

      setSubmission(dbData as HomeworkSubmission);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSuccessMessage("Homework submitted successfully!");
      if (onSubmissionChange) onSubmissionChange();

    } catch (err: any) {
      console.error("Upload error:", err);
      setErrorMessage(err.message || "Failed to upload homework. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async () => {
    if (!submission) return;
    try {
      setDownloading(true);
      const { data, error } = await supabase.storage
        .from("homework-submissions")
        .createSignedUrl(submission.file_path, 60);

      if (error || !data?.signedUrl) {
        alert("Could not generate download link: " + (error?.message || "File not found"));
        return;
      }

      window.open(data.signedUrl, "_blank");
    } catch (err) {
      console.error("Download error:", err);
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (!submission) return;
    if (!confirm("Are you sure you want to remove your homework submission for this date?")) return;

    try {
      setDeleting(true);
      
      // Delete file from storage
      await supabase.storage
        .from("homework-submissions")
        .remove([submission.file_path]);

      // Delete record from DB
      const { error } = await supabase
        .from("homework_submissions")
        .delete()
        .eq("id", submission.id);

      if (error) {
        alert("Error deleting record: " + error.message);
        return;
      }

      setSubmission(null);
      setNotes("");
      setSuccessMessage("Submission deleted.");
      if (onSubmissionChange) onSubmissionChange();
    } catch (err) {
      console.error("Delete exception:", err);
    } finally {
      setDeleting(false);
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
      return <FileText className="h-6 w-6 text-red-400" />;
    }
    if (fileType.includes("image") || /\.(png|jpe?g|webp)$/i.test(fileName)) {
      return <ImageIcon className="h-6 w-6 text-emerald-400" />;
    }
    return <FileCode className="h-6 w-6 text-blue-400" />;
  };

  return (
    <Card className="border border-white/10 bg-neutral-950/80 backdrop-blur-md">
      <CardHeader className="border-b border-white/5 py-4 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-md font-bold flex items-center gap-2 text-white font-[family-name:var(--font-poppins)]">
            <UploadCloud className="h-5 w-5 text-gold" />
            Daily Homework Upload
          </CardTitle>
          <CardDescription className="text-white/50 text-xs mt-0.5">
            {dateDisplay}
          </CardDescription>
        </div>

        {submission && (
          <span className="text-[11px] font-semibold tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Submitted
          </span>
        )}
      </CardHeader>

      <CardContent className="pt-6 space-y-5">
        {loading ? (
          <div className="py-8 flex flex-col items-center justify-center text-white/40 text-xs">
            <Loader2 className="h-5 w-5 animate-spin text-gold mb-2" />
            Checking homework status...
          </div>
        ) : (
          <>
            {/* Status alerts */}
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              </motion.div>
            )}

            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-xs flex items-center gap-2"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </motion.div>
            )}

            {/* Existing Submission Display Card */}
            {submission ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-neutral-900 border border-white/10 flex items-center justify-center shrink-0">
                        {getFileIcon(submission.file_type, submission.file_name)}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white truncate max-w-[220px] sm:max-w-[320px]">
                          {submission.file_name}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-white/40 mt-0.5">
                          <span>{formatFileSize(submission.file_size)}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-gold" />
                            {new Date(submission.updated_at).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        onClick={handleDownload}
                        disabled={downloading}
                        variant="ghost"
                        size="sm"
                        className="text-gold hover:text-gold hover:bg-gold/10 h-8 px-2.5 text-xs rounded-lg flex items-center gap-1.5"
                      >
                        {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                        Download
                      </Button>

                      <Button
                        onClick={handleDelete}
                        disabled={deleting}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 p-0 rounded-lg"
                      >
                        {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </div>

                  {submission.notes && (
                    <div className="pt-2 border-t border-white/5 text-xs text-white/70">
                      <span className="text-[10px] uppercase tracking-wider text-white/40 font-semibold block mb-0.5">
                        Student Notes:
                      </span>
                      <p className="bg-black/30 p-2.5 rounded-lg border border-white/5 whitespace-pre-wrap">
                        {submission.notes}
                      </p>
                    </div>
                  )}

                  {submission.mentor_feedback && (
                    <div className="pt-2 border-t border-white/5 text-xs">
                      <span className="text-[10px] uppercase tracking-wider text-gold font-semibold flex items-center gap-1 mb-1">
                        <MessageSquare className="h-3 w-3" />
                        Mentor Feedback:
                      </span>
                      <p className="bg-gold/10 border border-gold/20 p-2.5 rounded-lg text-gold-foreground font-medium">
                        {submission.mentor_feedback}
                      </p>
                    </div>
                  )}
                </div>

                {/* Option to Replace Homework */}
                <div className="pt-2">
                  <p className="text-xs text-white/50 mb-3 flex items-center gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5 text-gold" />
                    Want to update or re-upload your homework for {dateDisplay}?
                  </p>

                  <form onSubmit={handleUpload} className="space-y-3">
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`p-4 border-2 border-dashed rounded-xl cursor-pointer text-center transition-all ${
                        isDragOver 
                          ? "border-gold bg-gold/10" 
                          : file 
                          ? "border-emerald-500/50 bg-emerald-500/5" 
                          : "border-white/10 hover:border-white/20 bg-white/[0.01]"
                      }`}
                    >
                      <input 
                        ref={fileInputRef}
                        type="file" 
                        accept=".pdf,.txt,.doc,.docx,.png,.jpg,.jpeg,.webp"
                        onChange={handleFileSelect}
                        className="hidden" 
                      />
                      {file ? (
                        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-400">
                          <FileCheck className="h-4 w-4" />
                          <span>Selected: {file.name} ({formatFileSize(file.size)})</span>
                        </div>
                      ) : (
                        <div className="text-xs text-white/50 space-y-1">
                          <UploadCloud className="h-5 w-5 text-white/40 mx-auto" />
                          <p>Click or drag new PDF, DOC, or TXT file to replace</p>
                        </div>
                      )}
                    </div>

                    {file && (
                      <div className="space-y-3">
                        <Textarea
                          placeholder="Optional notes or questions for mentor..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="bg-white/5 border-white/10 text-white text-xs min-h-[70px] resize-none"
                        />
                        <Button
                          type="submit"
                          disabled={uploading}
                          className="w-full bg-gold text-gold-foreground hover:bg-gold/90 h-9 font-semibold text-xs rounded-lg flex items-center justify-center gap-2"
                        >
                          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                          Replace Homework Submission
                        </Button>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            ) : (
              /* New Homework Upload Form */
              <form onSubmit={handleUpload} className="space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`p-6 border-2 border-dashed rounded-xl cursor-pointer text-center transition-all ${
                    isDragOver 
                      ? "border-gold bg-gold/10" 
                      : file 
                      ? "border-gold/50 bg-gold/5" 
                      : "border-white/10 hover:border-white/30 bg-neutral-900/40"
                  }`}
                >
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept=".pdf,.txt,.doc,.docx,.png,.jpg,.jpeg,.webp"
                    onChange={handleFileSelect}
                    className="hidden" 
                  />

                  {file ? (
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto text-gold">
                        <FileCheck className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-semibold text-white">{file.name}</p>
                      <p className="text-xs text-gold font-medium">{formatFileSize(file.size)}</p>
                      <p className="text-[11px] text-white/40">Click to choose a different file</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-gold">
                        <UploadCloud className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          Click to browse or drag and drop your daily homework
                        </p>
                        <p className="text-xs text-white/40 mt-1">
                          Supports PDF, Word Documents (.doc, .docx), Text (.txt), or Images (Max 20MB)
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">
                    Submission Notes / Comments (Optional)
                  </label>
                  <Textarea
                    placeholder="Add trade journal notes, strategy observations, or questions for your mentor..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="bg-white/5 border-white/10 text-white text-xs min-h-[80px] placeholder:text-white/30 resize-none rounded-xl"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={uploading || !file}
                  className="w-full bg-gold text-gold-foreground hover:bg-gold/90 h-11 font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-gold/10"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading Homework...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="h-4 w-4" />
                      Submit Daily Homework
                    </>
                  )}
                </Button>
              </form>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
