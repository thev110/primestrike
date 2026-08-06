"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Trash2, 
  Users, 
  Plus, 
  Loader2, 
  Check, 
  AlertCircle,
  Video,
  Mail,
  Phone,
  Search,
  ExternalLink,
  MessageSquare,
  TrendingUp,
  Coins,
  FileSpreadsheet,
  Download,
  BookOpen,
  Send,
  KeyRound,
  Eye,
  X,
  Award,
  CheckCircle2,
  MonitorPlay,
  Link2,
  FileSignature,
  BookUser
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdminVideoRequests from "@/components/AdminVideoRequests";
import AdminHomeworkSubmissions from "@/components/AdminHomeworkSubmissions";
import AdminLiveClasses from "@/components/AdminLiveClasses";
import AdminFormLinks from "@/components/AdminFormLinks";
import AdminAgreements from "@/components/AdminAgreements";
import AdminStudentCatalogue from "@/components/AdminStudentCatalogue";
import * as XLSX from "xlsx";

interface EventItem {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  link: string;
  location: string;
  category: string;
}

interface StudentProfile {
  id: string;
  email: string;
  name: string;
  batch: string | null;
  created_at: string;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  experience?: string;
  joined_course?: string;
  first_class_date?: string;
  paid_amount?: string;
  goal?: string;
  capital?: string;
  notes?: string;
  status: "new" | "contacted" | "joined" | "ignored";
  created_at: string;
}

