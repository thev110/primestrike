"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { AlertCircle, Lock, Mail, Loader2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState(false);
  
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "";

  const safeNext = nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "";

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      if (profile?.role === "admin") {
        router.push("/admin");
      } else if (profile?.role === "student") {
        router.push(safeNext || "/dashboard");
      }
    }
  }, [user, profile, authLoading, router, safeNext]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoadingState(true);

    if (!email || !password) {
      setError("Please fill in all fields.");
      setLoadingState(false);
      return;
    }

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        setError(loginError.message);
        setLoadingState(false);
        return;
      }

      // Fetch user profile to redirect correctly
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user?.id)
        .single();

      if (profileError) {
        // If profile fetch fails, retry once or default to student dashboard
        console.error("Error fetching user profile:", profileError);
        router.push("/dashboard");
        return;
      }

      if (profileData?.role === "admin") {
        router.push("/admin");
      } else {
        router.push(safeNext || "/dashboard");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error(err);
      setLoadingState(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 pt-20 pb-12 relative overflow-hidden">
      {/* Premium ambient light backgrounds */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gold/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-neutral-900/50 rounded-full blur-[80px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="border border-white/10 bg-neutral-950/80 backdrop-blur-md shadow-2xl relative overflow-hidden">
          {/* Top subtle golden edge highlight */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
          
          <CardHeader className="space-y-2 text-center pt-8">
            <div className="mx-auto w-12 h-12 rounded-full border border-gold/30 bg-gold/5 flex items-center justify-center mb-2">
              <Lock className="h-5 w-5 text-gold" />
            </div>
            <CardTitle className="text-2xl md:text-3xl font-bold tracking-tight text-white font-[family-name:var(--font-poppins)]">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-white/60 text-sm">
              Log in to your Prime Strike account
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 px-6 pb-6">
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="p-3.5 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm flex items-start gap-2.5"
                >
                  <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/70 tracking-wide uppercase">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-gold/50 focus:ring-gold/20 rounded-lg transition-all"
                    disabled={loadingState}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-white/70 tracking-wide uppercase">Password</label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-gold/50 focus:ring-gold/20 rounded-lg transition-all"
                    disabled={loadingState}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loadingState}
                className="w-full h-11 rounded-lg bg-gold text-gold-foreground hover:bg-gold/90 hover:shadow-lg hover:shadow-gold/10 font-semibold transition-all mt-6 flex items-center justify-center gap-2 group"
              >
                {loadingState ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 border-t border-white/5 bg-white/[0.01] px-6 py-5 text-center">
            <p className="text-xs text-white/50">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-gold hover:underline font-medium">
                Create an account
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
