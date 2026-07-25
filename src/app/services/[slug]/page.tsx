import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowRight,
  Check,
  MapPin,
  ChevronRight,
  MessageCircle,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getPseoPage,
  getAllPseoSlugs,
  PSEO_PAGES,
} from "@/lib/pseo-data";
import {
  SITE_NAME,
  SITE_PHONE,
  SITE_WHATSAPP,
  FOUNDER_NAME,
} from "@/lib/constants";

/* ─── Static params for build-time generation ─── */

export function generateStaticParams() {
  return getAllPseoSlugs().map((slug) => ({ slug }));
}

/* ─── Dynamic metadata ─── */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = getPseoPage(slug);
  if (!page) return {};

  return {
    title: page.title,
    description: page.metaDescription,
    openGraph: {
      title: page.title,
      description: page.metaDescription,
      type: "website",
      siteName: SITE_NAME,
    },
  };
}

/* ─── FAQ Schema (JSON-LD) ─── */

function FaqSchema({ faqs }: { faqs: { q: string; a: string }[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/* ─── Local Business Schema ─── */

function LocalBusinessSchema({ page }: { page: ReturnType<typeof getPseoPage> }) {
  if (!page) return null;
  const schema = {
    "@context": "https://schema.org",
    "@type": "EventPlanner",
    name: SITE_NAME,
    description: page.metaDescription,
    url: `https://www.cityheights.com/services/${page.slug}`,
    telephone: SITE_PHONE,
    address: {
      "@type": "PostalAddress",
      streetAddress: "No 519 Mkn road",
      addressLocality: "Alandur",
      addressRegion: "Tamil Nadu",
      postalCode: "600016",
      addressCountry: "IN",
    },
    areaServed: {
      "@type": "City",
      name: "Chennai",
    },
    founder: {
      "@type": "Person",
      name: FOUNDER_NAME,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/* ─── Page Component ─── */

export default async function PseoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getPseoPage(slug);
  if (!page) notFound();

  const related = page.relatedSlugs
    .map((s) => PSEO_PAGES.find((p) => p.slug === s))
    .filter(Boolean);

  const whatsappUrl = `https://wa.me/${SITE_WHATSAPP.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hi, I'm interested in ${page.eventType} services in ${page.location}.`)}`;

  return (
    <>
      <FaqSchema faqs={page.faqs} />
      <LocalBusinessSchema page={page} />

      {/* ── Hero ── */}
      <section className="relative bg-neutral-950 pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.03),transparent_60%)]" />
        <div className="relative mx-auto max-w-4xl px-6">
          {/* Breadcrumbs */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-[11px] text-white/25 mb-10 uppercase tracking-widest"
          >
            <Link href="/" className="hover:text-white/50 transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link
              href="/services"
              className="hover:text-white/50 transition-colors"
            >
              Services
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-gold/50">{page.eventType}</span>
          </nav>

          <p className="text-xs uppercase tracking-[0.3em] text-gold/50 mb-4 font-[family-name:var(--font-poppins)]">
            {page.eventType} &middot; {page.location}
          </p>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white font-[family-name:var(--font-poppins)] tracking-tight leading-[1.05] mb-8">
            {page.h1}
          </h1>
          <p className="text-lg md:text-xl text-white/45 leading-relaxed max-w-3xl">
            {page.intro}
          </p>

          {/* Quick CTA */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 h-14 px-8 rounded-full bg-[#25D366] text-white font-semibold text-sm hover:bg-[#22c55e] transition-colors"
            >
              <MessageCircle className="h-5 w-5" />
              Chat on WhatsApp
            </a>
            <a
              href={`tel:${SITE_PHONE}`}
              className="inline-flex items-center justify-center gap-3 h-14 px-8 rounded-full border border-gold/20 text-white font-semibold text-sm hover:bg-gold/10 transition-colors"
            >
              <Phone className="h-5 w-5 text-gold/60" />
              Call {SITE_PHONE}
            </a>
          </div>
        </div>
      </section>

      {/* ── What We Offer ── */}
      <section className="py-24 bg-neutral-900">
        <div className="mx-auto max-w-4xl px-6">
          <p className="text-xs uppercase tracking-[0.3em] text-gold/50 mb-4 font-[family-name:var(--font-poppins)]">
            What We Offer
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white font-[family-name:var(--font-poppins)] tracking-tight mb-12">
            Our {page.eventType} Services
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {page.whatWeOffer.map((item) => (
              <li
                key={item}
                className="flex items-start gap-4 text-white/50"
              >
                <div className="w-6 h-6 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="h-3.5 w-3.5 text-gold/60" />
                </div>
                <span className="text-[15px] leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Why Choose Us ── */}
      <section className="py-24 bg-neutral-950">
        <div className="mx-auto max-w-4xl px-6">
          <p className="text-xs uppercase tracking-[0.3em] text-gold/50 mb-4 font-[family-name:var(--font-poppins)]">
            Why City Heights
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white font-[family-name:var(--font-poppins)] tracking-tight mb-8">
            Why Choose Us
          </h2>
          <p className="text-lg text-white/40 leading-relaxed max-w-3xl">
            {page.whyChooseUs}
          </p>
        </div>
      </section>

      {/* ── Popular Venues ── */}
      <section className="py-24 bg-neutral-900">
        <div className="mx-auto max-w-4xl px-6">
          <p className="text-xs uppercase tracking-[0.3em] text-gold/50 mb-4 font-[family-name:var(--font-poppins)]">
            Recommended Venues
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white font-[family-name:var(--font-poppins)] tracking-tight mb-12">
            Popular Venues in {page.location}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {page.popularVenues.map((venue) => (
              <div
                key={venue}
                className="flex items-center gap-3 p-5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors"
              >
                <MapPin className="h-4 w-4 text-gold/40 flex-shrink-0" />
                <span className="text-sm text-white/60">{venue}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQs ── */}
      <section className="py-24 bg-neutral-950">
        <div className="mx-auto max-w-4xl px-6">
          <p className="text-xs uppercase tracking-[0.3em] text-gold/50 mb-4 font-[family-name:var(--font-poppins)]">
            Common Questions
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white font-[family-name:var(--font-poppins)] tracking-tight mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-8">
            {page.faqs.map((faq) => (
              <div key={faq.q} className="border-b border-white/5 pb-8">
                <h3 className="text-lg font-semibold text-white font-[family-name:var(--font-poppins)] mb-4">
                  {faq.q}
                </h3>
                <p className="text-white/40 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Related Services ── */}
      {related.length > 0 && (
        <section className="py-24 bg-neutral-900">
          <div className="mx-auto max-w-4xl px-6">
            <p className="text-xs uppercase tracking-[0.3em] text-gold/50 mb-4 font-[family-name:var(--font-poppins)]">
              Explore More
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white font-[family-name:var(--font-poppins)] tracking-tight mb-12">
              Related Services
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {related.map(
                (r) =>
                  r && (
                    <Link key={r.slug} href={`/services/${r.slug}`}>
                      <Card className="h-full bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] transition-colors group">
                        <CardContent className="p-6 flex flex-col gap-3">
                          <p className="text-[10px] uppercase tracking-widest text-gold/40">
                            {r.eventType} &middot; {r.location}
                          </p>
                          <h3 className="text-lg font-bold text-white font-[family-name:var(--font-poppins)] tracking-tight group-hover:text-white/80 transition-colors">
                            {r.h1}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-gold/40 group-hover:text-gold/60 transition-colors mt-auto">
                            Learn more
                            <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="py-24 bg-neutral-950">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white font-[family-name:var(--font-poppins)] tracking-tight mb-6">
            Ready to Plan Your {page.eventType}?
          </h2>
          <p className="text-lg text-white/40 mb-10 max-w-lg mx-auto leading-relaxed">
            Get in touch with {FOUNDER_NAME} and the City Heights team. We
            respond to every enquiry within 24 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-gold text-gold-foreground hover:bg-gold/90 px-10 py-6 group"
            >
              <Link href="/contact">
                Send an Enquiry
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 h-14 px-10 rounded-full bg-[#25D366] text-white font-semibold text-sm hover:bg-[#22c55e] transition-colors"
            >
              <MessageCircle className="h-5 w-5" />
              WhatsApp Us
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
