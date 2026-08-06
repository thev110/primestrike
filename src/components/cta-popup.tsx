"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { X, MessageCircle, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SITE_WHATSAPP, SITE_PHONE, FOUNDER_NAME } from "@/lib/constants";

const STORAGE_KEY = "ch_popup_dismissed";
const DISMISS_DAYS = 7;
const SCROLL_THRESHOLD = 0.5; // 50% scroll
const TIME_DELAY_MS = 30_000; // 30 seconds

// Marketing popup — only ever runs on public pages, never in the student/admin
// portals or auth/utility routes. On the dashboard its near-invisible backdrop
// (bg-black/50 over a black page) would swallow clicks on the real UI.
const PRIVATE_PATHS = [
  "/dashboard",
  "/admin",
  "/watch",
  "/batch",
  "/agreement",
  "/login",
  "/signup",
  "/f/",
];

function isDismissed(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    return Date.now() - ts < DISMISS_DAYS * 86_400_000;
  } catch {
    return false;
  }
}

function markDismissed() {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    // storage not available
  }
}

const whatsappUrl = `https://wa.me/${SITE_WHATSAPP.replace(/[^0-9]/g, "")}?text=${encodeURIComponent("Hi, I'd like to enquire about the trading classes.")}`;
const phoneUrl = `tel:${SITE_PHONE}`;

export function CTAPopup() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [exitVisible, setExitVisible] = useState(false);
  const shownRef = useRef(false);
  const exitShownRef = useRef(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Don't show on the contact page or any private/authed route.
  const isContactPage = pathname === "/contact";
  const isHidden = isContactPage || PRIVATE_PATHS.some((p) => pathname.startsWith(p));

  const dismiss = useCallback(() => {
    setVisible(false);
    setExitVisible(false);
    markDismissed();
  }, []);

  // Keyboard: Esc to close
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && (visible || exitVisible)) {
        dismiss();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [visible, exitVisible, dismiss]);

  // Scroll + time triggers
  useEffect(() => {
    if (isHidden || isDismissed()) return;

    let timer: NodeJS.Timeout | null = null;

    const onScroll = () => {
      if (shownRef.current) return;
      
      const scrollPercentage = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      
      if (scrollPercentage > 30) {
        shownRef.current = true;
        setVisible(true);
        if (timer) clearTimeout(timer);
        window.removeEventListener("scroll", onScroll);
      }
    };

    // Time-based fallback
    timer = setTimeout(() => {
      if (!shownRef.current) {
        shownRef.current = true;
        setVisible(true);
        window.removeEventListener("scroll", onScroll);
      }
    }, TIME_DELAY_MS);

    window.addEventListener("scroll", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (timer) clearTimeout(timer);
    };
  }, [isHidden]);

  // Exit intent (desktop only)
  useEffect(() => {
    if (isHidden || isDismissed()) return;

    function onMouseLeave(e: MouseEvent) {
      if (
        e.clientY <= 0 &&
        !exitShownRef.current &&
        !visible
      ) {
        exitShownRef.current = true;
        setExitVisible(true);
      }
    }

    document.addEventListener("mouseleave", onMouseLeave);
    return () => document.removeEventListener("mouseleave", onMouseLeave);
  }, [isHidden, visible]);

  const isOpen = visible || exitVisible;
  const isExit = exitVisible && !visible;

  if (isHidden) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            ref={overlayRef}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={dismiss}
            aria-hidden="true"
          />

          {/* Popup */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={
              isExit
                ? "Before you go — get in touch"
                : "Get in touch with Prime Strike"
            }
            className="fixed z-[101] w-[calc(100%-2rem)] max-w-md
              bottom-4 left-1/2 -translate-x-1/2
              md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2
              bg-neutral-900 border border-gold/10 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden"
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Gold accent bar */}
            <div className="h-1 bg-gradient-to-r from-gold/60 via-gold to-gold/60" />

            {/* Close */}
            <button
              onClick={dismiss}
              aria-label="Close popup"
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors z-10"
            >
              <X className="h-4 w-4 text-white/50" />
            </button>

            <div className="p-8 pt-6">
              {/* Headline */}
              <p className="text-xs uppercase tracking-[0.3em] text-gold/50 mb-3 font-[family-name:var(--font-poppins)]">
                {isExit ? "Before you go" : "Plan your event"}
              </p>
              <h3 className="text-2xl md:text-3xl font-bold text-white font-[family-name:var(--font-poppins)] tracking-tight leading-tight mb-3">
                {isExit
                  ? "Have questions? We\u2019re here to help."
                  : "Let\u2019s bring your vision to life"}
              </h3>
              <p className="text-sm text-white/40 leading-relaxed mb-8">
                {isExit
                  ? `Reach out to ${FOUNDER_NAME} directly — no forms, no waiting. We respond instantly.`
                  : `Chat with ${FOUNDER_NAME} on WhatsApp or give us a call. We\u2019ll help you choose the right course in Chennai.`}
              </p>

              {/* CTAs */}
              <div className="flex flex-col gap-3">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 w-full h-14 rounded-full bg-[#25D366] text-white font-semibold text-sm hover:bg-[#22c55e] transition-colors group"
                >
                  <MessageCircle className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  Chat on WhatsApp
                </a>
                <a
                  href={phoneUrl}
                  className="flex items-center justify-center gap-3 w-full h-14 rounded-full bg-white/5 border border-gold/15 text-white font-semibold text-sm hover:bg-gold/10 transition-colors group"
                >
                  <Phone className="h-5 w-5 text-gold/60 group-hover:scale-110 transition-transform" />
                  Call {SITE_PHONE}
                </a>
              </div>

              {/* Dismiss text */}
              <button
                onClick={dismiss}
                className="mt-5 w-full text-center text-xs text-white/25 hover:text-white/40 transition-colors"
              >
                No thanks, maybe later
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
