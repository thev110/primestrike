# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server on localhost:3000
npm run build    # Production build
npm start        # Start production server
npm run lint     # Run ESLint
```

## Tech Stack

- **Next.js 16** with App Router, React 19, TypeScript 5
- **Tailwind CSS 4** (PostCSS plugin, OKLCH color variables in globals.css)
- **Shadcn/ui** components in `src/components/ui/` (CVA for variants, tailwind-merge)
- **Framer Motion** for scroll-triggered animations
- **React Compiler** enabled in next.config.ts for auto-memoization
- **Fonts**: Poppins (display) and Inter (body) via next/font

## Architecture

**Path alias**: `@/*` maps to `./src/*`

### Content-Driven Pattern
All site copy, navigation links, testimonials, events, blog posts, pricing tiers, and structured data are centralized in `src/lib/constants.ts`. Pages import from constants rather than hardcoding content. Types/interfaces for all data structures are also defined there.

### Layout
`src/app/layout.tsx` renders Navbar and Footer on every page. Main content has `pt-[73px]` to clear the fixed navbar.

### Pages (App Router)
- `/` — Homepage (hero, expertise cards, case study, testimonials, process steps, founder section, CTA)
- `/services` — Service showcase with pricing tiers (INR)
- `/events` — Event listings with featured event (Chennai venues)
- `/blog` — Blog with client-side category filtering (Chennai-focused content)
- `/contact` — Contact form and enquiry page (two Chennai offices)

### Shared Components
- `AnimatedSection` — Wraps content with Framer Motion fade-in-up animation triggered on scroll (useInView, fires once)
- `SectionHeader` — Reusable section title/subtitle pattern
- `CTA` — Call-to-action section reused across pages

### Styling
- Theme uses CSS custom properties with OKLCH color space in `globals.css`
- Custom `--gold` / `--gold-foreground` brand accent color (warm amber, OKLCH hue 85)
- Dark luxury aesthetic with gold accent touches throughout
- Mobile-first responsive design (`md:`, `lg:` breakpoints)

## Business Context

- **Company**: City Heights Events, Chennai, Tamil Nadu
- **Founder**: Jabes Amirtharaj (event manager + car sales background)
- **Services**: Weddings, corporate events, concerts, festivals
- **Office**: No 519 Mkn road Alandur Chennai 600016
- **Pricing**: INR (₹50k Essential, ₹2L Premium, Custom Elite)

## Current State

- Forms (contact, newsletter) use `e.preventDefault()` with no backend submission
- No CMS — all content lives in constants.ts
- Images use placeholder paths (not real assets yet)
- Some links point to `#` (privacy, terms)
