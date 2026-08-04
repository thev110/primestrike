// ─── Types ───────────────────────────────────────────────
export interface NavLink {
  label: string;
  href: string;
}

export interface Service {
  icon: string;
  title: string;
  description: string;
}

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
}

export interface ProcessStep {
  step: number;
  title: string;
  description: string;
}

export interface EventItem {
  title: string;
  tagline: string;
  date?: string;
  location?: string;
  category?: string;
}

export interface BlogPost {
  title: string;
  excerpt: string;
  category: string;
  slug: string;
}

export interface PricingTier {
  name: string;
  price: string;
  features: string[];
  highlight?: boolean;
}

export interface Office {
  city: string;
  detail: string;
}

// ─── Site metadata ───────────────────────────────────────
export const SITE_NAME = "Prime Strike";
export const SITE_TAGLINE = "Learn to trade with confidence";
export const SITE_DESCRIPTION =
  "Interactive trading webinars and online classes in Chennai. Master options trading, technical analysis, and stock market strategies with founder Saranya.";
export const SITE_URL = "https://www.primestrike.co.in";
export const SITE_EMAIL = "contact@primestrike.co.in";
export const SITE_PHONE = "+91 95002 98631";
export const SITE_WHATSAPP = "+91 95002 98631";
export const EST_YEAR = "2024";
export const FOUNDER_NAME = "Saranya";

// ─── Payment UPI Configuration ──────────────────────────
export const PRIMARY_UPI_ID = "studiofoxglove@oksbi";
export const SECONDARY_UPI_ID = "mharinath27@oksb";
export const PAYMENT_SUPPORT_PHONE = "+91 95002 98631";
export const PAYMENT_SUPPORT_WHATSAPP = "https://wa.me/919500298631";

// ─── Student Batches ─────────────────────────────────────
export const STUDENT_BATCHES = [
  { id: "Batch 1", label: "Batch 1 (Alumni)" },
  { id: "Batch 2", label: "Batch 2 (Completed)" },
  { id: "Batch 3", label: "Batch 3 (Active)" },
  { id: "Batch 4", label: "Batch 4 (Upcoming)" },
  { id: "Batch 5", label: "Batch 5 (Enrollment Open)" },
  { id: "Batch 6", label: "Batch 6 (Enrollment Open)" },
];

// ─── Navigation ──────────────────────────────────────────
export const NAV_LINKS: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Join & Pay Fees", href: "/join" },
  { label: "Services", href: "/services" },
  { label: "Contact", href: "/contact" },
];

// ─── Offices ─────────────────────────────────────────────
export const OFFICES: Office[] = [
  { city: "Alandur Office", detail: "No 519 Mkn road Alandur Chennai 600016" },
];

// ─── Social links ────────────────────────────────────────
export const SOCIAL_LINKS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/prime__strike?igsh=MTBvZTkzdzFjNXA2cw%3D%3D&utm_source=qr",
  },
  {
    label: "Telegram",
    href: "https://t.me/prime_strik",
  },
];

// ─── Homepage data ───────────────────────────────────────
export const EXPERTISE_SERVICES: Service[] = [
  {
    icon: "TrendingUp",
    title: "Stock Market Basics",
    description:
      "Simple, structured guidance on equity markets, broker accounts, order types, and basic chart patterns for beginners.",
  },
  {
    icon: "BarChart",
    title: "Options & Derivatives",
    description:
      "Understand option buying, selling, hedging strategies, and volatility analysis to protect and grow your capital.",
  },
  {
    icon: "LineChart",
    title: "Technical Analysis",
    description:
      "Learn price action trading, support and resistance zones, volume profiles, and candlestick setups to identify entry points.",
  },
  {
    icon: "Cpu",
    title: "Algorithmic Trading",
    description:
      "Build systematic trading models, code basic backtests, and manage execution rules to eliminate emotional biases.",
  },
];

export const CASE_STUDY = {
  title: "Live Trading Session Analysis",
  description:
    "An interactive session with over 500 active participants where we analyzed live price action and executed trades based on our core setups. We detailed risk management parameters, position sizing, and exit rules in real-time.",
};

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "The options buying strategies taught by Saranya changed how I look at risk. The live webinars make the concepts incredibly practical and easy to follow.",
    name: "Karthik Raja",
    role: "Retail Trader, Chennai",
  },
  {
    quote:
      "I tried learning from videos for a year with mixed results. The structured course at Prime Strike helped me build a consistent and disciplined trading plan.",
    name: "Shalini Sen",
    role: "Working Professional, Online Batch",
  },
  {
    quote:
      "Complex technical indicators were simplified during the sessions. The focus on trading psychology helped me control my emotional trades.",
    name: "Dinesh Kumar",
    role: "Full-time Trader, Nungambakkam",
  },
];

export const HOMEPAGE_PROCESS: ProcessStep[] = [
  {
    step: 1,
    title: "Structured Webinars",
    description:
      "Join our live webinars covering core trading theories, options strategies, and risk management guidelines.",
  },
  {
    step: 2,
    title: "Interactive Mentoring",
    description:
      "Participate in doubt-solving Q&A sessions and group reviews to fine-tune your chart analysis.",
  },
  {
    step: 3,
    title: "Live Market Practice",
    description:
      "Analyze live market movements under guidance to build real-time execution discipline.",
  },
];