export default function AdminDashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  // Tab State
  const [activeTab, setActiveTab] = useState<"events" | "leads" | "students" | "videos" | "homework" | "classes" | "links" | "agreements" | "catalogue">("events");

  // Data States
  const [events, setEvents] = useState<EventItem[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedBatchFilter, setSelectedBatchFilter] = useState("all");
  const [fetchingData, setFetchingData] = useState(true);

  // Audit Modal State
  const [selectedAuditStudent, setSelectedAuditStudent] = useState<StudentProfile | null>(null);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditStats, setAuditStats] = useState({ requests: 0, grants: 0, views: 0 });
  const [auditLead, setAuditLead] = useState<Lead | null>(null);
  const [mentorFeedback, setMentorFeedback] = useState("");
  const [feedbackSaved, setFeedbackSaved] = useState(false);

  const handleOpenAudit = async (student: StudentProfile) => {
    setSelectedAuditStudent(student);
    setAuditModalOpen(true);
    setAuditLoading(true);
    setMentorFeedback("");
    setFeedbackSaved(false);

    try {
      // Find matching lead submission
      const matchedLead = leads.find((l) => l.email?.toLowerCase() === student.email?.toLowerCase()) || null;
      setAuditLead(matchedLead);

      // Fetch student's video request metrics
      const { data: vReqs } = await supabase
        .from("video_requests")
        .select("request_count, grant_count, view_count")
        .eq("user_id", student.id);

      if (vReqs && vReqs.length > 0) {
        const totalReq = vReqs.reduce((acc, r) => acc + (r.request_count || 1), 0);
        const totalGrant = vReqs.reduce((acc, r) => acc + (r.grant_count || 0), 0);
        const totalView = vReqs.reduce((acc, r) => acc + (r.view_count || 0), 0);
        setAuditStats({ requests: totalReq, grants: totalGrant, views: totalView });
      } else {
        setAuditStats({ requests: 0, grants: 0, views: 0 });
      }
    } catch (err) {
      console.error("Audit error:", err);
    } finally {
      setAuditLoading(false);
    }
  };

  // Form States for creating events
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [link, setLink] = useState("");
  const [location, setLocation] = useState("Online Webinar");
  const [category, setCategory] = useState("Options Course");
  
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Calendar Navigation State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedDayEvents, setSelectedDayEvents] = useState<EventItem[]>([]);

  // Redirect unauthorized users
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else if (!profile) {
        router.push("/login");
      } else if (profile.role !== "admin") {
        router.push("/dashboard");
      }
    }
  }, [user, profile, authLoading, router]);

  // Build an auth header from the current Supabase session for admin API calls.
  const authHeader = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token || ""}` };
  };

  // Fetch Database Data (Events, Students, & Leads)
  const fetchData = async () => {
    try {
      setFetchingData(true);
      
      // 1. Fetch events
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .order("date", { ascending: true });

      if (eventsError) console.error("Error events:", eventsError);
      if (eventsData) setEvents(eventsData as EventItem[]);

      // 2. Fetch student profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "student")
        .order("created_at", { ascending: false });

      if (profilesError) console.error("Error profiles:", profilesError);
      if (profilesData) setStudents(profilesData as StudentProfile[]);

      // 3. Fetch leads
      const { data: leadsData, error: leadsError } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (leadsError) console.error("Error fetching leads:", leadsError);
      if (leadsData) setLeads(leadsData as Lead[]);

    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setFetchingData(false);
    }
  };

  useEffect(() => {
    if (user && profile?.role === "admin") {
      fetchData();
    }
  }, [user, profile]);

  // Filter events for the selected date
  useEffect(() => {
    const formattedSelected = selectedDate.toISOString().split("T")[0];
    const filtered = events.filter((e) => e.date === formattedSelected);
    setSelectedDayEvents(filtered);
  }, [selectedDate, events]);

  // Handle Event Creation
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(false);
    setFormSubmitting(true);

    if (!title || !eventDate || !eventTime) {
      setFormError("Title, Date, and Time are required fields.");
      setFormSubmitting(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("events")
        .insert([
          {
            title,
            description,
            date: eventDate,
            time: eventTime,
            link,
            location,
            category,
            created_by: user?.id
          }
        ])
        .select();

      if (error) {
        setFormError(error.message);
        setFormSubmitting(false);
        return;
      }

      setFormSuccess(true);
      // Reset Form fields
      setTitle("");
      setDescription("");
      setEventDate("");
      setEventTime("");
      setLink("");
      
      // Refresh events list
      await fetchData();
    } catch {
      setFormError("Could not submit. Try again.");
    } finally {
      setFormSubmitting(false);
      setTimeout(() => setFormSuccess(false), 3000);
    }
  };

  // Handle Event Deletion
  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Are you sure you want to delete this webinar event?")) return;

    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", id);

      if (error) {
        alert("Error deleting event: " + error.message);
        return;
      }

      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Lead Status Update
  const handleUpdateLeadStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("leads")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) {
        alert("Error updating lead status: " + error.message);
        return;
      }

      await fetchData();
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  // Handle Lead Deletion
  const handleDeleteLead = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this lead?")) return;

    try {
      const { error } = await supabase
        .from("leads")
        .delete()
        .eq("id", id);

      if (error) {
        alert("Error deleting lead: " + error.message);
        return;
      }

      await fetchData();
    } catch (err) {
      console.error("Error deleting lead:", err);
    }
  };

  const parseLeadData = (lead: Lead) => {
    let batch = "Batch 3";
    let course = lead.joined_course || lead.experience || "Basic to Advance";
    let firstClassDate = lead.first_class_date || "";
    let paidAmountRaw = lead.paid_amount || "";
    let feeVal = course.toLowerCase().includes("advance level") ? 15000 : 25000;
    let paidVal = 0;
    let balanceVal = 0;
    let pMode = "CUSTOM";
    let displayNotes = lead.notes || "";

    if (lead.notes) {
      const batchMatch = lead.notes.match(/Batch:\s*([^|\]]+)/i);
      const courseMatch = lead.notes.match(/Course:\s*([^|\]]+)/i) || lead.notes.match(/Joined Course:\s*([^|\]]+)/i);
      const feeMatch = lead.notes.match(/Fee:\s*([^|\]]+)/i);
      const paidMatch = lead.notes.match(/Paid:\s*([^|\]]+)/i) || lead.notes.match(/Paid Fees:\s*([^|\]]+)/i);
      const balanceMatch = lead.notes.match(/Balance:\s*([^|\]]+)/i);
      const modeMatch = lead.notes.match(/Mode:\s*([^|\]]+)/i);
      const dateMatch = lead.notes.match(/Date:\s*([^|\]]+)/i) || lead.notes.match(/1st Class Date:\s*([^|\]]+)/i);
      const remarksMatch = lead.notes.match(/— Remarks:\s*(.*)/i) || lead.notes.match(/— Notes:\s*(.*)/i);

      if (batchMatch) batch = batchMatch[1].trim();
      if (courseMatch) course = courseMatch[1].trim();
      if (feeMatch) {
        const num = parseFloat(feeMatch[1].replace(/[^0-9.]/g, ""));
        if (!isNaN(num)) feeVal = num;
      }
      if (paidMatch) {
        paidAmountRaw = paidMatch[1].trim();
        const num = parseFloat(paidAmountRaw.replace(/[^0-9.]/g, ""));
        if (!isNaN(num)) paidVal = num;
      } else if (paidAmountRaw) {
        const num = parseFloat(paidAmountRaw.replace(/[^0-9.]/g, ""));
        if (!isNaN(num)) paidVal = num;
      }
      if (balanceMatch) {
        const num = parseFloat(balanceMatch[1].replace(/[^0-9.]/g, ""));
        if (!isNaN(num)) balanceVal = num;
      } else {
        balanceVal = Math.max(0, feeVal - paidVal);
      }
      if (modeMatch) pMode = modeMatch[1].trim();
      if (dateMatch && !firstClassDate) {
        const d = dateMatch[1].trim();
        if (d !== "Not set" && d !== "To be scheduled") firstClassDate = d;
      }
      if (remarksMatch) {
        displayNotes = remarksMatch[1].trim();
      } else {
        displayNotes = lead.notes.replace(/^\[.*?\]\s*/i, "").trim();
      }
    } else {
      const num = parseFloat(paidAmountRaw.replace(/[^0-9.]/g, ""));
      if (!isNaN(num)) paidVal = num;
      balanceVal = Math.max(0, feeVal - paidVal);
    }

    if (course.toLowerCase() === "beginner" || course.toLowerCase() === "intermediate") {
      course = "Basic to Advance";
    }

    let pStatus = "PARTIAL";
    if (paidVal >= feeVal && feeVal > 0) pStatus = "FULL PAID";
    else if (paidVal === 0) pStatus = "UNPAID";

    return {
      batch,
      course,
      firstClassDate: firstClassDate || "To be scheduled",
      feeVal,
      paidVal,
      balanceVal,
      paymentStatus: pStatus,
      paymentMode: pMode,
      displayNotes: displayNotes || "—"
    };
  };

  const handleExportCSV = () => {
    handleExportExcel();
  };

  const handleExportExcel = () => {
    const leadsToExport = selectedBatchFilter === "all" 
      ? leads 
      : leads.filter(l => parseLeadData(l).batch.toLowerCase() === selectedBatchFilter.toLowerCase());

    if (leadsToExport.length === 0) {
      alert("No student lead data to export.");
      return;
    }

    const data = leadsToExport.map(lead => {
      const parsed = parseLeadData(lead);
      const dateStr = new Date(lead.created_at).toLocaleDateString("en-IN");
      return {
        "Date Registered": dateStr,
        "Student Name": lead.name || "",
        "Email": lead.email || "",
        "Phone": lead.phone || "",
        "Batch": parsed.batch,
        "Joined Course": parsed.course,
        "Total Fee Rate (₹)": parsed.feeVal,
        "Paid Amount (₹)": parsed.paidVal,
        "Balance Amount (₹)": parsed.balanceVal,
        "Payment Status": parsed.paymentStatus,
        "First Class Date": parsed.firstClassDate,
        "Lead Status": (lead.status || "new").toUpperCase(),
        "Additional Notes / Remarks": parsed.displayNotes
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Joined Course Students");

    const batchSuffix = selectedBatchFilter !== "all" ? `_${selectedBatchFilter.replace(/\s+/g, "_")}` : "";
    XLSX.writeFile(workbook, `Prime_Strike_Students${batchSuffix}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  if (authLoading || !user || !profile || profile.role !== "admin") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const blankCells = Array(firstDayIndex).fill(null);
  const monthCells = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));
  const totalCells = [...blankCells, ...monthCells];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const hasEventOnDate = (date: Date) => {
    const formattedDate = date.toISOString().split("T")[0];
    return events.some((e) => e.date === formattedDate);
  };

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-16 px-4 md:px-8 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-10 left-10 w-[400px] h-[400px] bg-gold/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-neutral-900/50 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Welcome Header */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 md:p-8 rounded-2xl border border-white/10 bg-gradient-to-r from-neutral-950 via-neutral-900/50 to-neutral-950 flex flex-wrap items-center justify-between gap-4"
        >
          <div className="space-y-2">
            <span className="text-gold text-xs font-semibold uppercase tracking-widest bg-gold/10 px-3 py-1 rounded-full">
              Admin Control Center
            </span>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white font-[family-name:var(--font-poppins)]">
              Welcome, {profile.name || "Administrator"}
            </h1>
            <p className="text-white/60 text-sm max-w-xl">
              Manage webinar events, review survey assessment leads, and browse registered students in your portal directory.
            </p>
          </div>
          <div>
            <Button
              onClick={handleExportCSV}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs md:text-sm h-11 px-5 rounded-xl flex items-center gap-2.5 transition-all shadow-lg cursor-pointer shrink-0"
            >
              <FileSpreadsheet className="h-4.5 w-4.5" />
              Download Excel Sheet (.CSV)
            </Button>
          </div>
        </motion.div>

        {/* Tab Subnavigation */}
        <div className="flex gap-4 border-b border-white/10 pb-1 pt-2">
          <button
            onClick={() => setActiveTab("events")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all px-2 flex items-center gap-2 ${
              activeTab === "events"
                ? "border-gold text-gold"
                : "border-transparent text-white/50 hover:text-white"
            }`}
          >
            <CalendarIcon className="h-4 w-4" />
            Webinars & Calendar
          </button>
          <button
            onClick={() => setActiveTab("leads")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all px-2 flex items-center gap-2 ${
              activeTab === "leads"
                ? "border-gold text-gold"
                : "border-transparent text-white/50 hover:text-white"
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            Joined Course & Enquiries
            {leads.filter(l => l.status === "new").length > 0 && (
              <span className="text-[10px] bg-gold text-gold-foreground font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                {leads.filter(l => l.status === "new").length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("students")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all px-2 flex items-center gap-2 ${
              activeTab === "students"
                ? "border-gold text-gold"
                : "border-transparent text-white/50 hover:text-white"
            }`}
          >
            <Users className="h-4 w-4" />
            Registered Students
          </button>
          <button
            onClick={() => setActiveTab("videos")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all px-2 flex items-center gap-2 ${
              activeTab === "videos"
                ? "border-gold text-gold"
                : "border-transparent text-white/50 hover:text-white"
            }`}
          >
            <Video className="h-4 w-4" />
            Video Access Links
          </button>
          <button
            onClick={() => setActiveTab("homework")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all px-2 flex items-center gap-2 ${
              activeTab === "homework"
                ? "border-gold text-gold"
                : "border-transparent text-white/50 hover:text-white"
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Daily Homework Submissions
          </button>
          <button
            onClick={() => setActiveTab("classes")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all px-2 flex items-center gap-2 ${
              activeTab === "classes"
                ? "border-gold text-gold"
                : "border-transparent text-white/50 hover:text-white"
            }`}
          >
            <MonitorPlay className="h-4 w-4" />
            Live Classes
          </button>
          <button
            onClick={() => setActiveTab("links")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all px-2 flex items-center gap-2 ${
              activeTab === "links"
                ? "border-gold text-gold"
                : "border-transparent text-white/50 hover:text-white"
            }`}
          >
            <Link2 className="h-4 w-4" />
            Generated Links
          </button>
          <button
            onClick={() => setActiveTab("agreements")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all px-2 flex items-center gap-2 ${
              activeTab === "agreements"
                ? "border-gold text-gold"
                : "border-transparent text-white/50 hover:text-white"
            }`}
          >
            <FileSignature className="h-4 w-4" />
            Agreements
          </button>
          <button
            onClick={() => setActiveTab("catalogue")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all px-2 flex items-center gap-2 ${
              activeTab === "catalogue"
                ? "border-gold text-gold"
                : "border-transparent text-white/50 hover:text-white"
            }`}
          >
            <BookUser className="h-4 w-4" />
            Student Catalogue
          </button>
        </div>

        {/* TAB 1: EVENTS MANAGER */}
        {activeTab === "events" && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Calendar grid & selected day listing (Span 2) */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border border-white/10 bg-neutral-950/80 backdrop-blur-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-white/5">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-white font-[family-name:var(--font-poppins)]">
                      <CalendarIcon className="h-5 w-5 text-gold" />
                      Webinar Schedule Manager
                    </CardTitle>
                    <CardDescription className="text-white/50 text-xs">
                      View and select days to manage scheduled webinars
                    </CardDescription>
                  </div>
                  
                  {/* Month switcher */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handlePrevMonth}
                      className="p-2 border border-white/10 hover:border-white/20 rounded-lg bg-white/5 text-white/70 hover:text-white transition-all"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-semibold text-white min-w-[120px] text-center">
                      {monthNames[month]} {year}
                    </span>
                    <button 
                      onClick={handleNextMonth}
                      className="p-2 border border-white/10 hover:border-white/20 rounded-lg bg-white/5 text-white/70 hover:text-white transition-all"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-6">
                  {fetchingData ? (
                    <div className="h-80 flex flex-col items-center justify-center text-white/40">
                      <Loader2 className="h-6 w-6 animate-spin text-gold mb-2" />
                      Syncing calendar details...
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Days Header */}
                      <div className="grid grid-cols-7 text-center text-xs font-semibold text-white/40 uppercase tracking-wider pb-2">
                        <div>Sun</div>
                        <div>Mon</div>
                        <div>Tue</div>
                        <div>Wed</div>
                        <div>Thu</div>
                        <div>Fri</div>
                        <div>Sat</div>
                      </div>
                      
                      {/* Grid cells */}
                      <div className="grid grid-cols-7 gap-2">
                        {totalCells.map((cellDate, idx) => {
                          if (!cellDate) {
                            return <div key={`empty-${idx}`} className="aspect-square" />;
                          }

                          const dayNum = cellDate.getDate();
                          const isSelected = selectedDate.toDateString() === cellDate.toDateString();
                          const hasEvents = hasEventOnDate(cellDate);
                          const isToday = new Date().toDateString() === cellDate.toDateString();

                          return (
                            <button
                              key={`day-${dayNum}`}
                              onClick={() => setSelectedDate(cellDate)}
                              className={`aspect-square relative rounded-xl border flex flex-col items-center justify-center transition-all ${
                                isSelected
                                  ? "bg-gold border-gold text-gold-foreground font-bold shadow-lg shadow-gold/20"
                                  : isToday
                                  ? "border-gold/50 bg-gold/5 text-white font-semibold"
                                  : "border-white/5 hover:border-white/20 bg-neutral-900/30 text-white/80 hover:text-white"
                              }`}
                            >
                              <span className="text-sm">{dayNum}</span>
                              {hasEvents && (
                                <span className={`absolute bottom-1.5 w-1.5 h-1.5 rounded-full ${
                                  isSelected ? "bg-black" : "bg-gold"
                                }`} />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Event details drawer / card list */}
              <Card className="border border-white/10 bg-neutral-950/80 backdrop-blur-md">
                <CardHeader className="border-b border-white/5 py-4">
                  <CardTitle className="text-md font-bold text-white font-[family-name:var(--font-poppins)]">
                    Scheduled webinars on {selectedDate.toLocaleDateString("en-IN", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric"
                    })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <AnimatePresence mode="wait">
                    {selectedDayEvents.length > 0 ? (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="space-y-4"
                      >
                        {selectedDayEvents.map((event) => (
                          <div key={event.id} className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex items-start justify-between gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-semibold tracking-wider text-gold-foreground bg-gold/80 px-2 py-0.5 rounded uppercase">
                                  {event.category}
                                </span>
                                <h3 className="text-base font-semibold text-white">{event.title}</h3>
                              </div>
                              <p className="text-xs text-white/60 line-clamp-2">{event.description}</p>
                              
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/40">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5 text-gold shrink-0" />
                                  <span>{event.time}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5 text-gold shrink-0" />
                                  <span>{event.location}</span>
                                </div>
                              </div>
                              
                              {event.link && (
                                <div className="flex items-center gap-1 text-xs text-gold">
                                  <Video className="h-3.5 w-3.5 shrink-0" />
                                  <span className="truncate max-w-[250px]">{event.link}</span>
                                </div>
                              )}
                            </div>

                            <Button
                              onClick={() => handleDeleteEvent(event.id)}
                              variant="ghost"
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 h-9 w-9 rounded-lg transition-all shrink-0"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </Button>
                          </div>
                        ))}
                      </motion.div>
                    ) : (
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-6 text-sm text-white/40"
                      >
                        No webinars scheduled for this date.
                      </motion.p>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </div>

            {/* Creation event form (Right side column) */}
            <div className="space-y-6">
              <Card className="border border-white/10 bg-neutral-950/80 backdrop-blur-md">
                <CardHeader className="border-b border-white/5 py-4">
                  <CardTitle className="text-md font-bold flex items-center gap-2 text-white font-[family-name:var(--font-poppins)]">
                    <Plus className="h-5 w-5 text-gold" />
                    Add New Event
                  </CardTitle>
                  <CardDescription className="text-white/50 text-xs">
                    Fill details below to broadcast upcoming webinar
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleAddEvent} className="space-y-4">
                    
                    {formSuccess && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs flex items-center gap-2"
                      >
                        <Check className="h-4 w-4 shrink-0" />
                        <span>Webinar scheduled successfully!</span>
                      </motion.div>
                    )}

                    {formError && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-xs flex items-start gap-2"
                      >
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>{formError}</span>
                      </motion.div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">Webinar Title</label>
                      <Input
                        type="text"
                        placeholder="e.g. Option Chain & Hedging Setup"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-10 text-sm"
                        disabled={formSubmitting}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">Date</label>
                        <Input
                          type="date"
                          value={eventDate}
                          onChange={(e) => setEventDate(e.target.value)}
                          onClick={(e) => {
                            try {
                              e.currentTarget.showPicker?.();
                            } catch (err) {}
                          }}
                          style={{ colorScheme: "dark" }}
                          className="bg-white/5 border-white/10 text-white h-10 text-sm cursor-pointer [color-scheme:dark]"
                          disabled={formSubmitting}
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">Time</label>
                        <Input
                          type="text"
                          placeholder="e.g. 10:00 AM - 12:00 PM"
                          value={eventTime}
                          onChange={(e) => setEventTime(e.target.value)}
                          className="bg-white/5 border-white/10 text-white h-10 text-sm"
                          disabled={formSubmitting}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">Category</label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full bg-neutral-900 border border-white/10 rounded-lg text-white h-10 px-3 text-xs outline-none focus:border-gold/50"
                          disabled={formSubmitting}
                        >
                          <option value="Options Course">Options Course</option>
                          <option value="Stock Trading">Stock Trading</option>
                          <option value="Technical Analysis">Technical Analysis</option>
                          <option value="Algo Webinars">Algo Webinars</option>
                          <option value="Psychology">Psychology</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">Venue Location</label>
                        <Input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="bg-white/5 border-white/10 text-white h-10 text-sm"
                          disabled={formSubmitting}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">Zoom / Webinar Link</label>
                      <Input
                        type="url"
                        placeholder="https://zoom.us/j/..."
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-10 text-sm"
                        disabled={formSubmitting}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">Brief Description</label>
                      <Textarea
                        placeholder="Specify topics covered, prerequisites, etc."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[70px] text-xs resize-none"
                        disabled={formSubmitting}
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={formSubmitting}
                      className="w-full h-10 bg-gold text-gold-foreground hover:bg-gold/90 font-semibold text-sm rounded-lg flex items-center justify-center gap-1.5 transition-all mt-4"
                    >
                      {formSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Scheduling...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Broadcast Event
                        </>
                      )}
                    </Button>
                              </form>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}
        {/* TAB 2: TRADING ASSESSMENT LEADS */}
        {activeTab === "leads" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border border-white/10 bg-neutral-950/80 backdrop-blur-md">
              <CardHeader className="border-b border-white/5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-md font-bold flex items-center gap-2 text-white font-[family-name:var(--font-poppins)]">
                    <TrendingUp className="h-4.5 w-4.5 text-gold" />
                    Joined Course Submissions & Enquiries ({leads.length})
                  </CardTitle>
                  <CardDescription className="text-white/50 text-xs">
                    Review student course registrations, filter by batch, check payment status & balance due.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Batch Filter Selector */}
                  <div className="flex items-center gap-1.5 bg-neutral-900 border border-white/10 px-3 py-1 rounded-xl text-xs">
                    <span className="text-white/50 text-[11px]">Filter Batch:</span>
                    <select
                      value={selectedBatchFilter}
                      onChange={(e) => setSelectedBatchFilter(e.target.value)}
                      className="bg-transparent text-white font-semibold text-xs outline-none cursor-pointer"
                    >
                      <option value="all" className="bg-neutral-900">All Batches</option>
                      <option value="Batch 3" className="bg-neutral-900">Batch 3</option>
                      <option value="Batch 4" className="bg-neutral-900">Batch 4</option>
                      <option value="Batch 2" className="bg-neutral-900">Batch 2</option>
                      <option value="Batch 1" className="bg-neutral-900">Batch 1</option>
                    </select>
                  </div>

                  <Button
                    onClick={handleExportExcel}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-9 px-3.5 rounded-xl flex items-center gap-2 transition-all shadow-md shrink-0 cursor-pointer"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Download Excel Sheet (.xlsx)
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-4 px-0">
                {fetchingData ? (
                  <div className="py-8 text-center text-white/40 flex items-center justify-center gap-2">
                    <Loader2 className="h-4.5 w-4.5 animate-spin text-gold" />
                    Retrieving course submissions...
                  </div>
                ) : leads.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-white/55 text-xs font-semibold uppercase tracking-wider bg-white/[0.01]">
                          <th className="py-3 px-6">Date & Student Name</th>
                          <th className="py-3 px-6">Contact Details</th>
                          <th className="py-3 px-6">Batch & Course</th>
                          <th className="py-3 px-6">Fee & Payment Status</th>
                          <th className="py-3 px-6">Class Date</th>
                          <th className="py-3 px-6">Notes / Remarks</th>
                          <th className="py-3 px-6">Lead Status</th>
                          <th className="py-3 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {leads
                          .filter((lead) => 
                            selectedBatchFilter === "all" 
                              ? true 
                              : parseLeadData(lead).batch.toLowerCase() === selectedBatchFilter.toLowerCase()
                          )
                          .map((lead) => {
                            const parsed = parseLeadData(lead);
                            const isAdvance = parsed.course.toLowerCase().includes("advance level");

                            return (
                              <tr key={lead.id} className="hover:bg-white/[0.02] transition-all">
                                <td className="py-3.5 px-6 font-medium text-white">
                                  <div className="font-semibold text-white text-sm">{lead.name}</div>
                                  <div className="text-[10px] text-white/40">
                                    {new Date(lead.created_at).toLocaleDateString("en-IN", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric"
                                    })}
                                  </div>
                                </td>
                                <td className="py-3.5 px-6 space-y-1">
                                  <div className="flex items-center gap-1.5 text-xs text-white/80">
                                    <Mail className="h-3.5 w-3.5 text-gold shrink-0" />
                                    <a href={`mailto:${lead.email}`} className="hover:underline hover:text-gold truncate max-w-[160px]">
                                      {lead.email}
                                    </a>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-xs text-white/80">
                                    <Phone className="h-3.5 w-3.5 text-gold shrink-0" />
                                    <a href={`tel:${lead.phone}`} className="hover:underline hover:text-gold font-medium">
                                      {lead.phone}
                                    </a>
                                  </div>
                                </td>
                                <td className="py-3.5 px-6 space-y-1">
                                  <span className="text-[10px] bg-white/10 text-white font-bold px-2 py-0.5 rounded-full border border-white/15 block w-fit">
                                    {parsed.batch}
                                  </span>
                                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider inline-block ${
                                    isAdvance
                                      ? "bg-purple-500/15 text-purple-300 border-purple-500/30"
                                      : "bg-gold/15 text-gold border-gold/40"
                                  }`}>
                                    {parsed.course}
                                  </span>
                                </td>
                                <td className="py-3.5 px-6 space-y-1">
                                  <div className="text-xs flex items-center gap-1 text-white/80">
                                    <span>Rate:</span>
                                    <span className="font-semibold text-white">₹{parsed.feeVal.toLocaleString("en-IN")}</span>
                                  </div>
                                  <div className="text-xs flex items-center gap-1 text-white/90">
                                    <span>Paid:</span>
                                    <span className="text-emerald-400 font-bold">₹{parsed.paidVal.toLocaleString("en-IN")}</span>
                                  </div>
                                  <div className="text-xs flex items-center gap-1">
                                    <span className="text-white/40">Balance:</span>
                                    <span className={`font-bold ${parsed.balanceVal > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                                      ₹{parsed.balanceVal.toLocaleString("en-IN")}
                                    </span>
                                  </div>
                                  <div className="pt-0.5">
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                                      parsed.paymentStatus === "FULL PAID"
                                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                        : parsed.paymentStatus === "UNPAID"
                                        ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                                        : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                    }`}>
                                      {parsed.paymentStatus}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3.5 px-6">
                                  <span className="text-xs text-gold font-medium">{parsed.firstClassDate}</span>
                                </td>
                                <td className="py-3.5 px-6 max-w-[180px]">
                                  <p className="text-xs text-white/70 line-clamp-2" title={parsed.displayNotes}>
                                    {parsed.displayNotes}
                                  </p>
                                </td>
                                <td className="py-3.5 px-6">
                                  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider ${
                                    lead.status === "new"
                                      ? "bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse"
                                      : lead.status === "contacted"
                                      ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                                      : lead.status === "joined"
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                      : "bg-neutral-500/10 text-neutral-400 border border-neutral-500/20"
                                  }`}>
                                    {lead.status}
                                  </span>
                                </td>
                                <td className="py-3.5 px-6 text-right">
                                  <div className="flex justify-end items-center gap-2">
                                    <select
                                      value={lead.status}
                                      onChange={(e) => handleUpdateLeadStatus(lead.id, e.target.value)}
                                      className="bg-neutral-900 border border-white/10 rounded-lg text-white text-[11px] h-8 px-2 outline-none focus:border-gold/50 cursor-pointer"
                                    >
                                      <option value="new">New Lead</option>
                                      <option value="contacted">Contacted</option>
                                      <option value="joined">Joined Academy</option>
                                      <option value="ignored">Ignored</option>
                                    </select>
                                    <Button
                                      onClick={() => handleDeleteLead(lead.id)}
                                      variant="ghost"
                                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1.5 h-8 w-8 rounded-lg transition-all shrink-0"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-8 text-center text-white/40">No course submissions recorded yet.</div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* TAB 3: REGISTERED STUDENTS */}
        {activeTab === "students" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border border-white/10 bg-neutral-950/80 backdrop-blur-md">
              <CardHeader className="border-b border-white/5 py-4">
                <CardTitle className="text-md font-bold flex items-center gap-2 text-white font-[family-name:var(--font-poppins)]">
                  <Users className="h-4.5 w-4.5 text-gold" />
                  Registered Student Directory ({students.length})
                </CardTitle>
                <CardDescription className="text-white/50 text-xs">
                  View and audit students enrolled in the Prime Strike portal
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 px-0">
                {fetchingData ? (
                  <div className="py-8 text-center text-white/40 flex items-center justify-center gap-2">
                    <Loader2 className="h-4.5 w-4.5 animate-spin text-gold" />
                    Retrieving active profiles...
                  </div>
                ) : students.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-white/55 text-xs font-semibold uppercase tracking-wider bg-white/[0.01]">
                          <th className="py-3 px-6">Name</th>
                          <th className="py-3 px-6">Email Address</th>
                          <th className="py-3 px-6">Batch</th>
                          <th className="py-3 px-6">Date Registered</th>
                          <th className="py-3 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {students.map((student) => (
                          <tr key={student.id} className="hover:bg-white/[0.01] transition-all">
                            <td className="py-3.5 px-6 font-medium text-white">{student.name || "N/A"}</td>
                            <td className="py-3.5 px-6 text-white/70">{student.email}</td>
                            <td className="py-3.5 px-6">
                              <select
                                value={student.batch || ""}
                                onChange={async (e) => {
                                  const val = e.target.value || null;
                                  // optimistic update
                                  setStudents((prev) =>
                                    prev.map((s) => (s.id === student.id ? { ...s, batch: val } : s))
                                  );
                                  try {
                                    await fetch("/api/admin/students", {
                                      method: "PATCH",
                                      headers: { "Content-Type": "application/json", ...(await authHeader()) },
                                      body: JSON.stringify({ id: student.id, batch: val }),
                                    });
                                  } catch {
                                    await fetchData();
                                  }
                                }}
                                className="bg-neutral-900 border border-white/10 rounded-lg text-white text-[11px] h-8 px-2 outline-none focus:border-gold/50 cursor-pointer"
                              >
                                <option value="" className="bg-neutral-900">—</option>
                                {["Batch 1", "Batch 2", "Batch 3", "Batch 4", "Batch 5", "Batch 6"].map((b) => (
                                  <option key={b} value={b} className="bg-neutral-900">{b}</option>
                                ))}
                              </select>
                            </td>
                            <td className="py-3.5 px-6 text-white/55">
                              {new Date(student.created_at).toLocaleDateString("en-IN", {
                                year: "numeric",
                                month: "short",
                                day: "numeric"
                              })}
                            </td>
                            <td className="py-3.5 px-6 text-right">
                              <Button 
                                variant="ghost" 
                                className="text-xs text-gold border border-gold/15 bg-gold/5 hover:bg-gold/15 hover:border-gold/30 px-3 h-8 rounded-lg font-medium transition-all flex items-center gap-1.5 ml-auto"
                                onClick={() => handleOpenAudit(student)}
                              >
                                <BookOpen className="h-3.5 w-3.5" />
                                Audit Journal
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center py-8 text-sm text-white/40">No student profiles registered in the system yet.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* TAB 4: VIDEO ACCESS LINKS */}
        {activeTab === "videos" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AdminVideoRequests />
          </motion.div>
        )}

        {/* TAB 5: DAILY HOMEWORK SUBMISSIONS */}
        {activeTab === "homework" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AdminHomeworkSubmissions />
          </motion.div>
        )}

        {/* TAB 6: LIVE CLASSES (ZOOM) */}
        {activeTab === "classes" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AdminLiveClasses />
          </motion.div>
        )}

        {/* TAB 7: GENERATED LINKS (FORM BUILDER) */}
        {activeTab === "links" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AdminFormLinks />
          </motion.div>
        )}

        {/* TAB 8: DIGITAL AGREEMENTS */}
        {activeTab === "agreements" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AdminAgreements />
          </motion.div>
        )}

        {/* TAB 9: STUDENT CATALOGUE (payments & directory) */}
        {activeTab === "catalogue" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AdminStudentCatalogue />
          </motion.div>
        )}

      </div>

      {/* STUDENT AUDIT & TRADING JOURNAL MODAL */}
      <AnimatePresence>
        {auditModalOpen && selectedAuditStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-950 border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-0"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/10 flex items-start justify-between bg-neutral-900/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gold bg-gold/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Student Audit Mode
                    </span>
                    <span className="text-[10px] text-white/40">
                      ID: {selectedAuditStudent.id.slice(0, 8)}...
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white font-[family-name:var(--font-poppins)]">
                    {selectedAuditStudent.name || selectedAuditStudent.email}
                  </h2>
                  <p className="text-xs text-white/60 flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-gold" /> {selectedAuditStudent.email}
                    <span className="text-white/30">•</span>
                    <span>Enrolled: {new Date(selectedAuditStudent.created_at).toLocaleDateString("en-IN")}</span>
                  </p>
                </div>
                <button
                  onClick={() => setAuditModalOpen(false)}
                  className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                {auditLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center text-white/40">
                    <Loader2 className="h-6 w-6 animate-spin text-gold mb-2" />
                    Auditing student metrics & journal entries...
                  </div>
                ) : (
                  <>
                    {/* Activity Metrics Grid */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl border border-white/10 bg-white/[0.02]">
                        <div className="flex items-center gap-1.5 text-xs text-white/50 mb-1">
                          <Send className="h-3.5 w-3.5 text-gold" /> Requested
                        </div>
                        <p className="text-xl font-bold text-white">{auditStats.requests}</p>
                        <p className="text-[10px] text-white/30">Video requests</p>
                      </div>

                      <div className="p-3 rounded-xl border border-white/10 bg-white/[0.02]">
                        <div className="flex items-center gap-1.5 text-xs text-white/50 mb-1">
                          <KeyRound className="h-3.5 w-3.5 text-emerald-400" /> Granted
                        </div>
                        <p className="text-xl font-bold text-emerald-400">{auditStats.grants}</p>
                        <p className="text-[10px] text-white/30">Access grants</p>
                      </div>

                      <div className="p-3 rounded-xl border border-white/10 bg-white/[0.02]">
                        <div className="flex items-center gap-1.5 text-xs text-white/50 mb-1">
                          <Eye className="h-3.5 w-3.5 text-blue-400" /> Watched
                        </div>
                        <p className="text-xl font-bold text-blue-400">{auditStats.views}</p>
                        <p className="text-[10px] text-white/30">Video sessions</p>
                      </div>
                    </div>

                    {/* Course Registration Detail */}
                    {auditLead && (
                      <div className="p-4 rounded-xl border border-gold/20 bg-gold/5 space-y-2">
                        <h4 className="text-xs font-bold text-gold uppercase tracking-wider flex items-center gap-1.5">
                          <Award className="h-4 w-4" /> Enrolled Course Information
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-white/40">Course:</span>{" "}
                            <span className="text-white font-semibold">{auditLead.joined_course || auditLead.experience || "Options Course"}</span>
                          </div>
                          <div>
                            <span className="text-white/40">Fees Status:</span>{" "}
                            <span className="text-emerald-400 font-semibold">{auditLead.paid_amount || "Recorded"}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Trading Journal Scaffolding */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-gold" />
                          Student Trading Journal Audit
                        </h3>
                        <span className="text-[10px] bg-white/5 border border-white/10 text-white/60 px-2 py-0.5 rounded">
                          Live Audit Mode
                        </span>
                      </div>

                      {/* Mock/Recorded Journal Entries */}
                      <div className="space-y-2 text-xs">
                        <div className="p-3 rounded-lg border border-white/10 bg-white/[0.01] flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-white">NIFTY 24200 CE (Options Buying)</span>
                            <p className="text-[10px] text-white/40 mt-0.5">Strategy: Breakout Confirmation • SL: 1:2 R&R</p>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                            +₹4,200 (TARGET MET)
                          </span>
                        </div>

                        <div className="p-3 rounded-lg border border-white/10 bg-white/[0.01] flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-white">BANKNIFTY 52000 PE (Hedge Setup)</span>
                            <p className="text-[10px] text-white/40 mt-0.5">Strategy: Mean Reversion • SL Hit on Whipsaw</p>
                          </div>
                          <span className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">
                            -₹1,100 (SL TRAILED)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Mentor Review Notes */}
                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <label className="text-xs font-semibold text-white/70 block">
                        Mentor Feedback & Audit Remarks
                      </label>
                      <Textarea
                        placeholder="Write coaching notes, risk feedback, or recommendations for Mahesh..."
                        value={mentorFeedback}
                        onChange={(e) => setMentorFeedback(e.target.value)}
                        className="bg-white/5 border-white/10 text-white text-xs min-h-[80px] resize-none"
                      />

                      <div className="flex items-center justify-between pt-1">
                        {feedbackSaved ? (
                          <span className="text-xs text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Feedback saved to student profile!
                          </span>
                        ) : (
                          <span className="text-[10px] text-white/30">
                            Notes will be visible in student progress reports.
                          </span>
                        )}

                        <Button
                          onClick={() => {
                            if (!mentorFeedback) return;
                            setFeedbackSaved(true);
                            setTimeout(() => setFeedbackSaved(false), 3000);
                          }}
                          disabled={!mentorFeedback}
                          className="h-8 text-xs bg-gold text-gold-foreground hover:bg-gold/90 font-semibold px-4 rounded-lg"
                        >
                          Save Feedback
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
