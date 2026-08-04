"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { 
  GraduationCap, 
  Mail, 
  Phone, 
  User, 
  Calendar, 
  IndianRupee, 
  BookOpen, 
  Loader2, 
  CheckCircle, 
  Instagram, 
  Send,
  ArrowRight,
  ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";

export default function SurveyPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [batchName, setBatchName] = useState("Batch 3");
  const [joinedCourse, setJoinedCourse] = useState("Basic to Advance");
  const [firstClassDate, setFirstClassDate] = useState("");
  
  // Pricing & Payment mode states
  const [totalFee, setTotalFee] = useState(25000);
  const [paymentMode, setPaymentMode] = useState<"full" | "unpaid" | "custom">("full");
  const [paidAmount, setPaidAmount] = useState("25000");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle course changes with fee auto-fill
  const handleCourseChange = (course: string) => {
    setJoinedCourse(course);
    const fee = course === "Basic to Advance" ? 25000 : 15000;
    setTotalFee(fee);
    if (paymentMode === "full") {
      setPaidAmount(fee.toString());
    } else if (paymentMode === "unpaid") {
      setPaidAmount("0");
    }
  };

  // Handle payment status button toggles
  const handlePaymentModeChange = (mode: "full" | "unpaid" | "custom") => {
    setPaymentMode(mode);
    if (mode === "full") {
      setPaidAmount(totalFee.toString());
    } else if (mode === "unpaid") {
      setPaidAmount("0");
    }
  };

  // Calculated balance
  const numericPaid = parseFloat((paidAmount || "0").toString().replace(/[^0-9.]/g, "")) || 0;
  const balanceAmount = Math.max(0, totalFee - numericPaid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!name || !email || !phone || !joinedCourse || !firstClassDate) {
      setError("Please fill in all required fields (Name, Email, Phone, Joined Course, and First Class Date).");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
          paymentMode,
          notes,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError("Failed to connect to the server. Please check your network.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-16 px-4 md:px-8 relative overflow-hidden flex items-center justify-center">
      {/* Background glowing gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gold/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-neutral-900/50 rounded-full blur-[80px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-2xl relative z-10"
      >
        <Card className="border border-white/10 bg-neutral-950/80 backdrop-blur-md shadow-2xl relative overflow-hidden">
          {/* Top gold gradient accent bar */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

          {success ? (
            <CardContent className="pt-10 pb-8 px-6 md:px-10 text-center space-y-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 text-gold flex items-center justify-center mx-auto"
              >
                <CheckCircle className="h-8 w-8" />
              </motion.div>

              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white font-[family-name:var(--font-poppins)]">
                  Course Registration Received!
                </h2>
                <p className="text-white/60 text-sm max-w-md mx-auto">
                  Thank you, <span className="text-white font-medium">{name}</span>. We have recorded your enrollment for the <span className="text-gold font-semibold">{joinedCourse}</span> course starting on <span className="text-white font-medium">{firstClassDate}</span>.
                </p>
                <p className="text-white/40 text-xs max-w-md mx-auto pt-1">
                  A confirmation email has been sent to <span className="text-gold">{email}</span> from <span className="text-white font-medium">contact@primestrike.co.in</span>. Our team will contact you shortly at <span className="text-white font-medium">{phone}</span> with your class schedule details.
                </p>
              </div>

              <div className="border-t border-white/5 pt-6 space-y-4">
                <h3 className="text-sm font-semibold text-white/80 tracking-wider uppercase">
                  Step 1: Connect with Prime Strike Community
                </h3>
                <p className="text-xs text-white/50">
                  Follow our official channels for daily trade setups, live charts, and webinar alerts:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto">
                  <a
                    href="https://www.instagram.com/prime__strike?igsh=MTBvZTkzdzFjNXA2cw%3D%3D&utm_source=qr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-neutral-900 border border-white/15 hover:bg-pink-500/10 hover:border-pink-500/40 text-white font-medium flex items-center justify-center gap-2 h-11 px-4 transition-all rounded-xl shadow-sm text-xs"
                  >
                    <Instagram className="h-4.5 w-4.5 text-pink-500 shrink-0" />
                    <span>Follow on Instagram</span>
                  </a>

                  <a
                    href="https://t.me/prime_strik"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-neutral-900 border border-white/15 hover:bg-blue-500/10 hover:border-blue-500/40 text-white font-medium flex items-center justify-center gap-2 h-11 px-4 transition-all rounded-xl shadow-sm text-xs"
                  >
                    <Send className="h-4.5 w-4.5 text-blue-400 shrink-0" />
                    <span>Join Telegram Channel</span>
                  </a>
                </div>
              </div>

              <div className="border-t border-white/5 pt-6">
                <h3 className="text-sm font-semibold text-white/80 tracking-wider uppercase mb-3">
                  Step 2: Create Student Portal Account
                </h3>
                <Card className="border border-white/5 bg-white/[0.01] p-4 max-w-md mx-auto text-left space-y-3">
                  <p className="text-xs text-white/60 leading-relaxed">
                    Set up your login credentials on our Student Portal to view webinar recordings, download study guides, and track your progress.
                  </p>
                  <Button
                    asChild
                    className="w-full bg-gold text-gold-foreground hover:bg-gold/90 font-semibold text-xs h-10 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Link href="/signup">
                      Create Student Account
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </Card>
              </div>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardHeader className="space-y-2 text-center pt-8">
                <div className="mx-auto w-12 h-12 rounded-full border border-gold/30 bg-gold/5 flex items-center justify-center mb-2">
                  <GraduationCap className="h-6 w-6 text-gold" />
                </div>
                <CardTitle className="text-2xl md:text-3xl font-bold tracking-tight text-white font-[family-name:var(--font-poppins)]">
                  Joined Course Form
                </CardTitle>
                <CardDescription className="text-white/60 text-sm max-w-md mx-auto">
                  Submit your course selection, first class date, and fee payment details for enrollment.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5 px-6 md:px-10 pb-6">
                {error && (
                  <div className="p-3.5 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-xs flex items-center gap-2">
                    <span className="font-semibold">⚠️ {error}</span>
                  </div>
                )}

                {/* Section 1: Contact Details */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gold uppercase tracking-wider border-b border-white/5 pb-1">
                    1. Contact Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-white/70">Full Name *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                        <Input
                          type="text"
                          placeholder="John Doe"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="pl-9 h-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm focus:border-gold/50 focus:ring-gold/20"
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
                          placeholder="john@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-9 h-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm focus:border-gold/50 focus:ring-gold/20"
                          disabled={loading}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/70">Phone Number (WhatsApp Preferred) *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                      <Input
                        type="tel"
                        placeholder="e.g. +91 95002 98631"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-9 h-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm focus:border-gold/50 focus:ring-gold/20"
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Joined Course Details */}
                <div className="space-y-4 pt-2">
                  <h3 className="text-xs font-bold text-gold uppercase tracking-wider border-b border-white/5 pb-1">
                    2. Joined Course & Batch Details
                  </h3>

                  {/* Batch Selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
                      <GraduationCap className="h-4 w-4 text-gold" />
                      Select Student Batch *
                    </label>
                    <select
                      value={batchName}
                      onChange={(e) => setBatchName(e.target.value)}
                      className="w-full h-10 bg-neutral-900 border border-white/10 rounded-xl text-white text-xs px-3 outline-none focus:border-gold/50 cursor-pointer"
                      disabled={loading}
                    >
                      <option value="Batch 5">Batch 5 (Enrollment Open)</option>
                      <option value="Batch 6">Batch 6 (Enrollment Open)</option>
                      <option value="Batch 4">Batch 4 (Upcoming)</option>
                      <option value="Batch 3">Batch 3 (Active)</option>
                      <option value="Batch 2">Batch 2 (Completed)</option>
                      <option value="Batch 1">Batch 1 (Alumni)</option>
                    </select>
                  </div>

                  {/* Course selection options */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
                        <BookOpen className="h-4 w-4 text-gold" />
                        Select Joined Course *
                      </label>
                      <span className="text-[11px] text-gold font-semibold">
                        Rate: ₹{totalFee.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => handleCourseChange("Basic to Advance")}
                        className={`p-3.5 border rounded-xl text-left transition-all flex flex-col gap-1.5 cursor-pointer ${
                          joinedCourse === "Basic to Advance"
                            ? "bg-gold/10 border-gold text-white ring-1 ring-gold/40"
                            : "border-white/10 bg-white/[0.01] hover:border-white/20 text-white/70"
                        }`}
                        disabled={loading}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">Basic to Advance</span>
                          <span className="text-[10px] bg-gold/20 text-gold font-semibold px-2 py-0.5 rounded-full border border-gold/30">
                            ₹25,000
                          </span>
                        </div>
                        <span className="text-[11px] text-white/50 leading-snug">
                          Complete program covering stock market fundamentals up to advanced options hedging.
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCourseChange("Advance Level")}
                        className={`p-3.5 border rounded-xl text-left transition-all flex flex-col gap-1.5 cursor-pointer ${
                          joinedCourse === "Advance Level"
                            ? "bg-gold/10 border-gold text-white ring-1 ring-gold/40"
                            : "border-white/10 bg-white/[0.01] hover:border-white/20 text-white/70"
                        }`}
                        disabled={loading}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">Advance Level</span>
                          <span className="text-[10px] bg-purple-500/20 text-purple-300 font-semibold px-2 py-0.5 rounded-full border border-purple-500/30">
                            ₹15,000
                          </span>
                        </div>
                        <span className="text-[11px] text-white/50 leading-snug">
                          Master-level price action, options buying/selling strategies, and institutional setups.
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Payment Mode Selection & Amounts */}
                  <div className="space-y-3 pt-1">
                    <label className="text-xs font-semibold text-white/70 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <IndianRupee className="h-4 w-4 text-gold" />
                        Payment Status Mode (Optional Custom Mode)
                      </span>
                      <span className="text-[10px] text-white/40 uppercase tracking-wider">Select payment option</span>
                    </label>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handlePaymentModeChange("full")}
                        className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                          paymentMode === "full"
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 ring-1 ring-emerald-500/30"
                            : "bg-white/5 text-white/60 border-white/10 hover:border-white/20"
                        }`}
                      >
                        Full Paid (₹{totalFee.toLocaleString("en-IN")})
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePaymentModeChange("unpaid")}
                        className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                          paymentMode === "unpaid"
                            ? "bg-rose-500/20 text-rose-400 border-rose-500/40 ring-1 ring-rose-500/30"
                            : "bg-white/5 text-white/60 border-white/10 hover:border-white/20"
                        }`}
                      >
                        Unpaid (₹0)
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePaymentModeChange("custom")}
                        className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                          paymentMode === "custom"
                            ? "bg-gold/20 text-gold border-gold/40 ring-1 ring-gold/30"
                            : "bg-white/5 text-white/60 border-white/10 hover:border-white/20"
                        }`}
                      >
                        Custom Mode
                      </button>
                    </div>

                    {/* Class Date & Paid Input */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-gold" />
                          First Class Date *
                        </label>
                        <div className="relative">
                          <Input
                            type="date"
                            value={firstClassDate}
                            onChange={(e) => setFirstClassDate(e.target.value)}
                            onClick={(e) => {
                              try {
                                e.currentTarget.showPicker?.();
                              } catch (err) {}
                            }}
                            style={{ colorScheme: "dark" }}
                            className="h-10 bg-white/5 border-white/10 text-white text-xs focus:border-gold/50 focus:ring-gold/20 cursor-pointer [color-scheme:dark]"
                            disabled={loading}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-white/70 flex items-center justify-between">
                          <span>Paid Amount (Fees)</span>
                          {paymentMode === "custom" && (
                            <span className="text-[10px] text-gold font-medium">Custom Amount Mode</span>
                          )}
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gold font-semibold text-xs">₹</span>
                          <Input
                            type="text"
                            placeholder="e.g. 15,000"
                            value={paidAmount}
                            onChange={(e) => {
                              setPaidAmount(e.target.value);
                              if (paymentMode !== "custom") {
                                setPaymentMode("custom");
                              }
                            }}
                            className="pl-8 h-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 text-xs focus:border-gold/50 focus:ring-gold/20"
                            disabled={loading}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Live Financial Summary Box */}
                    <div className="p-3 bg-neutral-900/80 border border-white/10 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="text-white/50">Total Fee: </span>
                        <span className="font-semibold text-white">₹{totalFee.toLocaleString("en-IN")}</span>
                        <span className="text-white/30 mx-2">|</span>
                        <span className="text-white/50">Paid Amount: </span>
                        <span className="font-semibold text-emerald-400">₹{numericPaid.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-white/50">Balance Due: </span>
                        <span className={`font-bold ${balanceAmount > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                          ₹{balanceAmount.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Additional Notes */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-xs font-semibold text-white/70">Additional Notes / Student Remarks (Optional)</label>
                    <Textarea
                      placeholder="e.g. Preferred batch timing, specific topics of interest, or payment reference..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 text-xs min-h-[60px] resize-none rounded-xl"
                      disabled={loading}
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="px-6 md:px-10 pb-8 flex flex-col space-y-4 border-t border-white/5 bg-white/[0.01] pt-5">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-gold text-gold-foreground hover:bg-gold/90 hover:shadow-lg hover:shadow-gold/10 font-bold transition-all flex items-center justify-center gap-2 rounded-xl group text-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting Joined Course Details...
                    </>
                  ) : (
                    <>
                      Submit Course Registration
                      <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </Button>
                <p className="text-[10px] text-white/30 text-center">
                  Confirmation email will be dispatched automatically from contact@primestrike.co.in upon submission.
                </p>
              </CardFooter>
            </form>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