// ─── Services page data ──────────────────────────────────
export const EVENT_CATEGORIES = [
  "Stock Trading",
  "Options Course",
  "Technical Analysis",
  "Algo Webinars",
];

export const CORE_OFFERINGS: {
  title: string;
  description: string;
  features: string[];
}[] = [
  {
    title: "Interactive Webinar Learning",
    description:
      "We provide access to high-quality live webinars where you can interact directly with mentors. From live chat questions to real-time chart analysis, we ensure an engaging learning environment.",
    features: [
      "Live Chat & Q&A Sessions",
      "Interactive Chart Reviews",
      "Session Recordings for Revision",
    ],
  },
  {
    title: "One-on-One Mentorship Support",
    description:
      "Accelerate your learning curve with personal reviews. We analyze your trade journals, discuss execution mistakes, and help you refine your trading plan to fit your risk appetite.",
    features: [
      "Trade Journal Audits",
      "Risk Allocation Reviews",
      "Personalized Strategy Feedback",
    ],
  },
];

export const SERVICE_PROCESS: ProcessStep[] = [
  {
    step: 1,
    title: "Foundation Class",
    description:
      "Learn the core concepts of stock markets, broker systems, and risk management tools.",
  },
  {
    step: 2,
    title: "Strategy Webinar",
    description:
      "Participate in interactive webinar sessions where we explain specific trading setups and backtest results.",
  },
  {
    step: 3,
    title: "Live Implementation",
    description:
      "Observe setups forming in the live market and practice drawing key levels with peer review.",
  },
  {
    step: 4,
    title: "Journal Review",
    description:
      "Submit your trade journal for personalized feedback on entries, exits, and emotional discipline.",
  },
];

export const PRICING_TIERS: PricingTier[] = [
  {
    name: "Foundation",
    price: "\u20B99k",
    features: [
      "Access to Beginner Webinars",
      "Basic Price Action Guide",
      "Q&A Session Access",
      "1-Month Community Access",
    ],
  },
  {
    name: "Pro Trader",
    price: "\u20B925k",
    highlight: true,
    features: [
      "Advanced Options Webinars",
      "Technical Indicator Setup",
      "Weekly Live Trading Rooms",
      "3-Month Mentorship Support",
    ],
  },
  {
    name: "Elite Club",
    price: "Custom",
    features: [
      "One-on-One Portfolio Audits",
      "Algorithmic Trading Coding",
      "Direct Mentor Chat Support",
      "12-Month Advanced Workshops",
    ],
  },
];

// ─── Events page data ────────────────────────────────────
export const FEATURED_EVENT: EventItem = {
  title: "Options Trading Masterclass",
  tagline:
    "An intensive webinar covering option chain analysis, hedging strategies, and risk mitigation setups for Indian markets.",
  date: "April 12, 2026",
  location: "Online Webinar",
  category: "Options",
};

export const UPCOMING_EVENTS: EventItem[] = [
  {
    title: "Price Action Bootcamp",
    tagline:
      "Learn to identify support, resistance, and breakout patterns without relying on lagging indicators.",
    date: "April 26, 2026",
    location: "Online Webinar",
    category: "Technical Analysis",
  },
  {
    title: "Trading Psychology Seminar",
    tagline:
      "How to manage fear and greed, stick to your position sizing, and maintain discipline during drawdowns.",
    date: "May 17, 2026",
    location: "Nungambakkam Center & Online",
    category: "Psychology",
  },
  {
    title: "Algorithmic Strategies Workshop",
    tagline:
      "An introduction to python trading APIs, database storage, and systematic execution setups.",
    date: "June 8, 2026",
    location: "Online Webinar",
    category: "Algo Trading",
  },
];

// ─── Blog page data ──────────────────────────────────────
export const FEATURED_ARTICLE: BlogPost = {
  title: "Understanding Option Chain Analysis in 2026",
  excerpt:
    "A guide to reading Open Interest (OI) changes, volume shifts, and implied volatility to gauge market direction.",
  category: "Options Trading",
  slug: "option-chain-analysis-2026",
};

export const BLOG_POSTS: BlogPost[] = [
  {
    title: "Risk Management Rules Every Trader Must Follow",
    excerpt:
      "Why protecting your capital with stop losses and proper position sizing is more important than finding perfect entries.",
    category: "Trading Basics",
    slug: "risk-management-rules",
  },
  {
    title: "How to Build a Trading Plan from Scratch",
    excerpt:
      "A step-by-step checklist to define your trading hours, asset list, setups, risk limits, and journaling process.",
    category: "Guides",
    slug: "build-trading-plan",
  },
  {
    title: "Reading Candlestick Patterns in Live Markets",
    excerpt:
      "How to confirm hammer, engulfing, and star patterns in context instead of trading them in isolation.",
    category: "Technical Analysis",
    slug: "reading-candlestick-patterns",
  },
];

export const BLOG_CATEGORIES = [
  "All Posts",
  "Trading Basics",
  "Options Trading",
  "Guides",
];

export const EVENT_TIPS = [
  {
    title: "Setting Up Your Broker Platform",
    description:
      "How to set up bracket orders, stop loss triggers, and chart intervals for efficient intraday execution.",
  },
  {
    title: "Avoiding Emotional Trading Pitfalls",
    description:
      "Practical tips to prevent revenge trading, FOMO entries, and holding onto losing positions too long.",
  },
];
