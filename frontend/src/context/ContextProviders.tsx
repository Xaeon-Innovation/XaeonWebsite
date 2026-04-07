import type { PropsWithChildren } from "react";
import { AuthProvider } from "./AuthContext";

export default function ContextProviders({ children }: PropsWithChildren) {
  return <AuthProvider>{children}</AuthProvider>;
}
