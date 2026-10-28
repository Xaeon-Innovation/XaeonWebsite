/**
 * Starting catalog for the Website Builder: plans and add-on prices from
 * "Xaeon Website Builder  Product, Technical, and Pricing Plan.md", plus 3 templates per launch category.
 * Used by scripts/seed-builder.ts and the backend tests.
 * Template names are brand-style names, kept in Latin script in both languages. Everything is editable later in the admin panel.
 */
import type { BuilderCategory, CornerStyle, HeroStyle, Localized, PageKey, PlanTier, Prices, TemplateLayout, ThemeMode } from "../src/models/builderShared";

const L = (en: string, ar: string): Localized => ({ en, ar });
const P = (egp: [number, number], aed: [number, number], usd: [number, number]): Prices => ({
  EGP: { setup: egp[0], monthly: egp[1] },
  AED: { setup: aed[0], monthly: aed[1] },
  USD: { setup: usd[0], monthly: usd[1] },
});

export const PLANS: {
  tier: PlanTier;
  name: Localized;
  summary: Localized;
  prices: Prices;
  includedPages: number;
  quoted: boolean;
  highlighted: boolean;
  features: Localized[];
}[] = [
  {
    tier: "launch",
    name: L("Launch", "انطلاق"),
    summary: L("A polished one-page site, launched for you.", "موقع من صفحة واحدة، نطلقه لك باحتراف."),
    prices: P([7500, 650], [950, 75], [275, 21]),
    includedPages: 1,
    quoted: false,
    highlighted: false,
    features: [
      L("One-page site, one language", "موقع من صفحة واحدة بلغة واحدة"),
      L("Your brand kit applied", "تطبيق هويتك البصرية"),
      L("Contact & WhatsApp buttons", "أزرار التواصل وواتساب"),
      L("Custom domain, SSL & hosting", "نطاق خاص وشهادة SSL واستضافة"),
      L("Basic SEO", "تحسين أساسي لمحركات البحث"),
    ],
  },
  {
    tier: "business",
    name: L("Business", "أعمال"),
    summary: L("A complete bilingual business website.", "موقع أعمال متكامل بلغتين."),
    prices: P([16500, 1550], [2250, 185], [625, 51]),
    includedPages: 5,
    quoted: false,
    highlighted: true,
    features: [
      L("Up to 5 pages", "حتى 5 صفحات"),
      L("Two languages (Arabic & English)", "لغتان (عربي وإنجليزي)"),
      L("Blog or services CMS", "مدونة أو إدارة محتوى الخدمات"),
      L("Forms & analytics", "النماذج والتحليلات"),
      L("One standard integration", "ربط قياسي واحد"),
    ],
  },
  {
    tier: "growth",
    name: L("Growth", "نمو"),
    summary: L("Operations built in: booking, catalogue, payments.", "تشغيل متكامل: حجز وكتالوج ومدفوعات."),
    prices: P([29500, 3250], [4950, 385], [1350, 105]),
    includedPages: 15,
    quoted: false,
    highlighted: false,
    features: [
      L("Up to 15 pages, bilingual", "حتى 15 صفحة بلغتين"),
      L("Light dashboard", "لوحة تحكم مبسطة"),
      L("Booking or catalogue", "حجز أو كتالوج منتجات"),
      L("Payment integration", "ربط بوابة دفع"),
      L("Priority support, 5 users", "دعم أولوية و5 مستخدمين"),
    ],
  },
  {
    tier: "custom",
    name: L("Custom", "مخصص"),
    summary: L("Bespoke modules and workflows, scoped with you.", "وحدات وسير عمل مخصصة، نحددها معك."),
    prices: P([60000, 6500], [10000, 750], [2750, 210]),
    includedPages: 30,
    quoted: true,
    highlighted: false,
    features: [
      L("Custom modules & automation", "وحدات وأتمتة مخصصة"),
      L("External APIs & dashboards", "ربط أنظمة خارجية ولوحات متقدمة"),
      L("Higher limits & dedicated scope", "حدود أعلى ونطاق عمل مخصص"),
    ],
  },
];

