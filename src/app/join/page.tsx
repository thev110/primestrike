"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { 
  GraduationCap, 
  Mail, 
  Phone, 
  User, 
  Lock,
  Calendar, 
  IndianRupee, 
  BookOpen, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Copy,
  Check,
  Send,
  MessageSquare,
  ArrowRight,
  ChevronRight,
  RefreshCw,
  ShieldAlert
} from "lucide-react";
import { motion } from "framer-motion";
import { 
  PRIMARY_UPI_ID, 
  SECONDARY_UPI_ID, 
  PAYMENT_SUPPORT_PHONE, 
  PAYMENT_SUPPORT_WHATSAPP,
  STUDENT_BATCHES 
} from "@/lib/constants";

export default function JoinPage() {
  const router = useRouter();

  // ── Step State ──────────────────────────────────────────────
  // Step 1: Registration & Batch Selection
  // Step 2: Payment & QR Fallback Step
  // Step 3: WhatsApp Confirmation Step
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // ── Form States ─────────────────────────────────────────────
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [batchName, setBatchName] = useState("Batch 5");
  const [joinedCourse, setJoinedCourse] = useState("Basic to Advance");
  const [firstClassDate, setFirstClassDate] = useState("");
  const [isPayingNow, setIsPayingNow] = useState<"yes" | "no">("yes");
  
  // Pricing & Payment states
  const [totalFee, setTotalFee] = useState(25000);
  const [paidAmount, setPaidAmount] = useState("25000");
  const [notes, setNotes] = useState("");

  // Loading & Error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── QR Fallback Logic States ────────────────────────────────
  // activeQrIndex: 1 = studiofoxglove@oksbi (Primary), 2 = mharinath27@oksb (Secondary)
  const [activeQrIndex, setActiveQrIndex] = useState<1 | 2>(1);
  const [qr1Failed, setQr1Failed] = useState(false);
  const [qr2Failed, setQr2Failed] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Handle course changes with auto fee calculate
  const handleCourseChange = (course: string) => {
    setJoinedCourse(course);
    const fee = course === "Basic to Advance" ? 25000 : 15000;
    setTotalFee(fee);
    if (isPayingNow === "yes") {
      setPaidAmount(fee.toString());
    }
  };

  // Handle paying now toggle
  const handlePayingNowToggle = (value: "yes" | "no") => {
    setIsPayingNow(value);
    if (value === "yes") {
      setPaidAmount(totalFee.toString());
    } else {
      setPaidAmount("0");
    }
  };

  // ── Copy UPI ID Helper ──────────────────────────────────────
  const currentUpi = activeQrIndex === 1 ? PRIMARY_UPI_ID : SECONDARY_UPI_ID;
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // ── Step 1 Form Submit (Signup & Registration) ─────────────
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !email || !password || !phone || !firstClassDate) {
      setError("Please fill in all required fields (Name, Email, Password, Phone, and First Class Date).");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters for your student portal account.");
      return;
    }

    setLoading(true);

    try {
      // 1. Create Supabase Auth account (OTP disabled in project)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: "student",
            phone,
            batch: batchName,
          },
        },
      });

      if (authError && !authError.message.includes("User already registered")) {
        console.warn("Supabase Auth notice:", authError.message);
      }

      // 2. Save student enrollment lead in backend database
      const numericPaid = parseFloat((paidAmount || "0").toString().replace(/[^0-9.]/g, "")) || 0;
      const balanceAmount = Math.max(0, totalFee - numericPaid);

      const leadResponse = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          batchName,
          joinedCourse,
          firstClassDate,
          totalFee,
          paidAmount: numericPaid.toString(),
          balanceAmount: balanceAmount.toString(),
          paymentMode: isPayingNow === "yes" ? "FULL" : "PARTIAL",
          notes,
        }),
      });

      if (!leadResponse.ok) {
        const leadResJson = await leadResponse.json();
        console.warn("Lead record notice:", leadResJson.error);
      }

      // Progress to Step 2 (QR payment) if paying, or Step 3 directly
      if (isPayingNow === "yes" && numericPaid > 0) {
        setStep(2);
      } else {
        setStep(3);
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to register enrollment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── UPI String generator ────────────────────────────────────
  const generateUpiUri = (upiId: string) => {
    const amountVal = parseFloat((paidAmount || "0").toString().replace(/[^0-9.]/g, "")) || 0;
    const payeeName = encodeURIComponent("Prime Strike Academy");
    const note = encodeURIComponent(`${batchName} - ${name}`);
    return `upi://pay?pa=${upiId}&pn=${payeeName}&am=${amountVal}&cu=INR&tn=${note}`;
  };

  // ── Pre-filled WhatsApp message ──────────────────────────────
  const whatsappMessage = encodeURIComponent(
    `Sir or madam, I have paid this much: ₹${paidAmount} for ${batchName} (${joinedCourse}). Here is my payment screenshot.`
  );
  const whatsappUrl = `https://wa.me/919500298631?text=${whatsappMessage}`;

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-16 px-4 md:px-8 relative overflow-hidden flex items-center justify-center">
      {/* Ambient glowing background accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gold/5 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-neutral-900/50 rounded-full blur-[90px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-2xl relative z-10"
      >
        {/* Progress Tracker */}
        <div className="mb-6 flex items-center justify-center gap-2 md:gap-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            step === 1 ? "bg-gold/15 text-gold border-gold/40 ring-1 ring-gold/30" : "bg-neutral-900/80 text-white/50 border-white/10"
          }`}>
            <span className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center text-[10px] font-bold text-gold">1</span>
            <span>Registration</span>
          </div>

          <ChevronRight className="h-4 w-4 text-white/20 shrink-0" />

          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            step === 2 ? "bg-gold/15 text-gold border-gold/40 ring-1 ring-gold/30" : "bg-neutral-900/80 text-white/50 border-white/10"
          }`}>
            <span className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center text-[10px] font-bold text-gold">2</span>
            <span>UPI Payment QR</span>
          </div>

          <ChevronRight className="h-4 w-4 text-white/20 shrink-0" />

          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            step === 3 ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40 ring-1 ring-emerald-500/30" : "bg-neutral-900/80 text-white/50 border-white/10"
          }`}>
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px] font-bold text-emerald-400">3</span>
            <span>WhatsApp Proof</span>
          </div>
        </div>

        <Card className="border border-white/10 bg-neutral-950/90 backdrop-blur-md shadow-2xl relative overflow-hidden">
          {/* Top gold accent line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

          {/* ── STEP 1: Registration & Fee Details ────────────────────────────────────── */}
          {step === 1 && (
            <form onSubmit={handleFormSubmit}>
              <CardHeader className="space-y-2 text-center pt-8">
                <div className="mx-auto w-12 h-12 rounded-full border border-gold/30 bg-gold/5 flex items-center justify-center mb-2">
                  <GraduationCap className="h-6 w-6 text-gold" />
                </div>
                <CardTitle className="text-2xl md:text-3xl font-bold tracking-tight text-white font-[family-name:var(--font-poppins)]">
                  Student Join & Course Fee Form
                </CardTitle>
                <CardDescription className="text-white/60 text-sm max-w-md mx-auto">
                  Create your student account, select your batch, and proceed to UPI fee payment.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5 px-6 md:px-10 pb-6">
                {error && (
                  <div className="p-3.5 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* 1. Account & Personal Info */}
                <div className="space-y-3.5">
                  <h3 className="text-xs font-bold text-gold uppercase tracking-wider border-b border-white/5 pb-1 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    1. Student Portal Credentials & Info
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-white/70">Full Name *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                        <Input
                          type="text"
                          placeholder="Your full name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="pl-9 h-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 text-xs focus:border-gold/50 focus:ring-gold/20"
                          disabled={loading}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-white/70">Email Address *</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                        <Input
                          type="email"
                          placeholder="name@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-9 h-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 text-xs focus:border-gold/50 focus:ring-gold/20"
                          disabled={loading}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-white/70">Password (For Student Portal) *</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                        <Input
                          type="password"
                          placeholder="•••••••• (Min 6 chars)"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-9 h-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 text-xs focus:border-gold/50 focus:ring-gold/20"
                          disabled={loading}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-white/70">Phone Number (WhatsApp) *</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                        <Input
                          type="tel"
                          placeholder="e.g. +91 95002 98631"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="pl-9 h-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 text-xs focus:border-gold/50 focus:ring-gold/20"
                          disabled={loading}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Batch & Course Details */}
                <div className="space-y-3.5 pt-2">
                  <h3 className="text-xs font-bold text-gold uppercase tracking-wider border-b border-white/5 pb-1 flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" />
                    2. Select Student Batch & Course
                  </h3>

                  {/* Batch Selector (Batches 1, 2, 3, 4, 5, 6) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
                      Select Student Batch *
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {["Batch 1", "Batch 2", "Batch 3", "Batch 4", "Batch 5", "Batch 6"].map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setBatchName(b)}
                          className={`py-2 px-1 text-xs font-bold rounded-lg border transition-all cursor-pointer text-center ${
                            batchName === b
                              ? "bg-gold/20 text-gold border-gold ring-1 ring-gold/40"
                              : "bg-white/5 text-white/60 border-white/10 hover:border-white/20"
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Course Cards */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-white/70">Select Course Program *</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => handleCourseChange("Basic to Advance")}
                        className={`p-3.5 border rounded-xl text-left transition-all flex flex-col gap-1 cursor-pointer ${
                          joinedCourse === "Basic to Advance"
                            ? "bg-gold/10 border-gold text-white ring-1 ring-gold/40"
                            : "border-white/10 bg-white/[0.01] hover:border-white/20 text-white/70"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">Basic to Advance</span>
                          <span className="text-[10px] bg-gold/20 text-gold font-semibold px-2 py-0.5 rounded-full border border-gold/30">
                            ₹25,000
                          </span>
                        </div>
                        <span className="text-[11px] text-white/50">
                          Complete trading program from beginner concepts to advanced options hedging.
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCourseChange("Advance Level")}
                        className={`p-3.5 border rounded-xl text-left transition-all flex flex-col gap-1 cursor-pointer ${
                          joinedCourse === "Advance Level"
                            ? "bg-gold/10 border-gold text-white ring-1 ring-gold/40"
                            : "border-white/10 bg-white/[0.01] hover:border-white/20 text-white/70"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">Advance Level</span>
                          <span className="text-[10px] bg-purple-500/20 text-purple-300 font-semibold px-2 py-0.5 rounded-full border border-purple-500/30">
                            ₹15,000
                          </span>
                        </div>
                        <span className="text-[11px] text-white/50">
                          Master price action, institutional buying/selling, and options strategies.
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Class Date & Payment Choice */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-gold" />
                        First Class Date *
                      </label>
                      <Input
                        type="date"
                        value={firstClassDate}
                        onChange={(e) => setFirstClassDate(e.target.value)}
                        onClick={(e) => {
                          try { e.currentTarget.showPicker?.(); } catch (err) {}
                        }}
                        className="h-10 bg-white/5 border-white/10 text-white text-xs focus:border-gold/50 focus:ring-gold/20 cursor-pointer [color-scheme:dark]"
                        disabled={loading}
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-white/70">Are you paying fees now? *</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handlePayingNowToggle("yes")}
                          className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                            isPayingNow === "yes"
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 ring-1 ring-emerald-500/30"
                              : "bg-white/5 text-white/60 border-white/10 hover:border-white/20"
                          }`}
                        >
                          Yes, Pay Now (UPI)
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePayingNowToggle("no")}
                          className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                            isPayingNow === "no"
                              ? "bg-amber-500/20 text-amber-400 border-amber-500/40 ring-1 ring-amber-500/30"
                              : "bg-white/5 text-white/60 border-white/10 hover:border-white/20"
                          }`}
                        >
                          Pay Later / Partial
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Fee Amount Entry */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-xs font-semibold text-white/70 flex items-center justify-between">
                      <span>Amount Being Paid (₹)</span>
                      <span className="text-[10px] text-gold font-medium">Total Fee: ₹{totalFee.toLocaleString("en-IN")}</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gold font-semibold text-xs">₹</span>
                      <Input
                        type="text"
                        placeholder="25000"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(e.target.value)}
                        className="pl-8 h-10 bg-white/5 border-white/10 text-white text-xs focus:border-gold/50 focus:ring-gold/20"
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>

                  {/* Remarks */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/70">Optional Student Remarks / Notes</label>
                    <Textarea
                      placeholder="e.g. Timing preference, referral details..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="bg-white/5 border-white/10 text-white text-xs min-h-[50px] resize-none rounded-xl"
                      disabled={loading}
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="px-6 md:px-10 pb-8 flex flex-col space-y-3 border-t border-white/5 bg-white/[0.01] pt-5">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-gold text-gold-foreground hover:bg-gold/90 font-bold transition-all flex items-center justify-center gap-2 rounded-xl text-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating Account & Preparing QR...
                    </>
                  ) : (
                    <>
                      Proceed to Fee Payment & QR Code
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          )}

          {/* ── STEP 2: UPI Payment QR Code & Fallback Screen ──────────────────────────── */}
          {step === 2 && (
            <CardContent className="pt-8 pb-8 px-6 md:px-10 text-center space-y-6">
              {/* Mandatory Prompt Notice as Requested */}
              <div className="p-4 bg-gold/10 border border-gold/30 rounded-xl space-y-1">
                <p className="text-sm font-semibold text-gold leading-relaxed">
                  "Please use this QR code to pay the fees. After the transaction please make a screenshot and come back to the screen here."
                </p>
              </div>

              {/* QR Code Container with Fallback logic */}
              <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 max-w-sm mx-auto space-y-4 shadow-xl relative">
                {/* Fallback Warning Message if QR 1 failed */}
                {activeQrIndex === 2 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-xl text-xs flex items-start gap-2 text-left"
                  >
                    <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-400">Payment Not Completed on Primary QR</p>
                      <p className="text-[11px] text-amber-200/80 mt-0.5">
                        The transaction was not through on the first QR code. Please use this alternate UPI QR code below.
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* QR Code Badge */}
                <div className="flex items-center justify-between text-xs px-1">
                  <span className="text-white/50 font-medium">
                    {activeQrIndex === 1 ? "Primary UPI QR (1 of 2)" : "Alternate UPI QR (2 of 2)"}
                  </span>
                  <span className="bg-gold/20 text-gold font-bold px-2 py-0.5 rounded-md text-[10px] border border-gold/30">
                    ₹{paidAmount}
                  </span>
                </div>

                {/* Dynamic QR Code Render */}
                <div className="bg-white p-4 rounded-xl inline-block shadow-lg mx-auto">
                  <QRCodeSVG
                    value={generateUpiUri(currentUpi)}
                    size={200}
                    level="H"
                    includeMargin={false}
                  />
                </div>

                {/* UPI ID String & Copy Button */}
                <div className="bg-black/60 border border-white/10 rounded-xl p-3 flex items-center justify-between gap-2">
                  <div className="text-left overflow-hidden">
                    <p className="text-[10px] text-white/40 uppercase font-semibold">UPI ID</p>
                    <p className="text-xs font-mono font-bold text-gold truncate">{currentUpi}</p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => copyToClipboard(currentUpi)}
                    variant="outline"
                    className="h-8 px-3 text-xs border-white/15 hover:bg-white/10 shrink-0 text-white"
                  >
                    {copiedUpi ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>

                {/* Mobile Deep Link */}
                <a
                  href={generateUpiUri(currentUpi)}
                  className="block w-full py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-semibold text-white/80 transition-all text-center"
                >
                  📲 Pay directly via Google Pay / PhonePe / Paytm
                </a>
              </div>

              {/* Status Question & Decision Buttons */}
              <div className="border-t border-white/5 pt-5 space-y-4 max-w-md mx-auto">
                <p className="text-xs font-semibold text-white/70">
                  {activeQrIndex === 1 
                    ? "Did your payment process successfully using QR Code 1?" 
                    : "Did your payment process successfully using QR Code 2?"}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    type="button"
                    onClick={() => setStep(3)}
                    className="h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <CheckCircle className="h-4 w-4" />
                    I Paid - Send Screenshot
                  </Button>

                  {activeQrIndex === 1 ? (
                    <Button
                      type="button"
                      onClick={() => {
                        setQr1Failed(true);
                        setActiveQrIndex(2);
                      }}
                      variant="outline"
                      className="h-11 border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className="h-3.5 w-3.5 text-rose-400" />
                      QR 1 Didn't Work / Try QR 2
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => setQr2Failed(true)}
                      variant="outline"
                      className="h-11 border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5"
                    >
                      <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
                      QR 2 Also Didn't Work
                    </Button>
                  )}
                </div>

                {/* Explicit Support Banner Requested when Both QRs Fail */}
                {qr2Failed && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-neutral-900 border border-amber-500/40 rounded-xl space-y-3 text-center"
                  >
                    <p className="text-sm font-bold text-amber-400 flex items-center justify-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      "Text here to get support on payment"
                    </p>
                    <p className="text-xs text-white/60">
                      If UPI payment is not going through, our support team will guide you directly to complete your enrollment.
                    </p>
                    <a
                      href={`https://wa.me/919500298631?text=${encodeURIComponent(
                        `Hi Prime Strike, I tried paying ₹${paidAmount} for ${batchName} but the UPI payment did not work. Please assist me.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs h-10 px-5 rounded-lg transition-all"
                    >
                      <Send className="h-4 w-4" />
                      Contact WhatsApp Support (+91 95002 98631)
                    </a>
                  </motion.div>
                )}
              </div>
            </CardContent>
          )}

          {/* ── STEP 3: WhatsApp Screenshot Confirmation Page ──────────────────────────── */}
          {step === 3 && (
            <CardContent className="pt-10 pb-10 px-6 md:px-10 text-center space-y-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto"
              >
                <CheckCircle className="h-8 w-8" />
              </motion.div>

              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white font-[family-name:var(--font-poppins)]">
                  Final Step: Send Payment Screenshot
                </h2>
                <p className="text-white/60 text-sm max-w-md mx-auto">
                  Thank you, <span className="text-white font-medium">{name}</span>! Your enrollment details for <span className="text-gold font-semibold">{batchName}</span> ({joinedCourse}) have been saved.
                </p>
              </div>

              {/* WhatsApp Action Box */}
              <div className="p-5 bg-neutral-900 border border-white/10 rounded-2xl max-w-md mx-auto space-y-4 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                    <Send className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Send Screenshot on WhatsApp</h3>
                    <p className="text-xs text-white/50">Official WhatsApp: +91 95002 98631</p>
                  </div>
                </div>

                <div className="p-3 bg-black/50 border border-white/5 rounded-xl text-xs text-white/70 leading-relaxed">
                  <p className="font-semibold text-white mb-1">Instructions:</p>
                  <ol className="list-decimal pl-4 space-y-1 text-white/60">
                    <li>Click the button below to open WhatsApp with your pre-filled details.</li>
                    <li>Attach your transaction screenshot in the chat window.</li>
                    <li>Send: <em>"Sir or madam, I have paid this much."</em></li>
                  </ol>
                </div>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm h-12 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all"
                >
                  <Send className="h-4.5 w-4.5" />
                  <span>Open WhatsApp to Send Screenshot (+91 95002 98631)</span>
                </a>
              </div>

              <div className="border-t border-white/5 pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  asChild
                  variant="outline"
                  className="border-white/10 text-white hover:bg-white/5 text-xs h-10 rounded-xl"
                >
                  <Link href="/login">Go to Student Portal Login</Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  className="text-white/40 hover:text-white text-xs h-10"
                >
                  <Link href="/">Back to Home</Link>
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
