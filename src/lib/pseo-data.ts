// ─── Programmatic SEO data ───────────────────────────────
// Each entry generates a unique /services/[slug] page targeting
// specific trading course terms.

export interface PseoPage {
  slug: string;
  title: string;
  h1: string;
  metaDescription: string;
  intro: string;
  whatWeOffer: string[];
  whyChooseUs: string;
  popularVenues: string[];
  faqs: { q: string; a: string }[];
  relatedSlugs: string[];
  eventType: string;
  location: string;
}

export const PSEO_PAGES: PseoPage[] = [
  {
    slug: "trading-classes-in-chennai",
    title: "Trading Classes in Chennai | Prime Strike Academy",
    h1: "Trading Classes in Chennai",
    metaDescription:
      "Join interactive trading classes in Chennai. Prime Strike offers live stock market webinars and option trading courses led by Saranya.",
    intro:
      "Learning to trade requires a structured path. Prime Strike has been conducting trading classes for students across Chennai. From basic stock market structures to complex option strategies, our courses led by Saranya focus on building real-time market analysis skills so you can trade with confidence.",
    whatWeOffer: [
      "Live webinars covering price action and market structures",
      "Interactive doubt-solving sessions during market hours",
      "Option buying and selling strategies with risk limits",
      "Step-by-step guidance on setting up charts and indicators",
      "Personal trade journal audits and performance feedback",
    ],
    whyChooseUs:
      "We focus on risk management over finding perfect setups. Our founder Saranya personally conducts the webinars and reviews your trade journals to help you build execution discipline.",
    popularVenues: [
      "Live Online Webinars via Zoom",
      "In-person Meetups at Nungambakkam Office",
      "One-on-One Mentoring Session Rooms",
    ],
    faqs: [
      {
        q: "What is the fee for trading classes in Chennai?",
        a: "Our foundation packages start from ₹9,000 for basic webinars and go up to ₹25,000 for the full Pro Trader mentorship program including live market sessions.",
      },
      {
        q: "Do you offer offline classes?",
        a: "Our main teaching is done via interactive online webinars. However, we hold monthly doubt-clearing sessions and portfolio review meetups at our Nungambakkam office.",
      },
      {
        q: "Who is this course suitable for?",
        a: "The program is structured for beginners who want to start trading systematically, as well as intermediate traders struggling to maintain risk discipline.",
      },
    ],
    relatedSlugs: [
      "options-trading-course-online",
      "stock-market-training-chennai",
      "share-market-classes-nungambakkam",
    ],
    eventType: "Trading Class",
    location: "Chennai",
  },
  {
    slug: "options-trading-course-online",
    title: "Options Trading Course Online | Prime Strike Academy",
    h1: "Options Trading Course Online",
    metaDescription:
      "Learn options trading online. Prime Strike conducts webinar-based options courses covering option chain, hedging, and volatility strategies.",
    intro:
      "Options trading is about managing risk, not just predicting direction. Our online options course covers everything from basic call and put options to complex multi-leg hedging strategies. We show you how to read option chains and manage trades under changing market volatility.",
    whatWeOffer: [
      "Option Greeks analysis (Delta, Gamma, Theta, Vega)",
      "Hedging strategies like spreads, iron condors, and butterflies",
      "Live option chain analysis during market hours",
      "Implied Volatility (IV) and IV Rank analysis",
      "Position sizing guidelines for options buyers and sellers",
    ],
    whyChooseUs:
      "Unlike generic video courses, our classes are interactive online webinars. You can ask questions in real-time and see how strategies are adjusted as the market moves.",
    popularVenues: [
      "Live Interactive Zoom Webinars",
      "Recorded Video Archive for Revision",
      "Discord Trading Community Rooms",
    ],
    faqs: [
      {
        q: "Is options trading risky for beginners?",
        a: "Yes, without proper risk management. That is why our course starts with position sizing and hedging before introducing complex strategies.",
      },
      {
        q: "Do you teach option buying or option selling?",
        a: "We teach both. We explain when to buy options to benefit from momentum and when to sell options to benefit from time decay.",
      },
    ],
    relatedSlugs: [
      "trading-classes-in-chennai",
      "algo-trading-webinars",
      "technical-analysis-webinars",
    ],
    eventType: "Options Course",
    location: "Online",
  },
  {
    slug: "stock-market-training-chennai",
    title: "Stock Market Training in Chennai | Prime Strike",
    h1: "Stock Market Training in Chennai",
    metaDescription:
      "Learn stock market basics and equity trading in Chennai. Master price action and chart reading with Prime Strike webinars.",
    intro:
      "Get a solid foundation in equity markets. Our stock market training program is designed to help beginners understand market mechanics, choose the right broker, read candlestick charts, and place orders systematically.",
    whatWeOffer: [
      "Introduction to stock exchanges and market participants",
      "How to open and configure trading accounts",
      "Basic candlestick patterns and trend analysis",
      "Support and resistance zone plotting",
      "Introduction to delivery and intraday equity trading",
    ],
    whyChooseUs:
      "We avoid complicated jargon. We explain stock market fundamentals in plain Tamil and English, focusing on rules that protect your initial capital.",
    popularVenues: [
      "Live Webinars and Interactive Sessions",
      "Weekend Meetups in Nungambakkam Office",
      "Kolathur Center Discussion Rooms",
    ],
    faqs: [
      {
        q: "Do I need a prior finance background to join?",
        a: "Not at all. The training starts from absolute basics, explaining how shares are traded and how to analyze charts from scratch.",
      },
      {
        q: "How long is the training program?",
        a: "The foundation program spans 4 weeks of live weekend webinars, followed by 1 month of group mentorship support.",
      },
    ],
    relatedSlugs: [
      "trading-classes-in-chennai",
      "share-market-classes-nungambakkam",
      "day-trading-academy-chennai",
    ],
    eventType: "Stock Market Training",
    location: "Chennai",
  },
  {
    slug: "technical-analysis-webinars",
    title: "Technical Analysis Webinars | Prime Strike",
    h1: "Technical Analysis Webinars",
    metaDescription:
      "Master technical analysis and chart reading online. Learn price action, support-resistance, and volume profiles via live webinars.",
    intro:
      "Charts tell a story of buyer and seller behavior. Our technical analysis webinars show you how to read this story without cluttering your screen with lagging indicators. Learn to identify high-probability price action setups and manage your risk systematically.",
    whatWeOffer: [
      "Advanced price action trading setups",
      "Volume Profile and Market Profile analysis",
      "Drawing valid support and resistance zones",
      "Combining moving averages with momentum indicators",
      "Multi-timeframe analysis for intraday trading",
    ],
    whyChooseUs:
      "We focus on clean chart analysis. We teach you to read raw price movements and volume rather than relying on mathematical formulas that lag the market.",
    popularVenues: [
      "Interactive Webinar Platform",
      "Live Market Chart Analysis Rooms",
      "Mentorship Discord Channel",
    ],
    faqs: [
      {
        q: "What indicators do you teach in the webinars?",
        a: "We prioritize raw price action, candlesticks, and volume. We also explain how to use moving averages, RSI, and VWAP as secondary filters.",
      },
      {
        q: "Are the webinars recorded?",
        a: "Yes, all webinar sessions are recorded and uploaded to our student portal for life-long access.",
      },
    ],
    relatedSlugs: [
      "options-trading-course-online",
      "algo-trading-webinars",
      "day-trading-academy-chennai",
    ],
    eventType: "Technical Analysis",
    location: "Online",
  },
  {
    slug: "day-trading-academy-chennai",
    title: "Day Trading Academy in Chennai | Prime Strike",
    h1: "Day Trading Academy in Chennai",
    metaDescription:
      "Professional day trading coaching in Chennai. Learn intraday setups, risk management, and trading psychology with Prime Strike.",
    intro:
      "Day trading requires speed, discipline, and a clear plan. Our Day Trading Academy in Chennai provides a structured curriculum to help you develop intraday setups, understand order flows, and maintain strict risk controls.",
    whatWeOffer: [
      "Intraday chart setups and price patterns",
      "Managing leverage and margin requirements",
      "Pre-market analysis and stock selection checklists",
      "Understanding bid-ask spreads and order books",
      "Trading psychology exercises to control panic",
    ],
    whyChooseUs:
      "We emphasize trading psychology. Having a good setup is only 20% of the game; the other 80% is execution discipline, which we build through journal reviews.",
    popularVenues: [
      "Live Intraday Webinar Rooms",
      "Nungambakkam office trading meetups",
      "Online Interactive Q&A sessions",
    ],
    faqs: [
      {
        q: "Can I day trade while working a full-time job?",
        a: "It is difficult but possible. We teach specific setups that form in the first hour of the market, allowing you to plan your trades early.",
      },
      {
        q: "How much capital do I need to start day trading?",
        a: "We recommend starting with a small capital (e.g., ₹10,000) to practice execution and discipline before committing larger amounts.",
      },
    ],
    relatedSlugs: [
      "trading-classes-in-chennai",
      "technical-analysis-webinars",
      "forex-trading-course-chennai",
    ],
    eventType: "Day Trading",
    location: "Chennai",
  },
  {
    slug: "share-market-classes-nungambakkam",
    title: "Share Market Classes in Nungambakkam, Chennai | Prime Strike",
    h1: "Share Market Classes in Nungambakkam",
    metaDescription:
      "Learn share trading in Alandur, Chennai. Prime Strike offers stock market classes and mentorship at our Alandur office.",
    intro:
      "Looking for structured stock market coaching in Chennai? Our office is at No 519 Mkn road Alandur Chennai 600016. We conduct interactive webinars online and host in-person weekend meetups for student portfolio reviews and strategy discussions.",
    whatWeOffer: [
      "Interactive webinars on stock market basics",
      "In-person weekend mentorship at Alandur",
      "Option strategy workshops and trading setups",
      "Practical exercises in chart analysis",
      "Face-to-face feedback on your trade logs",
    ],
    whyChooseUs:
      "Our location makes it easy to meet in person. If you are stuck with a trading concept or want your trade journal audited, you can schedule an appointment at our Alandur office.",
    popularVenues: [
      "Alandur Office Meeting Rooms",
      "Live Webinar Broadcast System",
      "Central Chennai Trading Meetups",
    ],
    faqs: [
      {
        q: "Where is your office located?",
        a: "We are at No 519 Mkn road Alandur Chennai 600016. You can drop in for weekend portfolio reviews by booking an appointment at +91 95002 98631.",
      },
      {
        q: "Do you teach share market classes in Tamil?",
        a: "Yes, our webinars and mentorship reviews are conducted in both Tamil and English to make learning comfortable for everyone.",
      },
    ],
    relatedSlugs: [
      "trading-classes-in-chennai",
      "stock-market-training-chennai",
      "day-trading-academy-chennai",
    ],
    eventType: "Share Market Class",
    location: "Nungambakkam, Chennai",
  },
  {
    slug: "forex-trading-course-chennai",
    title: "Forex Trading Course in Chennai | Prime Strike",
    h1: "Forex Trading Course in Chennai",
    metaDescription:
      "Learn currency and forex trading in Chennai. Master price action, global macro analysis, and risk controls via webinars.",
    intro:
      "The currency market operates 24 hours a day. Our forex trading course teaches you how to trade major currency pairs and USDINR contracts systematically. Learn to analyze interest rate decisions, global macro events, and price structures.",
    whatWeOffer: [
      "Understanding currency pairs and pip calculations",
      "Trading USDINR and cross-currency contracts",
      "Analyzing global economic calendars and news events",
      "Risk management setups for overnight positions",
      "Using leverage responsibly in currency trading",
    ],
    whyChooseUs:
      "We focus on exchange-traded currency derivatives, ensuring you trade legally and safely on Indian exchanges like NSE and BSE.",
    popularVenues: [
      "Live Evening Webinars",
      "Online Interactive Discussion Rooms",
      "Weekend Macro Review Webinars",
    ],
    faqs: [
      {
        q: "Is forex trading legal in India?",
        a: "Yes, trading currency pairs that are benchmarked against the Indian Rupee (like USDINR, EURINR, GBPINR) is legal on recognized Indian exchanges like NSE and BSE.",
      },
      {
        q: "What are the timings for currency trading?",
        a: "In India, currency derivatives are traded from 9:00 AM to 5:00 PM, which is convenient for working professionals.",
      },
    ],
    relatedSlugs: [
      "trading-classes-in-chennai",
      "day-trading-academy-chennai",
      "technical-analysis-webinars",
    ],
    eventType: "Forex Course",
    location: "Chennai",
  },
  {
    slug: "algo-trading-webinars",
    title: "Algo Trading Webinars | Prime Strike",
    h1: "Algo Trading Webinars",
    metaDescription:
      "Learn systematic trading and algorithmic execution. Prime Strike teaches backtesting, API connection, and automated rules online.",
    intro:
      "Remove emotions from your trading by automating your rules. Our algorithmic trading webinars show you how to code basic setups, backtest them against historical data, and connect them to your broker's API for hands-free execution.",
    whatWeOffer: [
      "Python basics for financial data analysis",
      "Connecting to broker APIs for real-time data and order placement",
      "Backtesting trading strategies against historical charts",
      "Implementing risk limits and circuit breakers in code",
      "Cloud deployment for uninterrupted systematic trading",
    ],
    whyChooseUs:
      "We explain coding step-by-step. Even if you do not have a software background, we show you how to use visual builders and simple Python scripts to automate your setups.",
    popularVenues: [
      "Interactive Webinar Platforms",
      "API Testing Rooms",
      "Code Repository Sharing Portals",
    ],
    faqs: [
      {
        q: "Do I need coding experience to learn algo trading?",
        a: "No. Our webinars start with the absolute basics of Python variables and loops, focusing specifically on what is needed for trading API connections.",
      },
      {
        q: "Do you supply ready-made profitable algo bots?",
        a: "No. We teach you how to write and test your own rules. We believe that using unverified third-party bots is dangerous for your capital.",
      },
    ],
    relatedSlugs: [
      "options-trading-course-online",
      "technical-analysis-webinars",
      "day-trading-academy-chennai",
    ],
    eventType: "Algo Trading",
    location: "Online",
  },
];

/** Lookup a page by slug — used by the dynamic route. */
export function getPseoPage(slug: string): PseoPage | undefined {
  return PSEO_PAGES.find((p) => p.slug === slug);
}

/** All slugs — used by generateStaticParams. */
export function getAllPseoSlugs(): string[] {
  return PSEO_PAGES.map((p) => p.slug);
}
