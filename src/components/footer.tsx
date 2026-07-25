import Link from "next/link";
import { Instagram, MapPin, Mail, Phone, Facebook, Send } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  SITE_NAME,
  SITE_EMAIL,
  SITE_PHONE,
  OFFICES,
  NAV_LINKS,
  SOCIAL_LINKS,
  FOUNDER_NAME,
} from "@/lib/constants";

export function Footer() {
  return (
    <footer className="bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold font-[family-name:var(--font-poppins)] mb-4">
              {SITE_NAME}
            </h3>
            <p className="text-sm text-background/60 leading-relaxed mb-6">
              Premium stock market and options trading academy in Chennai by {FOUNDER_NAME}.
            </p>
            <div className="flex gap-3">
              {SOCIAL_LINKS.map(({ label, href }: { label: string; href: string }) => {
                const Icon = label === "Instagram" ? Instagram : label === "Telegram" ? Send : Facebook;
                return (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-background/10 hover:bg-background/20 transition-colors"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4 text-background/80">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-background/60 hover:text-background transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4 text-background/80">
              Contact
            </h4>
            <ul className="space-y-3 text-sm text-background/60">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" />
                <a
                  href={`mailto:${SITE_EMAIL}`}
                  className="hover:text-background transition-colors"
                >
                  {SITE_EMAIL}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" />
                <a
                  href={`tel:${SITE_PHONE}`}
                  className="hover:text-background transition-colors"
                >
                  {SITE_PHONE}
                </a>
              </li>
            </ul>

            <h4 className="text-sm font-semibold uppercase tracking-wider mt-6 mb-3 text-background/80">
              Offices
            </h4>
            <ul className="space-y-2 text-sm text-background/60">
              {OFFICES.map((office) => (
                <li key={office.city} className="flex items-start gap-2">
                  <MapPin className="h-3 w-3 shrink-0 mt-1" />
                  <span>
                    {office.city} — {office.detail}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-10 bg-background/10" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-background/40">
          <p>
            &copy; {new Date().getFullYear()} {SITE_NAME}. All Rights Reserved.
          </p>
          <div className="flex gap-6">
            <Link
              href="#"
              className="hover:text-background/60 transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="#"
              className="hover:text-background/60 transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
