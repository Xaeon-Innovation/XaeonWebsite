/**
 * Starting catalog for the Website Builder: plans and add-on prices from
 * "Xaeon Website Builder  Product, Technical, and Pricing Plan.md", plus 3 templates per launch category.
 * Used by scripts/seed-builder.ts and the backend tests. Everything is editable later in the admin panel.
 */
import type { BuilderCategory, Localized, PlanTier, Prices, TemplateLayout } from "../src/models/builderShared";

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
  quoted: boolean;
  highlighted: boolean;
  features: Localized[];
}[] = [
  {
    tier: "launch",
    name: L("Launch", "انطلاق"),
    summary: L("A polished one-page site, launched for you.", "موقع من صفحة واحدة، نطلقه لك باحتراف."),
    prices: P([7500, 650], [950, 75], [275, 21]),
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
    key: "extra-pages",
    kind: "module",
    name: L("Extra pages (×3)", "صفحات إضافية (×3)"),
    description: L("Three more standard pages.", "ثلاث صفحات إضافية."),
    icon: "files",
    prices: P([3000, 0], [420, 0], [120, 0]),
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
  layout: TemplateLayout;
  name: Localized;
  tagline: Localized;
  primary: string;
  accent: string;
  font: string;
  minPlan?: PlanTier;
  recommendedAddons: string[];
};

const PAGES: Record<BuilderCategory, Localized[]> = {
  clinics: [L("Home", "الرئيسية"), L("Services", "الخدمات"), L("Doctors", "الأطباء"), L("Book", "احجز"), L("Contact", "تواصل")],
  education: [L("Home", "الرئيسية"), L("Courses", "الدورات"), L("Instructors", "المدربون"), L("Enrol", "سجّل"), L("Contact", "تواصل")],
  professional: [L("Home", "الرئيسية"), L("Services", "الخدمات"), L("About", "من نحن"), L("Insights", "مقالات"), L("Contact", "تواصل")],
  restaurants: [L("Home", "الرئيسية"), L("Menu", "القائمة"), L("Gallery", "المعرض"), L("Reserve", "احجز طاولة"), L("Contact", "تواصل")],
  "home-services": [L("Home", "الرئيسية"), L("Services", "الخدمات"), L("Projects", "المشاريع"), L("Quote", "اطلب عرض سعر"), L("Contact", "تواصل")],
  catalogue: [L("Home", "الرئيسية"), L("Products", "المنتجات"), L("Categories", "التصنيفات"), L("About", "من نحن"), L("Contact", "تواصل")],
};

export const TEMPLATES: TemplateSeed[] = [
  { slug: "clinic-care", category: "clinics", layout: "classic", name: L("Clinic Care", "كلينك كير"), tagline: L("Calm, trustworthy, booking-first.", "هادئ وموثوق والحجز أولًا."), primary: "#1b7f79", accent: "#0f2f3a", font: "modern", recommendedAddons: ["booking", "velora"] },
  { slug: "smile-studio", category: "clinics", layout: "minimal", name: L("Smile Studio", "سمايل ستوديو"), tagline: L("Bright and minimal for dental & beauty.", "مشرق وبسيط لعيادات الأسنان والتجميل."), primary: "#3b82f6", accent: "#0b1b3a", font: "rounded", recommendedAddons: ["booking"] },
  { slug: "medica-plus", category: "clinics", layout: "bold", name: L("Medica Plus", "ميديكا بلس"), tagline: L("Multi-specialty centres with many doctors.", "للمراكز متعددة التخصصات."), primary: "#0e9f6e", accent: "#062a20", font: "modern", minPlan: "business", recommendedAddons: ["booking", "velora", "second-language"] },

  { slug: "campus", category: "education", layout: "classic", name: L("Campus", "كامبس"), tagline: L("Courses, schedules and enrolment.", "الدورات والمواعيد والتسجيل."), primary: "#4f46e5", accent: "#1e1b4b", font: "modern", recommendedAddons: ["booking", "payments"] },
  { slug: "academy-bold", category: "education", layout: "bold", name: L("Academy Bold", "أكاديمي بولد"), tagline: L("Energetic, for training centres.", "حيوي لمراكز التدريب."), primary: "#f59e0b", accent: "#1f2937", font: "display", recommendedAddons: ["payments", "blog"] },
  { slug: "learn-light", category: "education", layout: "minimal", name: L("Learn Light", "ليرن لايت"), tagline: L("Clean pages for tutors and schools.", "صفحات نظيفة للمدرسين والمدارس."), primary: "#0ea5e9", accent: "#0c4a6e", font: "rounded", recommendedAddons: ["booking"] },

  { slug: "counsel", category: "professional", layout: "classic", name: L("Counsel", "كاونسل"), tagline: L("Law, accounting and advisory firms.", "لمكاتب المحاماة والمحاسبة والاستشارات."), primary: "#1e3a5f", accent: "#b08d57", font: "serif", recommendedAddons: ["blog", "booking"] },
  { slug: "consult-pro", category: "professional", layout: "bold", name: L("Consult Pro", "كونسلت برو"), tagline: L("Confident, results-led consultancy.", "استشارات بثقة ونتائج واضحة."), primary: "#72c04f", accent: "#0a0a0a", font: "display", recommendedAddons: ["blog", "email-automation"] },
  { slug: "atelier", category: "professional", layout: "minimal", name: L("Atelier", "أتيليه"), tagline: L("Studios, architects and creatives.", "للاستوديوهات والمعماريين والمبدعين."), primary: "#111827", accent: "#e5e7eb", font: "serif", recommendedAddons: ["extra-pages"] },

  { slug: "table", category: "restaurants", layout: "classic", name: L("Table", "تيبل"), tagline: L("Menus, reservations and location.", "القائمة والحجوزات والموقع."), primary: "#b45309", accent: "#1c1917", font: "serif", recommendedAddons: ["booking", "mobile-app"] },
  { slug: "street-bites", category: "restaurants", layout: "bold", name: L("Street Bites", "ستريت بايتس"), tagline: L("Loud and fun for fast food & delivery.", "جريء وممتع للوجبات السريعة والتوصيل."), primary: "#dc2626", accent: "#facc15", font: "display", recommendedAddons: ["catalogue", "payments", "mobile-app"] },
  { slug: "cafe-minimal", category: "restaurants", layout: "minimal", name: L("Café Minimal", "كافيه مينيمال"), tagline: L("Quiet elegance for cafés and bakeries.", "أناقة هادئة للمقاهي والمخابز."), primary: "#78716c", accent: "#292524", font: "rounded", recommendedAddons: ["catalogue"] },

  { slug: "buildright", category: "home-services", layout: "classic", name: L("BuildRight", "بيلد رايت"), tagline: L("Contractors and construction projects.", "للمقاولين ومشاريع البناء."), primary: "#ea580c", accent: "#1c1917", font: "modern", recommendedAddons: ["extra-pages", "booking"] },
  { slug: "fixit-pro", category: "home-services", layout: "bold", name: L("Fixit Pro", "فيكس إت برو"), tagline: L("Maintenance and repair, call-first.", "صيانة وإصلاح، الاتصال أولًا."), primary: "#2563eb", accent: "#facc15", font: "display", recommendedAddons: ["booking", "mobile-app"] },
  { slug: "home-clean", category: "home-services", layout: "minimal", name: L("Home Clean", "هوم كلين"), tagline: L("Cleaning, gardening and home care.", "التنظيف والحدائق والعناية بالمنزل."), primary: "#10b981", accent: "#064e3b", font: "rounded", recommendedAddons: ["booking", "payments"] },

  { slug: "showroom", category: "catalogue", layout: "classic", name: L("Showroom", "شوروم"), tagline: L("Products with WhatsApp ordering.", "منتجات مع الطلب عبر واتساب."), primary: "#7c3aed", accent: "#1e1b4b", font: "modern", minPlan: "business", recommendedAddons: ["catalogue", "mobile-app"] },
  { slug: "market-bold", category: "catalogue", layout: "bold", name: L("Market Bold", "ماركت بولد"), tagline: L("High-energy retail and offers.", "تجزئة وعروض بطاقة عالية."), primary: "#e11d48", accent: "#111827", font: "display", minPlan: "business", recommendedAddons: ["catalogue", "payments"] },
  { slug: "shelf", category: "catalogue", layout: "minimal", name: L("Shelf", "شيلف"), tagline: L("Calm, image-led product catalogue.", "كتالوج هادئ تقوده الصور."), primary: "#0f766e", accent: "#134e4a", font: "serif", minPlan: "business", recommendedAddons: ["catalogue"] },
];

const FEATURES: Record<TemplateLayout, Localized[]> = {
  classic: [L("Trust-first layout", "تخطيط يبني الثقة"), L("Sticky call & WhatsApp", "أزرار اتصال وواتساب ثابتة"), L("Reviews section", "قسم آراء العملاء")],
  bold: [L("Big visual hero", "واجهة بصرية كبيرة"), L("Offer banners", "شرائط العروض"), L("Animated sections", "أقسام متحركة")],
  minimal: [L("Lots of white space", "مساحات بيضاء مريحة"), L("Image-led pages", "صفحات تقودها الصور"), L("Fast and light", "سريع وخفيف")],
};

export function templateDocs() {
  return TEMPLATES.map((t, i) => ({
    slug: t.slug,
    category: t.category,
    layout: t.layout,
    name: t.name,
    tagline: t.tagline,
    defaultBrand: { primary: t.primary, accent: t.accent, font: t.font },
    pages: PAGES[t.category],
    features: FEATURES[t.layout],
    recommendedAddons: t.recommendedAddons,
    minPlan: t.minPlan ?? "launch",
    sortOrder: i,
    published: true,
  }));
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

export function planDocs() {
  return PLANS.map((p, i) => ({ ...p, sortOrder: i, published: true }));
}