type AddonSeed = {
  key: string;
  kind: "module" | "service";
  name: Localized;
  description: Localized;
  icon: string;
  prices: Prices;
  quoted?: boolean;
  discountPercent?: number;
  badge?: Localized;
  includedIn?: PlanTier[];
  minPlan?: PlanTier;
  categories?: BuilderCategory[];
};

export const ADDONS: AddonSeed[] = [
  {
    key: "booking",
    kind: "module",
    name: L("Online booking", "الحجز الإلكتروني"),
    description: L("Customers book appointments from your site.", "يحجز عملاؤك المواعيد من موقعك مباشرة."),
    icon: "calendar",
    prices: P([2500, 0], [350, 0], [95, 0]),
    includedIn: ["growth", "custom"],
    categories: ["clinics", "education", "professional", "home-services"],
  },
  {
    key: "payments",
    kind: "module",
    name: L("Online payments", "الدفع الإلكتروني"),
    description: L("Hosted checkout with Kashier, Paymob, Tap or Stripe.", "دفع آمن عبر Kashier أو Paymob أو Tap أو Stripe."),
    icon: "credit-card",
    prices: P([4500, 0], [650, 0], [175, 0]),
    includedIn: ["growth", "custom"],
    categories: ["catalogue", "restaurants", "education"],
  },
  {
    key: "catalogue",
    kind: "module",
    name: L("Product catalogue", "كتالوج المنتجات"),
    description: L("Products and categories with WhatsApp enquiry.", "منتجات وتصنيفات مع طلب عبر واتساب."),
    icon: "shopping-bag",
    prices: P([6000, 0], [850, 0], [230, 0]),
    quoted: true,
    minPlan: "business",
    categories: ["catalogue", "restaurants"],
  },
  {
    key: "blog",
    kind: "module",
    name: L("Blog / CMS", "مدونة وإدارة محتوى"),
    description: L("Publish news, articles and offers yourself.", "انشر الأخبار والمقالات والعروض بنفسك."),
    icon: "newspaper",
    prices: P([3500, 0], [500, 0], [135, 0]),
    includedIn: ["business", "growth", "custom"],
  },
  {
    key: "second-language",
    kind: "module",
    name: L("Second language", "لغة إضافية"),
    description: L("Full Arabic + English with right-to-left layout.", "عربي وإنجليزي كاملان مع تخطيط من اليمين لليسار."),
    icon: "languages",
    prices: P([4500, 0], [600, 0], [170, 0]),
    includedIn: ["business", "growth", "custom"],
  },
  {
    key: "email-automation",
    kind: "module",
    name: L("Email automation", "أتمتة البريد"),
    description: L("Welcome, follow-up and reminder emails.", "رسائل ترحيب ومتابعة وتذكير تلقائية."),
    icon: "mail",
    prices: P([3000, 0], [425, 0], [115, 0]),
    quoted: true,
  },
  {
    key: "dashboard",
    kind: "module",
    name: L("Business dashboard", "لوحة تحكم للأعمال"),
    description: L("Leads, bookings and orders in one place.", "العملاء والحجوزات والطلبات في مكان واحد."),
    icon: "layout-dashboard",
    prices: P([8000, 0], [1150, 0], [310, 0]),
    quoted: true,
    minPlan: "business",
  },
  {
    key: "ai-content",
    kind: "module",
    name: L("AI content pack", "باقة محتوى بالذكاء الاصطناعي"),
    description: L("Draft page copy in both languages, reviewed by us.", "صياغة نصوص الصفحات باللغتين مع مراجعتنا."),
    icon: "sparkles",
    prices: P([1500, 0], [200, 0], [55, 0]),
  },
  {
    key: "mobile-app",
    kind: "service",
    name: L("Mobile app for your website", "تطبيق جوال لموقعك"),
    description: L("iOS & Android app sharing your site's content and bookings.", "تطبيق iOS وAndroid يشارك محتوى موقعك وحجوزاته."),
    icon: "smartphone",
    prices: P([60000, 0], [9000, 0], [2400, 0]),
    quoted: true,
    discountPercent: 15,
    badge: L("Save 15% with your website", "وفّر 15% مع موقعك"),
  },
  {
    key: "brand-identity",
    kind: "service",
    name: L("Brand identity design", "تصميم الهوية البصرية"),
    description: L("No logo yet? Our designers create your identity.", "ليس لديك شعار؟ يصمم فريقنا هويتك."),
    icon: "palette",
    prices: P([9000, 0], [1300, 0], [350, 0]),
    quoted: true,
  },
  {
    key: "polara",
    kind: "service",
    name: L("Polara HR for your team", "Polara لإدارة فريقك"),
    description: L("Clock-in, shifts, leave and payroll. From $6 per seat a month.", "الحضور والورديات والإجازات والرواتب. من 6$ للموظف شهريًا."),
    icon: "users",
    prices: P([0, 0], [0, 0], [0, 0]),
    quoted: true,
  },
  {
    key: "velora",
    kind: "service",
    name: L("Velora clinic system", "نظام Velora للعيادات"),
    description: L("Appointments, patient records and billing, connected to your site.", "المواعيد وملفات المرضى والفواتير، مرتبطة بموقعك."),
    icon: "stethoscope",
    prices: P([0, 0], [0, 0], [0, 0]),
    quoted: true,
    categories: ["clinics"],
  },
];

