"use client";

import {
  Mail,
  Phone,
  Send,
  MapPin,
  Globe,
  Instagram,
  MessageCircle,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AnimatedSection } from "@/components/animated-section";
import { OFFICES, SITE_EMAIL, SITE_WHATSAPP, SOCIAL_LINKS } from "@/lib/constants";
import { Facebook } from "lucide-react";

export default function ContactPage() {
  return (
    <>
      {/* ══════════════════════════════════════════════════
          HERO
          ══════════════════════════════════════════════════ */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <Image
          src="/images/contact-hero.png"
          alt="Trading course consultation at Prime Strike Chennai"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/90" />

        <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
          <AnimatedSection>
            <p className="text-xs uppercase tracking-[0.4em] text-gold/50 mb-6 font-[family-name:var(--font-poppins)]">
              Get in Touch
            </p>
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold text-white font-[family-name:var(--font-poppins)] tracking-tighter leading-[0.85] mb-8">
              Let&apos;s Learn
              <br />
              Together
            </h1>
            <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed font-light">
              Master Options trading and Technical Analysis. Our Chennai team is here to support your learning journey.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          OFFICES & FORM
          ══════════════════════════════════════════════════ */}
      <section className="py-24 bg-neutral-950">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">

            {/* Left: Our Address */}
            <AnimatedSection>
              <div className="space-y-16">
                <div>
                  <h2 className="text-4xl font-bold text-white font-[family-name:var(--font-poppins)] tracking-tight mb-6">
                    Our Address
                  </h2>
                  <p className="text-white/40 leading-relaxed max-w-md">
                    Based in Chennai for trading mentoring and weekend portfolio reviews.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-10">
                  {OFFICES.map((office) => (
                    <div key={office.city} className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center">
                          <MapPin className="h-4 w-4 text-gold/50" />
                        </div>
                        <h3 className="text-lg font-bold text-white font-[family-name:var(--font-poppins)]">
                          {office.city}
                        </h3>
                      </div>
                      <p className="text-sm text-white/40 pl-11">{office.detail}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-10 border-t border-white/5 space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    <a
                      href={`mailto:${SITE_EMAIL}`}
                      className="flex items-center gap-3 text-white/60 hover:text-gold transition-colors"
                    >
                      <Mail className="h-5 w-5 text-gold/30" />
                      <span className="text-sm">{SITE_EMAIL}</span>
                    </a>
                    <a
                      href={`tel:${SITE_WHATSAPP}`}
                      className="flex items-center gap-3 text-white/60 hover:text-gold transition-colors"
                    >
                      <Phone className="h-5 w-5 text-gold/30" />
                      <span className="text-sm">{SITE_WHATSAPP}</span>
                    </a>
                  </div>

                  <div className="flex items-center gap-4">
                    <a
                      href={SOCIAL_LINKS[0].href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Instagram"
                    >
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full border-gold/10 hover:bg-gold hover:text-gold-foreground hover:border-gold transition-all"
                      >
                        <Instagram className="h-4 w-4" />
                      </Button>
                    </a>
                    <a
                      href={SOCIAL_LINKS[1].href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Facebook"
                    >
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full border-gold/10 hover:bg-gold hover:text-gold-foreground hover:border-gold transition-all"
                      >
                        <Facebook className="h-4 w-4" />
                      </Button>
                    </a>
                    <a
                      href={`https://wa.me/${SITE_WHATSAPP.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="WhatsApp"
                    >
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full border-gold/10 hover:bg-gold hover:text-gold-foreground hover:border-gold transition-all"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            {/* Right: Inquiry Form */}
            <AnimatedSection delay={0.2}>
              <div className="bg-neutral-900 border border-gold/5 p-8 md:p-12 rounded-[2rem] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Globe className="h-32 w-32 text-gold" />
                </div>

                <div className="relative z-10">
                  <h2 className="text-3xl font-bold text-white font-[family-name:var(--font-poppins)] tracking-tight mb-4">
                    Course Enquiry
                  </h2>
                  <p className="text-white/30 text-sm mb-10">
                    Tell us about your trading goals. We respond to every enquiry within 24 hours.
                  </p>

                  <form
                    className="space-y-6"
                    onSubmit={(e) => e.preventDefault()}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-gold/30 ml-4 font-medium">
                          First Name
                        </label>
                        <Input
                          className="rounded-full bg-white/5 border-gold/10 text-white h-14 px-6 focus:border-gold/30"
                          placeholder="Your first name"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-gold/30 ml-4 font-medium">
                          Last Name
                        </label>
                        <Input
                          className="rounded-full bg-white/5 border-gold/10 text-white h-14 px-6 focus:border-gold/30"
                          placeholder="Your last name"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-gold/30 ml-4 font-medium">
                        Email Address
                      </label>
                      <Input
                        type="email"
                        className="rounded-full bg-white/5 border-gold/10 text-white h-14 px-6 focus:border-gold/30"
                        placeholder="you@example.com"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-gold/30 ml-4 font-medium">
                          Course Interest
                        </label>
                        <Input
                          className="rounded-full bg-white/5 border-gold/10 text-white h-14 px-6 focus:border-gold/30"
                          placeholder="Options, Technical Analysis, etc."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-gold/30 ml-4 font-medium">
                          Preferred Batch Date
                        </label>
                        <Input
                          type="date"
                          className="rounded-full bg-white/5 border-gold/10 text-white h-14 px-6 focus:border-gold/30"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-gold/30 ml-4 font-medium">
                        Tell Us About Your Goals
                      </label>
                      <Textarea
                        className="rounded-[2rem] bg-white/5 border-gold/10 text-white p-6 focus:border-gold/30 min-h-[150px]"
                        placeholder="Describe your trading experience, current goals, and any specific questions you have..."
                      />
                    </div>

                    <Button className="w-full rounded-full bg-gold text-gold-foreground hover:bg-gold/90 h-16 font-bold text-base group">
                      Send Enquiry
                      <Send className="ml-2 h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </Button>
                  </form>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          MAP / WATERMARK
          ══════════════════════════════════════════════════ */}
      <section className="py-24 bg-neutral-900 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <AnimatedSection>
            <div className="inline-flex items-center gap-4 text-gold/30 mb-8">
              <MapPin className="h-5 w-5" />
              <span className="text-xs uppercase tracking-[0.5em]">
                Chennai, Tamil Nadu
              </span>
            </div>
            <div className="relative h-[400px] w-full bg-neutral-950 rounded-[3rem] border border-gold/5 overflow-hidden group">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,transparent_100%)]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-8xl md:text-[12rem] font-bold text-gold/[0.03] font-[family-name:var(--font-poppins)] select-none">
                  PRIME STRIKE
                </div>
              </div>
              <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-gold/40 animate-ping" />
              <div className="absolute top-1/3 right-1/3 w-2 h-2 rounded-full bg-gold/40 animate-ping delay-700" />

              <div className="absolute inset-0 flex items-center justify-center p-12">
                <p className="text-white/40 text-lg max-w-xl font-light italic leading-relaxed">
                  &ldquo;Trading is not about being right on every setup. It is about protecting your capital when you are wrong.&rdquo;
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
