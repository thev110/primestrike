"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calendar as CalendarIcon, 
  ExternalLink, 
  Instagram, 
  Facebook, 
  BookOpen, 
  FileText, 
  TrendingUp, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Video, 
  Loader2 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import VideoLibrary from "@/components/VideoLibrary";
import HomeworkUpload from "@/components/HomeworkUpload";

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

export default function StudentDashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [fetchingEvents, setFetchingEvents] = useState(true);
  const [homeworkSubmittedDates, setHomeworkSubmittedDates] = useState<string[]>([]);
  
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
      } else if (profile.role !== "student") {
        router.push("/admin");
      }
    }
  }, [user, profile, authLoading, router]);

  // Fetch Events from Supabase
  const fetchEvents = async () => {
    try {
      setFetchingEvents(true);
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("date", { ascending: true });

      if (error) {
        console.error("Error fetching events:", error);
      } else if (data) {
        setEvents(data as EventItem[]);
      }
    } catch (err) {
      console.error("Events fetch exception:", err);
    } finally {
      setFetchingEvents(false);
    }
  };

  // Fetch homework submitted dates for calendar indicators
  const fetchHomeworkSubmittedDates = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("homework_submissions")
        .select("submission_date")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching homework dates:", error);
      } else if (data) {
        setHomeworkSubmittedDates(data.map((row) => row.submission_date));
      }
    } catch (err) {
      console.error("Homework dates exception:", err);
    }
  };

  useEffect(() => {
    if (user && profile?.role === "student") {
      fetchEvents();
      fetchHomeworkSubmittedDates();
    }
  }, [user, profile]);

  // Filter events for the selected date
  useEffect(() => {
    const formattedSelected = selectedDate.toISOString().split("T")[0];
    const filtered = events.filter((e) => e.date === formattedSelected);
    setSelectedDayEvents(filtered);
  }, [selectedDate, events]);

  if (authLoading || !user || !profile || profile.role !== "student") {
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

  // Create array for previous month days to fill starting empty grid cells
  const blankCells = Array(firstDayIndex).fill(null);
  
  // Create array for days of the current month
  const monthCells = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));

  const totalCells = [...blankCells, ...monthCells];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Helper to check if a specific calendar cell date has events
  const hasEventOnDate = (date: Date) => {
    const formattedDate = date.toISOString().split("T")[0];
    return events.some((e) => e.date === formattedDate);
  };

  // Helper to check if homework was submitted on date
  const hasHomeworkOnDate = (date: Date) => {
    const formattedDate = date.toISOString().split("T")[0];
    return homeworkSubmittedDates.includes(formattedDate);
  };

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-16 px-4 md:px-8 relative overflow-hidden">
      {/* Background ambient glows */}
      <div className="absolute top-10 left-10 w-[400px] h-[400px] bg-gold/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-neutral-900/50 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Welcome Header Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 md:p-8 rounded-2xl border border-white/10 bg-gradient-to-r from-neutral-950 via-neutral-900/50 to-neutral-950 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-2xl pointer-events-none" />
          <div className="space-y-2">
            <span className="text-gold text-xs font-semibold uppercase tracking-widest bg-gold/10 px-3 py-1 rounded-full">
              Student Portal
            </span>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white font-[family-name:var(--font-poppins)]">
              Hello, {profile.name || "Trader"}
            </h1>
            <p className="text-white/60 text-sm max-w-xl">
              Upload your daily homework by clicking calendar dates, access your webinars, and review study materials.
            </p>
          </div>
        </motion.div>

        {/* Dashboard Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Column 1 & 2: Calendar Portal & Homework */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border border-white/10 bg-neutral-950/80 backdrop-blur-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-white/5">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2 text-white font-[family-name:var(--font-poppins)]">
                    <CalendarIcon className="h-5 w-5 text-gold" />
                    Student Calendar & Homework Portal
                  </CardTitle>
                  <CardDescription className="text-white/50 text-xs">
                    Click any calendar day to upload homework or check webinars
                  </CardDescription>
                </div>
                
                {/* Month switch buttons */}
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
                {fetchingEvents ? (
                  <div className="h-80 flex flex-col items-center justify-center text-white/40">
                    <Loader2 className="h-6 w-6 animate-spin text-gold mb-2" />
                    Loading calendar events...
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Day Names Header */}
                    <div className="grid grid-cols-7 text-center text-xs font-semibold text-white/40 uppercase tracking-wider pb-2">
                      <div>Sun</div>
                      <div>Mon</div>
                      <div>Tue</div>
                      <div>Wed</div>
                      <div>Thu</div>
                      <div>Fri</div>
                      <div>Sat</div>
                    </div>
                    
                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-2">
                      {totalCells.map((cellDate, idx) => {
                        if (!cellDate) {
                          return <div key={`empty-${idx}`} className="aspect-square" />;
                        }

                        const dayNum = cellDate.getDate();
                        const isSelected = selectedDate.toDateString() === cellDate.toDateString();
                        const hasEvents = hasEventOnDate(cellDate);
                        const hasHomework = hasHomeworkOnDate(cellDate);
                        
                        // Check if it is "today"
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
                            
                            {/* Dot indicators */}
                            <div className="absolute bottom-1.5 flex items-center gap-1">
                              {hasEvents && (
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  isSelected ? "bg-black" : "bg-gold animate-pulse"
                                }`} />
                              )}
                              {hasHomework && (
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  isSelected ? "bg-black" : "bg-emerald-400"
                                }`} />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Indicator Legend */}
                    <div className="flex items-center justify-end gap-5 text-[11px] text-white/50 pt-2 border-t border-white/5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-gold" />
                        <span>Webinar Event</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>Homework Uploaded</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Homework Upload Card Component */}
            <HomeworkUpload
              selectedDate={selectedDate}
              userId={user.id}
              userEmail={user.email || profile.email}
              userName={profile.name}
              onSubmissionChange={fetchHomeworkSubmittedDates}
            />

            {/* Selected day webinars display panel */}
            <Card className="border border-white/10 bg-neutral-950/80 backdrop-blur-md">
              <CardHeader className="border-b border-white/5 py-4">
                <CardTitle className="text-md font-bold text-white font-[family-name:var(--font-poppins)]">
                  Webinar Details — {selectedDate.toLocaleDateString("en-IN", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
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
                      className="space-y-6"
                    >
                      {selectedDayEvents.map((event) => (
                        <div key={event.id} className="p-5 rounded-xl border border-white/10 bg-white/[0.02] space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
                            <div className="space-y-1">
                              <span className="text-[10px] font-semibold tracking-wider text-gold-foreground bg-gold/80 px-2 py-0.5 rounded uppercase">
                                {event.category}
                              </span>
                              <h3 className="text-lg font-semibold text-white">{event.title}</h3>
                            </div>
                            <div className="text-xs text-white/50 space-y-1">
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-gold shrink-0" />
                                <span>{event.time}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-gold shrink-0" />
                                <span>{event.location}</span>
                              </div>
                            </div>
                          </div>
                          
                          <p className="text-sm text-white/70 leading-relaxed">
                            {event.description}
                          </p>

                          {event.link && (
                            <div className="pt-2">
                              <Button 
                                asChild
                                className="bg-gold text-gold-foreground hover:bg-gold/90 h-10 px-5 rounded-lg font-semibold flex items-center gap-2"
                              >
                                <a href={event.link} target="_blank" rel="noopener noreferrer">
                                  <Video className="h-4 w-4" />
                                  Join Zoom Webinar
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-8 text-sm text-white/40"
                    >
                      No webinars scheduled for this date. Click on days with a gold indicator dot to see upcoming sessions.
                    </motion.p>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>

          {/* Column 3: Video library, Resources & Social links */}
          <div className="space-y-8">

            {/* Video Library — request & watch recorded sessions */}
            <VideoLibrary />

            {/* Resources Section */}
            <Card className="border border-white/10 bg-neutral-950/80 backdrop-blur-md">
              <CardHeader className="border-b border-white/5 py-4">
                <CardTitle className="text-md font-bold flex items-center gap-2 text-white font-[family-name:var(--font-poppins)]">
                  <BookOpen className="h-4.5 w-4.5 text-gold" />
                  Premium Learning Vault
                </CardTitle>
                <CardDescription className="text-white/50 text-xs">
                  Exclusive study sheets and tools for students
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 divide-y divide-white/5">
                
                {/* Resource 1 */}
                <div className="py-3 flex items-center justify-between gap-3 group">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-red-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white group-hover:text-gold transition-colors">
                        Options Chain Cheat Sheet
                      </h4>
                      <p className="text-[11px] text-white/40">PDF Document • 2.4 MB</p>
                    </div>
                  </div>
                  <button className="text-white/40 group-hover:text-white p-1 hover:bg-white/5 rounded transition-all">
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>

                {/* Resource 2 */}
                <div className="py-3 flex items-center justify-between gap-3 group">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                      <TrendingUp className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white group-hover:text-gold transition-colors">
                        Trading Risk Calculator
                      </h4>
                      <p className="text-[11px] text-white/40">Excel Scaffold • 1.1 MB</p>
                    </div>
                  </div>
                  <button className="text-white/40 group-hover:text-white p-1 hover:bg-white/5 rounded transition-all">
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>

                {/* Resource 3 */}
                <div className="py-3 flex items-center justify-between gap-3 group">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white group-hover:text-gold transition-colors">
                        Price Action Pattern Book
                      </h4>
                      <p className="text-[11px] text-white/40">PDF Guidebook • 5.7 MB</p>
                    </div>
                  </div>
                  <button className="text-white/40 group-hover:text-white p-1 hover:bg-white/5 rounded transition-all">
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>

              </CardContent>
            </Card>

            {/* Social Media Link Grid */}
            <Card className="border border-white/10 bg-neutral-950/80 backdrop-blur-md">
              <CardHeader className="border-b border-white/5 py-4">
                <CardTitle className="text-md font-bold text-white font-[family-name:var(--font-poppins)]">
                  Connect with Us
                </CardTitle>
                <CardDescription className="text-white/50 text-xs">
                  Follow our social handles for daily trade ideas
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-3">
                <Button 
                  asChild
                  variant="outline"
                  className="w-full h-11 justify-start border-white/10 text-white/80 hover:text-white hover:bg-white/5 flex items-center gap-3 rounded-xl transition-all"
                >
                  <a href="https://www.instagram.com/primestrike_trading/" target="_blank" rel="noopener noreferrer">
                    <Instagram className="h-5 w-5 text-pink-500 shrink-0" />
                    <span>Instagram Profile</span>
                    <span className="ml-auto text-[11px] text-white/40 font-medium">@primestrike_trading</span>
                  </a>
                </Button>
                
                <Button 
                  asChild
                  variant="outline"
                  className="w-full h-11 justify-start border-white/10 text-white/80 hover:text-white hover:bg-white/5 flex items-center gap-3 rounded-xl transition-all"
                >
                  <a href="https://www.facebook.com/primestriketrading/" target="_blank" rel="noopener noreferrer">
                    <Facebook className="h-5 w-5 text-blue-500 shrink-0" />
                    <span>Facebook Page</span>
                    <span className="ml-auto text-[11px] text-white/40 font-medium">Prime Strike Trading</span>
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>

        </div>

      </div>
    </div>
  );
}