type TemplateSeed = {
  slug: string;
  category: BuilderCategory;
  name: string;
  tagline: Localized;
  style: [TemplateLayout, HeroStyle, ThemeMode, CornerStyle];
  colors: [string, string];
  font: string;
  defaultPages: PageKey[];
  goals: string[];
  recommendedAddons: string[];
  minPlan?: PlanTier;
};

/** Pages each industry can choose from, in menu order. */
const CATEGORY_PAGES: Record<BuilderCategory, PageKey[]> = {
  clinics: ["home", "about", "services", "team", "booking", "testimonials", "gallery", "faq", "blog", "contact"],
  beauty: ["home", "services", "pricing", "gallery", "team", "booking", "products", "testimonials", "faq", "contact"],
  fitness: ["home", "schedule", "pricing", "team", "booking", "gallery", "testimonials", "blog", "faq", "contact"],
  education: ["home", "courses", "about", "team", "schedule", "pricing", "gallery", "blog", "faq", "contact"],
  professional: ["home", "about", "services", "team", "projects", "testimonials", "blog", "careers", "faq", "contact"],
  "real-estate": ["home", "listings", "projects", "about", "services", "team", "testimonials", "blog", "faq", "contact"],
  restaurants: ["home", "menu", "about", "gallery", "booking", "testimonials", "careers", "faq", "contact"],
  "home-services": ["home", "services", "projects", "about", "pricing", "testimonials", "faq", "booking", "careers", "contact"],
  catalogue: ["home", "products", "about", "gallery", "testimonials", "faq", "blog", "contact"],
  startups: ["home", "services", "pricing", "about", "testimonials", "team", "blog", "careers", "faq", "contact"],
};

