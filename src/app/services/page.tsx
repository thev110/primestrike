"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedSection } from "@/components/animated-section";

const categories = [
  { title: "Stock Trading", image: "/images/cat-corporate.png", alt: "Stock market basics coaching" },
  { title: "Options Course", image: "/images/cat-wedding.png", alt: "Advanced options and hedging course" },
  { title: "Technical Analysis", image: "/images/cat-concert.png", alt: "Technical analysis webinar course" },
  { title: "Algo Webinars", image: "/images/cat-festival.png", alt: "Algorithmic systematic trading webinars" },
];

const portfolio = [
  { title: "Options Buying Setup", location: "Online Webinar", image: "/images/port-dubai.png", caption: "A live session analyzing momentum setups and quick scalp executions using price action." },
  { title: "Volume Profile Seminar", location: "Nungambakkam Center", image: "/images/port-singapore.png", caption: "An interactive weekend workshop detailing volume profile support zones and intraday entries." },
  { title: "Basic Equity Guidance", location: "Online Webinar", image: "/images/port-london.png", caption: "A beginner-friendly session showing how to open demat accounts and read basic candlestick structures." },
  { title: "Systematic Algo Coding", location: "Online Webinar", image: "/images/port-ibiza.png", caption: "A live workshop explaining broker APIs and backtesting simple trading scripts using Python." },
];

const offerings = [
  {
    title: "Interactive Webinar Learning",
    description: "We provide access to high-quality live webinars where you can interact directly with mentors. From live chat questions to real-time chart analysis, we ensure an engaging learning environment.",
    bullets: ["Live Chat & Q&A Sessions", "Interactive Chart Reviews", "Session Recordings for Revision"],
    image: "/images/offering-venue.png",
    alt: "Live interactive webinar screen",
  },
  {
    title: "One-on-One Mentorship Support",
    description: "Accelerate your learning curve with personal reviews. We analyze your trade journals, discuss execution mistakes, and help you refine your trading plan to fit your risk appetite.",
    bullets: ["Trade Journal Audits", "Risk Allocation Reviews", "Personalized Strategy Feedback"],
    image: "/images/offering-artist.png",
    alt: "One-on-one trading mentorship review session",
  },
];

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
                <Link href="#categories">
                  Explore Courses
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="text-base px-10 py-6 border-white/20 text-white hover:bg-white/10 rounded-full backdrop-blur-sm"
              >
                <Link href="/contact">Enquire Now</Link>
              </Button>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          EVENT CATEGORIES
          ══════════════════════════════════════════════════ */}
      <section id="categories" className="py-28 bg-neutral-950">
        <div className="mx-auto max-w-7xl px-6">
          <AnimatedSection>
            <div className="max-w-xl mb-16">
              <p className="text-xs uppercase tracking-[0.3em] text-gold/50 mb-4 font-[family-name:var(--font-poppins)]">
                Course Categories
              </p>
              <h2 className="text-4xl md:text-5xl font-bold text-white font-[family-name:var(--font-poppins)] tracking-tight leading-[1.05]">
                Tailored Formats,
                <br />
                Structured Learning
              </h2>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((cat, i) => (
              <AnimatedSection key={cat.title} delay={i * 0.05}>
                <div className="group relative overflow-hidden rounded-2xl cursor-pointer aspect-[3/4]">
                  <Image
                    src={cat.image}
                    alt={cat.alt}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/70 transition-all duration-500" />
                  <div className="absolute inset-0 flex flex-col justify-end p-6">
                    <h3 className="text-xl font-bold text-white font-[family-name:var(--font-poppins)] tracking-tight">
                      {cat.title}
                    </h3>
                    <div className="mt-3 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gold/40 group-hover:text-gold/70 transition-colors">
                      View course
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
          PORTFOLIO
          ══════════════════════════════════════════════════ */}
      <section className="py-28 bg-neutral-900">
        <div className="mx-auto max-w-7xl px-6">
          <AnimatedSection>
            <div className="text-center max-w-xl mx-auto mb-16">
              <p className="text-xs uppercase tracking-[0.3em] text-gold/50 mb-4 font-[family-name:var(--font-poppins)]">
                Webinar Archives
              </p>
              <h2 className="text-4xl md:text-5xl font-bold text-white font-[family-name:var(--font-poppins)] tracking-tight">
                Session Portfolio
              </h2>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {portfolio.map((event, i) => (
              <AnimatedSection key={event.title} delay={i * 0.05}>
                <div className="group relative overflow-hidden rounded-2xl cursor-pointer aspect-[16/10]">
                  <Image
                    src={event.image}
                    alt={`${event.title} at ${event.location}`}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                  <div className="absolute inset-0 flex flex-col justify-end p-8">
                    <div className="flex items-center gap-2 text-xs text-gold/50 mb-2">
                      <MapPin className="h-3 w-3" />
                      {event.location}
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-white font-[family-name:var(--font-poppins)] tracking-tight mb-2">
                      {event.title}
                    </h3>
                    <p className="text-sm text-white/40 max-w-md opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                      {event.caption}
                    </p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          CORE OFFERINGS
          ══════════════════════════════════════════════════ */}
      <section className="py-28 bg-neutral-950">
        <div className="mx-auto max-w-7xl px-6">
          <AnimatedSection>
            <div className="max-w-xl mb-20">
              <p className="text-xs uppercase tracking-[0.3em] text-gold/50 mb-4 font-[family-name:var(--font-poppins)]">
                Core Offerings
              </p>
              <h2 className="text-4xl md:text-5xl font-bold text-white font-[family-name:var(--font-poppins)] tracking-tight leading-[1.05]">
                Why Learn
                <br />
                With Us
              </h2>
            </div>
          </AnimatedSection>

          <div className="flex flex-col gap-24">
            {offerings.map((item, i) => (
              <AnimatedSection key={item.title}>
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center ${i % 2 === 1 ? "md:[direction:rtl]" : ""}`}>
                  <div className="relative overflow-hidden rounded-2xl aspect-[4/3] md:[direction:ltr]">
                    <Image
                      src={item.image}
                      alt={item.alt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                  <div className="md:[direction:ltr]">
                    <h3 className="text-3xl md:text-4xl font-bold text-white font-[family-name:var(--font-poppins)] tracking-tight mb-6">
                      {item.title}
                    </h3>
                    <p className="text-white/40 text-lg leading-relaxed mb-8">
                      {item.description}
                    </p>
                    <ul className="space-y-4">
                      {item.bullets.map((b) => (
                        <li key={b} className="flex items-center gap-3 text-white/60">
                          <div className="w-5 h-5 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                            <Check className="h-3 w-3 text-gold/60" />
                          </div>
                          <span className="text-sm">{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
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
