"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedSection } from "@/components/animated-section";

const processSteps = [
  { num: "01", title: "Foundation Class", description: "Learn the core concepts of stock markets, broker systems, and risk management tools." },
  { num: "02", title: "Strategy Webinar", description: "Participate in interactive webinar sessions where we explain specific trading setups and backtest results." },
  { num: "03", title: "Live Implementation", description: "Observe setups forming in the live market and practice drawing key levels with peer review." },
  { num: "04", title: "Journal Review", description: "Submit your trade journal for personalized feedback on entries, exits, and emotional discipline." },
];

export default function ServicesPage() {
  return (
    <>
      {/* ══════════════════════════════════════════════════
          HERO
          ══════════════════════════════════════════════════ */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        <Image
          src="/images/services-hero.png"
          alt="Online trading classes webinar preview"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />

        <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
          <AnimatedSection>
            <p className="text-xs uppercase tracking-[0.4em] text-gold/50 mb-6 font-[family-name:var(--font-poppins)]">
              Our Courses
            </p>
          </AnimatedSection>
          <AnimatedSection delay={0.08}>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white font-[family-name:var(--font-poppins)] tracking-tighter leading-[0.9]">
              Structured Trading
              <br />
              Education
            </h1>
          </AnimatedSection>
          <AnimatedSection delay={0.16}>
            <p className="mt-8 text-lg text-white/45 max-w-xl mx-auto leading-relaxed">
              From stock market basics to advanced options strategies. Learn to analyze risk and trade with confidence.
            </p>
          </AnimatedSection>
          <AnimatedSection delay={0.24}>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="text-base px-10 py-6 bg-gold text-gold-foreground hover:bg-gold/90 rounded-full group"
              >
                <Link href="/contact">
                  Enquire Now
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          PROCESS
          ══════════════════════════════════════════════════ */}
      <section className="py-28 bg-neutral-900">
        <div className="mx-auto max-w-7xl px-6">
          <AnimatedSection>
            <div className="text-center max-w-xl mx-auto mb-20">
              <p className="text-xs uppercase tracking-[0.3em] text-gold/50 mb-4 font-[family-name:var(--font-poppins)]">
                The Prime Strike Way
              </p>
              <h2 className="text-4xl md:text-5xl font-bold text-white font-[family-name:var(--font-poppins)] tracking-tight">
                Our Process
              </h2>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-0">
            {processSteps.map((step, i) => (
              <AnimatedSection key={step.num} delay={i * 0.06}>
                <div className="relative group px-8 py-14 border-l border-white/[0.06] first:border-l-0 md:first:border-l hover:bg-white/[0.02] transition-colors duration-500">
                  <span className="text-7xl font-bold text-gold/[0.06] font-[family-name:var(--font-poppins)] absolute top-4 right-6 select-none group-hover:text-gold/[0.12] transition-colors duration-500">
                    {step.num}
                  </span>
                  <div className="relative">
                    <p className="text-xs uppercase tracking-[0.2em] text-gold/30 mb-3">
                      Step {step.num}
                    </p>
                    <h3 className="text-xl font-bold font-[family-name:var(--font-poppins)] text-white mb-3 tracking-tight">
                      {step.title}
                    </h3>
                    <p className="text-sm text-white/30 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════
          FINAL CTA
          ══════════════════════════════════════════════════ */}
      <section className="py-32 bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <AnimatedSection>
            <h2 className="text-4xl md:text-6xl font-bold text-white font-[family-name:var(--font-poppins)] tracking-tight leading-[1.1]">
              Ready to Start
              <br />
              Your Trading Journey?
            </h2>
          </AnimatedSection>
          <AnimatedSection delay={0.08}>
            <p className="mt-6 text-lg text-white/40 max-w-lg mx-auto leading-relaxed">
              Join Chennai&apos;s structured trading community. Let&apos;s build your market discipline.
            </p>
          </AnimatedSection>
          <AnimatedSection delay={0.16}>
            <Button
              asChild
              size="lg"
              className="mt-10 text-base px-12 py-6 bg-gold text-gold-foreground hover:bg-gold/90 rounded-full group"
            >
              <Link href="/contact">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