export const TEMPLATES: TemplateSeed[] = [
  // Clinics & healthcare
  { slug: "clinic-care", category: "clinics", name: "Clinic Care", tagline: L("Calm, trustworthy and booking-first.", "هادئ وموثوق والحجز أولًا."), style: ["classic", "split", "light", "soft"], colors: ["#1b7f79", "#0f2f3a"], font: "modern", defaultPages: ["home", "services", "team", "booking", "contact"], goals: ["bookings", "calls"], recommendedAddons: ["booking", "velora"] },
  { slug: "smile-studio", category: "clinics", name: "Smile Studio", tagline: L("Bright and friendly for dental and cosmetic clinics.", "مشرق وودود لعيادات الأسنان والتجميل."), style: ["minimal", "centered", "light", "round"], colors: ["#3b82f6", "#0b1b3a"], font: "rounded", defaultPages: ["home", "services", "gallery", "booking", "contact"], goals: ["bookings"], recommendedAddons: ["booking"] },
  { slug: "medica-plus", category: "clinics", name: "Medica Plus", tagline: L("Multi-specialty centres with many doctors and branches.", "للمراكز متعددة التخصصات والفروع."), style: ["bold", "banner", "light", "sharp"], colors: ["#0e9f6e", "#062a20"], font: "modern", defaultPages: ["home", "about", "services", "team", "booking", "faq", "contact"], goals: ["bookings", "leads"], recommendedAddons: ["booking", "velora", "second-language"], minPlan: "business" },
  { slug: "vita-dark", category: "clinics", name: "Vita", tagline: L("Premium and modern for dermatology and aesthetics.", "فاخر وعصري للجلدية والتجميل."), style: ["classic", "split", "dark", "soft"], colors: ["#22d3ee", "#0b1220"], font: "display", defaultPages: ["home", "services", "gallery", "testimonials", "booking", "contact"], goals: ["bookings", "leads"], recommendedAddons: ["booking"] },

  // Beauty & wellness
  { slug: "glow-salon", category: "beauty", name: "Glow", tagline: L("Soft and elegant for salons and nail studios.", "ناعم وأنيق للصالونات واستوديوهات الأظافر."), style: ["minimal", "centered", "light", "round"], colors: ["#e11d74", "#2a0a18"], font: "serif", defaultPages: ["home", "services", "pricing", "gallery", "booking", "contact"], goals: ["bookings"], recommendedAddons: ["booking"] },
  { slug: "velvet-spa", category: "beauty", name: "Velvet", tagline: L("Dark, warm and luxurious for spas and wellness.", "داكن ودافئ وفاخر للسبا والعناية."), style: ["classic", "split", "dark", "soft"], colors: ["#c9a96e", "#141210"], font: "serif", defaultPages: ["home", "services", "pricing", "booking", "testimonials", "contact"], goals: ["bookings"], recommendedAddons: ["booking", "payments"] },
  { slug: "bloom-studio", category: "beauty", name: "Bloom", tagline: L("Playful colour for makeup artists and beauty brands.", "ألوان مرحة لخبراء المكياج وعلامات التجميل."), style: ["bold", "banner", "light", "round"], colors: ["#f472b6", "#3b0764"], font: "display", defaultPages: ["home", "services", "gallery", "products", "contact"], goals: ["bookings", "sales"], recommendedAddons: ["booking", "catalogue"] },
  { slug: "barber-co", category: "beauty", name: "Barber & Co", tagline: L("Sharp and confident for barbershops and grooming.", "حاد وواثق لصالونات الحلاقة والعناية بالرجال."), style: ["bold", "split", "dark", "sharp"], colors: ["#f59e0b", "#111111"], font: "display", defaultPages: ["home", "services", "pricing", "team", "booking", "contact"], goals: ["bookings", "calls"], recommendedAddons: ["booking"] },

  // Fitness & sports
  { slug: "pulse-gym", category: "fitness", name: "Pulse", tagline: L("High-energy for gyms and CrossFit boxes.", "طاقة عالية للصالات الرياضية."), style: ["bold", "banner", "dark", "sharp"], colors: ["#84cc16", "#0a0a0a"], font: "display", defaultPages: ["home", "schedule", "pricing", "team", "contact"], goals: ["leads", "sales"], recommendedAddons: ["payments", "mobile-app"] },
  { slug: "zen-yoga", category: "fitness", name: "Zen", tagline: L("Calm and airy for yoga and pilates studios.", "هادئ ومريح لاستوديوهات اليوغا والبيلاتس."), style: ["minimal", "centered", "light", "round"], colors: ["#84a98c", "#2f3e46"], font: "rounded", defaultPages: ["home", "schedule", "pricing", "booking", "contact"], goals: ["bookings"], recommendedAddons: ["booking"] },
  { slug: "coach-pro", category: "fitness", name: "Coach Pro", tagline: L("Personal trainers and online coaching programmes.", "للمدربين الشخصيين وبرامج التدريب أونلاين."), style: ["classic", "split", "light", "soft"], colors: ["#ef4444", "#111827"], font: "modern", defaultPages: ["home", "pricing", "testimonials", "booking", "contact"], goals: ["leads", "sales"], recommendedAddons: ["payments", "booking"] },
  { slug: "box-club", category: "fitness", name: "Box Club", tagline: L("Gritty and bold for boxing and martial arts clubs.", "قوي وجريء لأندية الملاكمة والفنون القتالية."), style: ["bold", "split", "dark", "soft"], colors: ["#f97316", "#18181b"], font: "display", defaultPages: ["home", "schedule", "team", "gallery", "contact"], goals: ["leads"], recommendedAddons: ["booking"] },

  // Education & training
  { slug: "campus", category: "education", name: "Campus", tagline: L("Courses, schedules and enrolment for academies.", "الدورات والمواعيد والتسجيل للأكاديميات."), style: ["classic", "split", "light", "soft"], colors: ["#4f46e5", "#1e1b4b"], font: "modern", defaultPages: ["home", "courses", "about", "schedule", "contact"], goals: ["leads", "sales"], recommendedAddons: ["booking", "payments"] },
  { slug: "academy-bold", category: "education", name: "Academy", tagline: L("Energetic and bold for training centres.", "حيوي وجريء لمراكز التدريب."), style: ["bold", "banner", "light", "sharp"], colors: ["#f59e0b", "#1f2937"], font: "display", defaultPages: ["home", "courses", "pricing", "team", "contact"], goals: ["sales", "leads"], recommendedAddons: ["payments", "blog"] },
  { slug: "learn-light", category: "education", name: "Learn Light", tagline: L("Clean and simple for tutors and private lessons.", "نظيف وبسيط للمدرسين والدروس الخاصة."), style: ["minimal", "centered", "light", "round"], colors: ["#0ea5e9", "#0c4a6e"], font: "rounded", defaultPages: ["home", "courses", "booking", "contact"], goals: ["bookings"], recommendedAddons: ["booking"] },
  { slug: "kids-club", category: "education", name: "Kids Club", tagline: L("Cheerful and colourful for nurseries and kids' activities.", "مبهج وملوّن للحضانات وأنشطة الأطفال."), style: ["bold", "centered", "light", "round"], colors: ["#8b5cf6", "#1e1b4b"], font: "rounded", defaultPages: ["home", "about", "schedule", "gallery", "contact"], goals: ["leads", "calls"], recommendedAddons: ["second-language"] },

  // Professional services
  { slug: "counsel", category: "professional", name: "Counsel", tagline: L("Authoritative for law firms and legal advisors.", "رصين لمكاتب المحاماة والمستشارين القانونيين."), style: ["classic", "split", "light", "sharp"], colors: ["#1e3a5f", "#b08d57"], font: "serif", defaultPages: ["home", "about", "services", "team", "contact"], goals: ["leads", "calls"], recommendedAddons: ["blog", "booking"] },
  { slug: "consult-pro", category: "professional", name: "Consult Pro", tagline: L("Confident and results-led for consultancies.", "واثق ويركز على النتائج للاستشارات."), style: ["bold", "banner", "dark", "soft"], colors: ["#72c04f", "#0a0a0a"], font: "display", defaultPages: ["home", "services", "projects", "testimonials", "contact"], goals: ["leads"], recommendedAddons: ["blog", "email-automation"] },
  { slug: "atelier", category: "professional", name: "Atelier", tagline: L("Gallery-like for architects, studios and creatives.", "كالمعرض للمعماريين والاستوديوهات والمبدعين."), style: ["minimal", "centered", "light", "sharp"], colors: ["#111827", "#e5e7eb"], font: "serif", defaultPages: ["home", "projects", "about", "contact"], goals: ["leads"], recommendedAddons: [] },
  { slug: "ledger", category: "professional", name: "Ledger", tagline: L("Clear and dependable for accountants and auditors.", "واضح وموثوق للمحاسبين والمراجعين."), style: ["classic", "split", "light", "soft"], colors: ["#0f766e", "#042f2e"], font: "modern", defaultPages: ["home", "services", "about", "faq", "contact"], goals: ["leads", "calls"], recommendedAddons: ["booking"] },

  // Real estate
  { slug: "skyline", category: "real-estate", name: "Skyline", tagline: L("Luxury developments and premium projects.", "للمشروعات الفاخرة والتطويرات المميزة."), style: ["bold", "banner", "dark", "sharp"], colors: ["#c8a24a", "#0b0f19"], font: "serif", defaultPages: ["home", "projects", "listings", "about", "contact"], goals: ["leads"], recommendedAddons: ["second-language", "dashboard"], minPlan: "business" },
  { slug: "home-finder", category: "real-estate", name: "Home Finder", tagline: L("Brokers and agencies with many listings.", "للوسطاء والوكالات بقوائم عقارات كثيرة."), style: ["classic", "split", "light", "soft"], colors: ["#2563eb", "#0f172a"], font: "modern", defaultPages: ["home", "listings", "services", "team", "contact"], goals: ["leads", "calls"], recommendedAddons: ["catalogue"], minPlan: "business" },
  { slug: "villa", category: "real-estate", name: "Villa", tagline: L("Elegant single-project and resort showcase.", "عرض أنيق لمشروع واحد أو منتجع."), style: ["minimal", "centered", "light", "sharp"], colors: ["#a16207", "#1c1917"], font: "serif", defaultPages: ["home", "projects", "gallery", "contact"], goals: ["leads"], recommendedAddons: ["second-language"] },
  { slug: "compound", category: "real-estate", name: "Compound", tagline: L("Communities, compounds and property management.", "للمجمعات السكنية وإدارة العقارات."), style: ["classic", "banner", "light", "round"], colors: ["#059669", "#022c22"], font: "modern", defaultPages: ["home", "about", "services", "listings", "faq", "contact"], goals: ["leads", "calls"], recommendedAddons: ["dashboard"] },

  // Restaurants & cafés
  { slug: "table", category: "restaurants", name: "Table", tagline: L("Warm and classic for restaurants with reservations.", "دافئ وكلاسيكي للمطاعم مع الحجوزات."), style: ["classic", "split", "light", "soft"], colors: ["#b45309", "#1c1917"], font: "serif", defaultPages: ["home", "menu", "about", "booking", "contact"], goals: ["bookings", "calls"], recommendedAddons: ["booking", "mobile-app"] },
  { slug: "street-bites", category: "restaurants", name: "Street Bites", tagline: L("Loud and fun for fast food and delivery.", "صاخب وممتع للوجبات السريعة والتوصيل."), style: ["bold", "banner", "light", "round"], colors: ["#dc2626", "#7c2d12"], font: "display", defaultPages: ["home", "menu", "gallery", "contact"], goals: ["sales", "calls"], recommendedAddons: ["catalogue", "payments", "mobile-app"] },
  { slug: "cafe-minimal", category: "restaurants", name: "Café", tagline: L("Quiet elegance for cafés and bakeries.", "أناقة هادئة للمقاهي والمخابز."), style: ["minimal", "centered", "light", "round"], colors: ["#78716c", "#292524"], font: "rounded", defaultPages: ["home", "menu", "gallery", "contact"], goals: ["calls"], recommendedAddons: ["catalogue"] },
  { slug: "noir-grill", category: "restaurants", name: "Noir", tagline: L("Moody fine dining and steakhouses.", "أجواء فاخرة للمطاعم الراقية والمشويات."), style: ["classic", "banner", "dark", "sharp"], colors: ["#ea580c", "#0c0a09"], font: "serif", defaultPages: ["home", "menu", "about", "gallery", "booking", "contact"], goals: ["bookings"], recommendedAddons: ["booking"] },

  // Home services & contractors
  { slug: "buildright", category: "home-services", name: "BuildRight", tagline: L("Contractors and construction companies.", "للمقاولين وشركات البناء."), style: ["classic", "split", "light", "sharp"], colors: ["#ea580c", "#1c1917"], font: "modern", defaultPages: ["home", "services", "projects", "about", "contact"], goals: ["leads", "calls"], recommendedAddons: ["booking"] },
  { slug: "fixit-pro", category: "home-services", name: "Fixit Pro", tagline: L("Maintenance and repairs, call-first.", "صيانة وإصلاح، الاتصال أولًا."), style: ["bold", "banner", "light", "soft"], colors: ["#2563eb", "#0f172a"], font: "display", defaultPages: ["home", "services", "pricing", "booking", "contact"], goals: ["calls", "bookings"], recommendedAddons: ["booking", "mobile-app"] },
  { slug: "home-clean", category: "home-services", name: "Home Clean", tagline: L("Fresh and friendly for cleaning and home care.", "منعش وودود للتنظيف والعناية بالمنزل."), style: ["minimal", "centered", "light", "round"], colors: ["#10b981", "#064e3b"], font: "rounded", defaultPages: ["home", "services", "pricing", "booking", "contact"], goals: ["bookings"], recommendedAddons: ["booking", "payments"] },
  { slug: "solar-plus", category: "home-services", name: "Solar Plus", tagline: L("Modern and technical for solar and smart-home installers.", "عصري وتقني لتركيب الطاقة الشمسية والمنازل الذكية."), style: ["bold", "split", "dark", "soft"], colors: ["#facc15", "#0f172a"], font: "modern", defaultPages: ["home", "services", "projects", "faq", "contact"], goals: ["leads"], recommendedAddons: ["email-automation"] },

  // Products & catalogue
  { slug: "showroom", category: "catalogue", name: "Showroom", tagline: L("Products with WhatsApp ordering.", "منتجات مع الطلب عبر واتساب."), style: ["classic", "split", "light", "soft"], colors: ["#7c3aed", "#1e1b4b"], font: "modern", defaultPages: ["home", "products", "about", "contact"], goals: ["catalogue", "calls"], recommendedAddons: ["catalogue", "mobile-app"], minPlan: "business" },
  { slug: "market-bold", category: "catalogue", name: "Market", tagline: L("High-energy retail and offers.", "تجزئة وعروض بطاقة عالية."), style: ["bold", "banner", "light", "sharp"], colors: ["#e11d48", "#111827"], font: "display", defaultPages: ["home", "products", "testimonials", "contact"], goals: ["sales"], recommendedAddons: ["catalogue", "payments"], minPlan: "business" },
  { slug: "shelf", category: "catalogue", name: "Shelf", tagline: L("Calm, image-led product catalogue.", "كتالوج هادئ تقوده الصور."), style: ["minimal", "centered", "light", "sharp"], colors: ["#0f766e", "#134e4a"], font: "serif", defaultPages: ["home", "products", "gallery", "contact"], goals: ["catalogue"], recommendedAddons: ["catalogue"], minPlan: "business" },
  { slug: "luxe", category: "catalogue", name: "Luxe", tagline: L("Dark and premium for jewellery, perfume and fashion.", "داكن وفاخر للمجوهرات والعطور والأزياء."), style: ["minimal", "banner", "dark", "sharp"], colors: ["#d4af37", "#0a0a0a"], font: "serif", defaultPages: ["home", "products", "about", "gallery", "contact"], goals: ["sales", "catalogue"], recommendedAddons: ["catalogue", "payments"], minPlan: "business" },

  // Startups & tech
  { slug: "launchpad", category: "startups", name: "Launchpad", tagline: L("Bold launch page for new products and apps.", "صفحة إطلاق جريئة للمنتجات والتطبيقات الجديدة."), style: ["bold", "banner", "dark", "round"], colors: ["#8b5cf6", "#0b0b1a"], font: "display", defaultPages: ["home", "services", "pricing", "faq", "contact"], goals: ["leads", "sales"], recommendedAddons: ["email-automation", "mobile-app"] },
  { slug: "saas-clean", category: "startups", name: "SaaS Clean", tagline: L("Clear features and pricing for SaaS companies.", "مميزات وأسعار واضحة لشركات البرمجيات."), style: ["minimal", "centered", "light", "soft"], colors: ["#2563eb", "#0f172a"], font: "modern", defaultPages: ["home", "services", "pricing", "testimonials", "blog", "contact"], goals: ["leads", "sales"], recommendedAddons: ["blog", "dashboard"] },
  { slug: "orbit", category: "startups", name: "Orbit", tagline: L("Dark and futuristic for AI and tech teams.", "داكن ومستقبلي لفرق الذكاء الاصطناعي والتقنية."), style: ["classic", "split", "dark", "soft"], colors: ["#72c04f", "#050605"], font: "display", defaultPages: ["home", "services", "about", "careers", "contact"], goals: ["leads"], recommendedAddons: ["blog"] },
  { slug: "app-landing", category: "startups", name: "App Landing", tagline: L("Mobile-app landing page with store buttons.", "صفحة هبوط لتطبيق جوال مع أزرار المتاجر."), style: ["bold", "split", "light", "round"], colors: ["#06b6d4", "#083344"], font: "rounded", defaultPages: ["home", "services", "testimonials", "faq", "contact"], goals: ["sales", "leads"], recommendedAddons: ["mobile-app"] },
];

