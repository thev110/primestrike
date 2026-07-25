"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, ArrowRight } from "lucide-react";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetClose,
  SheetTitle,
} from "@/components/ui/sheet";
import { NAV_LINKS, SITE_NAME } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const { user, profile, loading, signOut } = useAuth();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 20);
  });


  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50"
      initial={false}
    >
      {/* Animated background layer */}
      <motion.div
        className="absolute inset-0 border-b"
        initial={false}
        animate={{
          backgroundColor: scrolled
            ? "rgba(0, 0, 0, 0.55)"
            : "rgba(0, 0, 0, 0)",
          backdropFilter: scrolled
            ? "blur(16px) saturate(180%)"
            : "blur(0px) saturate(100%)",
          borderColor: scrolled
            ? "rgba(255, 255, 255, 0.08)"
            : "rgba(255, 255, 255, 0)",
        }}
        style={{ WebkitBackdropFilter: scrolled ? "blur(16px) saturate(180%)" : "blur(0px) saturate(100%)" }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      />

      <nav className="relative mx-auto max-w-7xl flex items-center justify-between px-6 h-16 md:h-20">
        {/* ── Logo ── */}
        <Link href="/" className="relative z-10 group">
          <span className="text-xl md:text-2xl font-semibold tracking-tight text-white font-[family-name:var(--font-poppins)] transition-opacity duration-200 group-hover:opacity-80">
            {SITE_NAME}
          </span>
        </Link>

        {/* ── Desktop Navigation ── */}
        <ul className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="relative text-sm font-medium transition-colors duration-200 group"
                >
                  <span
                    className={
                      isActive
                        ? "text-white"
                        : "text-white/50 group-hover:text-white"
                    }
                  >
                    {link.label}
                  </span>
                  {/* Active indicator dot */}
                  {isActive && (
                    <motion.span
                      layoutId="nav-dot"
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gold"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* ── Desktop CTA ── */}
        <div className="hidden md:flex items-center gap-4 relative z-10">
          {loading ? (
            <div className="h-10 w-28 bg-white/5 border border-white/10 rounded-full animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <Button
                asChild
                className="rounded-full px-5 h-10 font-medium bg-white/10 text-white hover:bg-white/20 border border-white/10 transition-all text-sm"
              >
                <Link href={profile?.role === "admin" ? "/admin" : "/dashboard"}>
                  {profile?.role === "admin" ? "Admin Panel" : "Dashboard"}
                </Link>
              </Button>
              <Button
                onClick={signOut}
                variant="ghost"
                className="rounded-full px-4 h-10 font-medium text-white/50 hover:text-white/80 hover:bg-white/5 transition-all text-xs"
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Button
                asChild
                variant="outline"
                className="rounded-full px-5 h-10 font-medium border-gold/45 text-gold hover:bg-gold/5 hover:text-gold transition-all text-sm"
              >
                <Link href="/survey">Joined Course</Link>
              </Button>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Button
                  asChild
                  className="rounded-full px-5 h-10 font-medium bg-gold text-gold-foreground hover:bg-gold/90 hover:shadow-lg hover:shadow-gold/10 transition-shadow duration-300 text-sm"
                >
                  <Link href="/login">Student Portal</Link>
                </Button>
              </motion.div>
            </div>
          )}
        </div>

        {/* ── Mobile Menu ── */}
        <div className="md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <button
                  className="relative z-10 p-2 -mr-2 text-white/70 hover:text-white transition-colors duration-200"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
              }
            />

            <SheetContent
              side="right"
              showCloseButton={true}
              className="w-full sm:max-w-md !bg-neutral-950 !border-l !border-white/5 p-0"
            >
              <SheetTitle className="sr-only">Navigation menu</SheetTitle>

              <div className="flex flex-col h-full px-6 py-10">
          
                {/* Mobile Logo */}
                <div className="mb-12">
                  <span className="text-2xl font-semibold tracking-tight text-white font-[family-name:var(--font-poppins)]">
                    {SITE_NAME}
                  </span>
                </div>

                {/* Mobile Nav Links */}
                <nav className="flex flex-col space-y-6 flex-1">
                  {NAV_LINKS.map((link, i) => {
                    const isActive = pathname === link.href;
                    return (
                      <motion.div
                        key={link.href}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: 0.1 + i * 0.05,
                          duration: 0.3,
                          ease: "easeOut",
                        }}
                      >
                        <SheetClose
                          nativeButton={false}
                          render={
                            <Link
                              href={link.href}
                              className={`text-xl font-medium transition-colors duration-200 block ${
                                isActive
                                  ? "text-white"
                                  : "text-white/40 hover:text-white"
                              }`}
                            >
                              {link.label}
                            </Link>
                          }
                        />
                      </motion.div>
                    );
                  })}
                  {user && (
                    <motion.div
                      key="/dashboard-dynamic"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: 0.1 + NAV_LINKS.length * 0.05,
                        duration: 0.3,
                        ease: "easeOut",
                      }}
                    >
                      <SheetClose
                        nativeButton={false}
                        render={
                          <Link
                            href={profile?.role === "admin" ? "/admin" : "/dashboard"}
                            className={`text-xl font-medium transition-colors duration-200 block ${
                              pathname === "/dashboard" || pathname === "/admin"
                                ? "text-gold"
                                : "text-white/40 hover:text-white"
                            }`}
                          >
                            {profile?.role === "admin" ? "Admin Panel" : "Dashboard"}
                          </Link>
                        }
                      />
                    </motion.div>
                  )}
                </nav>

                {/* Mobile CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.3 }}
                  className="mt-auto pt-10 flex flex-col gap-3"
                >
                  {loading ? (
                    <div className="h-12 w-full bg-white/5 border border-white/10 rounded-lg animate-pulse" />
                  ) : user ? (
                    <Button
                      onClick={() => {
                        signOut();
                        setMobileOpen(false);
                      }}
                      variant="outline"
                      className="w-full h-12 rounded-lg border-white/10 text-white hover:bg-white/5 font-medium text-base"
                    >
                      Sign Out
                    </Button>
                  ) : (
                    <>
                      <SheetClose
                        nativeButton={false}
                        render={
                          <Button
                            asChild
                            className="w-full h-12 rounded-lg bg-gold text-gold-foreground hover:bg-gold/90 font-medium text-base group"
                          >
                            <Link href="/survey">
                              Joined Course
                              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                          </Button>
                        }
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <SheetClose
                          nativeButton={false}
                          render={
                            <Button
                              asChild
                              variant="outline"
                              className="w-full h-11 rounded-lg border-white/10 text-white hover:bg-white/5 font-medium text-sm"
                            >
                              <Link href="/login">Student Portal</Link>
                            </Button>
                          }
                        />
                        <SheetClose
                          nativeButton={false}
                          render={
                            <Button
                              asChild
                              variant="outline"
                              className="w-full h-11 rounded-lg border-white/10 text-white hover:bg-white/5 font-medium text-sm"
                            >
                              <Link href="/contact">Contact Us</Link>
                            </Button>
                          }
                        />
                      </div>
                    </>
                  )}

                  <p className="text-center text-white/20 text-xs mt-6 tracking-wide">
                    Premium Trading Academy
                  </p>
                </motion.div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </motion.header>
  );
}
