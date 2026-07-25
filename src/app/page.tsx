"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Quote, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatedSection } from "@/components/animated-section";
import { CTA } from "@/components/cta";
import {
  SITE_TAGLINE,
  SITE_DESCRIPTION,
  EXPERTISE_SERVICES,
  CASE_STUDY,
  TESTIMONIALS,
  HOMEPAGE_PROCESS,
  EST_YEAR,
} from "@/lib/constants";

const serviceImages = [
  { src: "/images/service-party.png", alt: "Stock market basics classes in Chennai" },
  { src: "/images/service-corporate.png", alt: "Options and derivatives trading course online" },
  { src: "/images/service-concert.png", alt: "Technical analysis webinar session" },
  { src: "/images/service-wedding.png", alt: "Advanced algorithmic trading mentorship" },
];

export default function HomePage() {
  return (
    <>
      {/* ══════════════════════════════════════════════════
          HERO
          ══════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <Image
          src="/images/hero.png"
          alt="Premium stock market trading chart interface on screen"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />

        <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
          <AnimatedSection>
            <p className="text-xs uppercase tracking-[0.4em] text-gold/60 mb-8 font-[family-name:var(--font-poppins)]">
              Premium Trading Academy &middot; Est. {EST_YEAR} &middot; Chennai
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.08}>
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold text-white font-[family-name:var(--font-poppins)] tracking-tighter leading-[0.9]">
              {SITE_TAGLINE}
            </h1>
          </AnimatedSection>
 
          <AnimatedSection delay={0.16}>
            <p className="mt-8 text-lg md:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
              Master the financial markets through interactive online webinars and direct mentorship.
            </p>
          </AnimatedSection>
 
          <AnimatedSection delay={0.24}>
            <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="text-base px-10 py-6 bg-[#E7B45F] rounded-full group transition-all"
                style={{ color: 'black' }}
              >
                <Link href="/contact">
                  Start Learning

                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="text-base px-10 py-6 border-white/40 text-white hover:bg-white hover:border-white rounded-full backdrop-blur-md transition-all duration-300"
                style={{ transition: 'all 0.3s ease' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'black';
                  e.currentTarget.style.backgroundColor = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Link href="/events" style={{ color: 'inherit' }}>Explore Webinars</Link>
              </Button>
            </div>
          </AnimatedSection>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.3em] text-white/30">Scroll</span>
          <div className="w-[1px] h-8 bg-gradient-to-b from-gold/40 to-transparent" />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          EXPERTISE
          ══════════════════════════════════════════════════ */}
      <section className="py-32 md:py-40 bg-neutral-950 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <AnimatedSection>
            <div className="max-w-xl mb-20">
              <p className="text-xs uppercase tracking-[0.3em] text-gold/50 mb-4 font-[family-name:var(--font-poppins)]">
                Our Programs
              </p>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-[family-name:var(--font-poppins)] tracking-tight leading-[1.05]">
                Trading Course
                <br />
                Curriculum
              </h2>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {EXPERTISE_SERVICES.map((service, i) => (
              <AnimatedSection key={service.title} delay={i * 0.05}>
                <div className="group relative overflow-hidden rounded-2xl cursor-pointer aspect-[4/3]">
                  <Image
                    src={serviceImages[i].src}
                    alt={serviceImages[i].alt}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-all duration-500 group-hover:from-black/90" />
                  <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-10">
                    <h3 className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-poppins)] mb-2 tracking-tight">
                      {service.title}
                    </h3>
                    <p className="text-white/50 text-sm md:text-base leading-relaxed max-w-md opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                      {service.description}
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gold/40 group-hover:text-gold/70 transition-colors">
                      Learn more
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          CASE STUDY
          ══════════════════════════════════════════════════ */}
      <section className="py-0 bg-neutral-950 text-white">
        <div className="grid md:grid-cols-2 min-h-[80vh]">
          <AnimatedSection className="relative overflow-hidden">
            <div className="relative h-full min-h-[50vh] md:min-h-full">
              <Image
                src="/images/case-study.png"
                alt="The Royal Heritage Reception at ITC Grand Chola Chennai"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-neutral-950/30 hidden md:block" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 cursor-pointer hover:bg-white/20 transition-colors group">
                  <Play className="h-8 w-8 text-white ml-1 group-hover:scale-110 transition-transform" />
                </div>
              </div>
            </div>
          </AnimatedSection>

          <div className="flex items-center px-8 md:px-16 lg:px-24 py-20 md:py-0">
            <AnimatedSection delay={0.1}>
              <p className="text-xs uppercase tracking-[0.3em] text-gold/50 mb-6 font-[family-name:var(--font-poppins)]">
                Featured Session
              </p>
              <h2 className="text-4xl md:text-5xl font-bold font-[family-name:var(--font-poppins)] tracking-tight leading-[1.1] mb-8">
                {CASE_STUDY.title}
              </h2>
              <p className="text-white/40 text-lg leading-relaxed mb-10">
                {CASE_STUDY.description}
              </p>
              <div className="flex flex-wrap gap-8 text-sm text-white/30 mb-10">
                <div>
                  <p className="text-2xl font-bold text-gold font-[family-name:var(--font-poppins)]">10k+</p>
                  <p>Students</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gold font-[family-name:var(--font-poppins)]">500+</p>
                  <p>Webinars</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gold font-[family-name:var(--font-poppins)]">92%</p>
                  <p>Success Rate</p>
                </div>
              </div>
              <Button
                asChild
                variant="outline"
                className="border-white/20 text-white hover:bg-white hover:text-black hover:border-white rounded-full px-8 group transition-all duration-300"
              >
                <Link href="/events">
                  View Our Webinars
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          TESTIMONIALS
          ══════════════════════════════════════════════════ */}
      <section className="py-32 md:py-40 bg-neutral-950 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <AnimatedSection>
            <div className="text-center max-w-xl mx-auto mb-20">
              <p className="text-xs uppercase tracking-[0.3em] text-gold/50 mb-4 font-[family-name:var(--font-poppins)]">
                Testimonials
              </p>
              <h2 className="text-4xl md:text-5xl font-bold font-[family-name:var(--font-poppins)] tracking-tight">
                What Our Clients Say
              </h2>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <AnimatedSection key={t.name} delay={i * 0.06}>
                <Card className="h-full bg-white/[0.03] border-white/[0.06] backdrop-blur-sm hover:bg-white/[0.05] transition-colors duration-500">
                  <CardContent className="p-8 flex flex-col gap-6">
                    <Quote className="h-8 w-8 text-gold/20" />
                    <p className="text-white/50 leading-relaxed flex-1 text-[15px]">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <div className="pt-6 border-t border-white/[0.06]">
                      <p className="font-semibold text-sm text-white">{t.name}</p>
                      <p className="text-xs text-gold/40 mt-1">{t.role}</p>
                    </div>
                  </CardContent>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          PROCESS
          ══════════════════════════════════════════════════ */}
      <section className="py-32 md:py-40 bg-neutral-900">
        <div className="mx-auto max-w-7xl px-6">
          <AnimatedSection>
            <div className="text-center max-w-xl mx-auto mb-20">
              <p className="text-xs uppercase tracking-[0.3em] text-gold/50 mb-4 font-[family-name:var(--font-poppins)]">
                How We Work
              </p>
              <h2 className="text-4xl md:text-5xl font-bold text-white font-[family-name:var(--font-poppins)] tracking-tight">
                Our Process
              </h2>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            {HOMEPAGE_PROCESS.map((step, i) => (
              <AnimatedSection key={step.title} delay={i * 0.07}>
                <div className="relative group px-8 py-12 md:py-16 border-l border-white/[0.06] first:border-l-0 md:first:border-l hover:bg-white/[0.02] transition-colors duration-500">
                  <span className="text-7xl md:text-8xl font-bold text-gold/[0.06] font-[family-name:var(--font-poppins)] absolute top-6 right-8 select-none group-hover:text-gold/[0.12] transition-colors duration-500">
                    0{step.step}
                  </span>
                  <div className="relative">
                    <p className="text-xs uppercase tracking-[0.2em] text-gold/30 mb-4">
                      Step 0{step.step}
                    </p>
                    <h3 className="text-2xl font-bold font-[family-name:var(--font-poppins)] text-white mb-4 tracking-tight">
                      {step.title}
                    </h3>
                    <p className="text-sm text-white/35 leading-relaxed max-w-xs">
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
          CTA
          ══════════════════════════════════════════════════ */}
      <CTA
        title="Start Your Trading Journey Today"
        description="From stock market basics to advanced options hedging. Master the markets with interactive live webinars."
        buttonText="Enroll Now"
      />
    </>
  );
}
