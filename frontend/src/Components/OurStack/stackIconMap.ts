import * as React from "react";
import type { IconType } from "react-icons";
import type { LucideIcon } from "lucide-react";
import { Brain, CreditCard } from "lucide-react";
import { TbBrandAws } from "react-icons/tb";
import {
  SiClickup,
  SiDocker,
  SiExpress,
  SiFastapi,
  SiFigma,
  SiFirebase,
  SiFlutter,
  SiGit,
  SiGithubactions,
  SiMongodb,
  SiNextdotjs,
  SiNginx,
  SiNodedotjs,
  SiOpenai,
  SiPostgresql,
  SiPostman,
  SiPytorch,
  SiPython,
  SiReact,
  SiRedis,
  SiStripe,
  SiTailwindcss,
  SiTensorflow,
  SiTwilio,
  SiTypescript,
  SiVercel,
  SiVite,
  SiWhatsapp,
} from "react-icons/si";

function fromLucide(Icon: LucideIcon, defaultSize = 22): IconType {
  return (props) =>
    React.createElement(Icon, {
      size: props.size ?? defaultSize,
      className: props.className,
      strokeWidth: 1.75,
    });
}

const Fallback: IconType = (props) =>
  React.createElement(
    "span",
    {
      className: props.className,
      style: { fontSize: props.size ?? 18, fontWeight: 700, color: "#72C04F" },
    },
    "?"
  );

export const STACK_ICON_MAP: Record<string, IconType> = {
  React: SiReact,
  TypeScript: SiTypescript,
  "Next.js": SiNextdotjs,
  "Tailwind CSS": SiTailwindcss,
  Vite: SiVite,
  Flutter: SiFlutter,
  "React Native": SiReact,
  "Node.js": SiNodedotjs,
  "Express.js": SiExpress,
  Python: SiPython,
  FastAPI: SiFastapi,
  MongoDB: SiMongodb,
  PostgreSQL: SiPostgresql,
  Firebase: SiFirebase,
  Redis: SiRedis,
  TensorFlow: SiTensorflow,
  PyTorch: SiPytorch,
  "OpenAI API": SiOpenai,
  LangChain: fromLucide(Brain),
  Docker: SiDocker,
  AWS: TbBrandAws,
  Vercel: SiVercel,
  "GitHub Actions": SiGithubactions,
  Nginx: SiNginx,
  Stripe: SiStripe,
  Paymob: fromLucide(CreditCard, 20),
  Twilio: SiTwilio,
  "WhatsApp Business API": SiWhatsapp,
  ClickUp: SiClickup,
  Figma: SiFigma,
  Postman: SiPostman,
  Git: SiGit,
};

export function getStackIcon(name: string): IconType {
  return STACK_ICON_MAP[name] ?? Fallback;
}