const LAYOUT_FEATURES: Record<TemplateLayout, Localized[]> = {
  classic: [L("Trust-first layout", "تخطيط يبني الثقة"), L("Sticky call & WhatsApp", "أزرار اتصال وواتساب ثابتة")],
  bold: [L("Big visual hero", "واجهة بصرية كبيرة"), L("Offer banners", "شرائط العروض")],
  minimal: [L("Lots of white space", "مساحات بيضاء مريحة"), L("Fast and light", "سريع وخفيف")],
};
const LAYOUT_TAGS: Record<TemplateLayout, Localized> = { classic: L("Classic", "كلاسيكي"), bold: L("Bold", "جريء"), minimal: L("Minimal", "بسيط") };
const MODE_TAGS: Record<ThemeMode, Localized> = { light: L("Light", "فاتح"), dark: L("Dark", "داكن") };

export function templateDocs() {
  return TEMPLATES.map((t, i) => {
    const [layout, hero, mode, corners] = t.style;
    return {
      slug: t.slug,
      category: t.category,
      name: L(t.name, t.name),
      tagline: t.tagline,
      layout,
      hero,
      mode,
      corners,
      defaultBrand: { primary: t.colors[0], accent: t.colors[1], font: t.font },
      pageKeys: CATEGORY_PAGES[t.category],
      defaultPages: t.defaultPages,
      tags: [LAYOUT_TAGS[layout], MODE_TAGS[mode]],
      goals: t.goals,
      features: LAYOUT_FEATURES[layout],
      recommendedAddons: t.recommendedAddons,
      minPlan: t.minPlan ?? "launch",
      sortOrder: i,
      published: true,
    };
  });
}

export function addonDocs() {
  return ADDONS.map((a, i) => ({
    ...a,
    quoted: a.quoted ?? false,
    discountPercent: a.discountPercent ?? 0,
    includedIn: a.includedIn ?? [],
    categories: a.categories ?? [],
    sortOrder: i,
    published: true,
  }));
}

/** Extra page price (one-time), from the plan document's add-on menu. */
const EXTRA_PAGE_PRICE = { EGP: 1000, AED: 140, USD: 40 };

export function planDocs() {
  return PLANS.map((p, i) => ({ ...p, extraPagePrice: EXTRA_PAGE_PRICE, sortOrder: i, published: true }));
}
