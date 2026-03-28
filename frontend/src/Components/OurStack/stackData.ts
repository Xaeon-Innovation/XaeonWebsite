export type StackItem = {
  id: string;
  name: string;
  categoryId: string;
};

/** Filter tabs (category ids). */
export type StackFilterTab = {
  id: string;
  label: string;
};

export const STACK_FILTER_TABS: StackFilterTab[] = [
  { id: "frontend", label: "Front-end" },
  { id: "backend", label: "Back-end" },
  { id: "database", label: "Database" },
  { id: "devops", label: "DevOps" },
  { id: "aiml", label: "AI / ML" },
  { id: "mobile", label: "Mobile" },
  { id: "payments", label: "Payments" },
  { id: "tools", label: "Tools & CMS" },
];

/** Default selected category (first tab). */
export const DEFAULT_STACK_CATEGORY_ID = STACK_FILTER_TABS[0].id;

/** Label under the cloud for the active filter. */
export const STACK_CLOUD_LABELS: Record<string, string> = {
  frontend: "Front-end",
  backend: "Back-end",
  database: "Database",
  devops: "DevOps",
  aiml: "AI / ML",
  mobile: "Mobile",
  payments: "Payments",
  tools: "Tools & CMS",
};

/**
 * Flat list: grid + cloud both render from this.
 * Icons resolved via `getStackIcon(name)` in `stackIconMap.ts`.
 */
export const STACK_ITEMS: StackItem[] = [
  { id: "react", name: "React", categoryId: "frontend" },
  { id: "typescript", name: "TypeScript", categoryId: "frontend" },
  { id: "nextjs", name: "Next.js", categoryId: "frontend" },
  { id: "tailwind", name: "Tailwind CSS", categoryId: "frontend" },
  { id: "vite", name: "Vite", categoryId: "frontend" },
  { id: "nodejs", name: "Node.js", categoryId: "backend" },
  { id: "express", name: "Express.js", categoryId: "backend" },
  { id: "python", name: "Python", categoryId: "backend" },
  { id: "fastapi", name: "FastAPI", categoryId: "backend" },
  { id: "mongodb", name: "MongoDB", categoryId: "database" },
  { id: "postgresql", name: "PostgreSQL", categoryId: "database" },
  { id: "redis", name: "Redis", categoryId: "database" },
  { id: "firebase", name: "Firebase", categoryId: "database" },
  { id: "docker", name: "Docker", categoryId: "devops" },
  { id: "aws", name: "AWS", categoryId: "devops" },
  { id: "vercel", name: "Vercel", categoryId: "devops" },
  { id: "gha", name: "GitHub Actions", categoryId: "devops" },
  { id: "nginx", name: "Nginx", categoryId: "devops" },
  { id: "tensorflow", name: "TensorFlow", categoryId: "aiml" },
  { id: "pytorch", name: "PyTorch", categoryId: "aiml" },
  { id: "openai", name: "OpenAI API", categoryId: "aiml" },
  { id: "langchain", name: "LangChain", categoryId: "aiml" },
  { id: "flutter", name: "Flutter", categoryId: "mobile" },
  { id: "react-native", name: "React Native", categoryId: "mobile" },
  { id: "stripe", name: "Stripe", categoryId: "payments" },
  { id: "paymob", name: "Paymob", categoryId: "payments" },
  { id: "twilio", name: "Twilio", categoryId: "payments" },
  {
    id: "whatsapp",
    name: "WhatsApp Business API",
    categoryId: "payments",
  },
  { id: "clickup", name: "ClickUp", categoryId: "tools" },
  { id: "figma", name: "Figma", categoryId: "tools" },
  { id: "postman", name: "Postman", categoryId: "tools" },
  { id: "git", name: "Git", categoryId: "tools" },
];
