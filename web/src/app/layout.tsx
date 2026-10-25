import type { ReactNode } from "react";
import "./globals.css";

// The real document shell lives in app/[locale]/layout.tsx (it needs the locale for lang/dir).
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
