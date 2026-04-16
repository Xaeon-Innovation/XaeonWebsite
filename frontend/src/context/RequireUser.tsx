import type { PropsWithChildren } from "react";
import { Navigate } from "react-router";
import { useAuth } from "./AuthContext";

export default function RequireUser({ children }: PropsWithChildren) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
          background: "#0a0a0f",
        }}
      >
        <div style={{ color: "#72c04f", fontSize: "1.125rem" }}>Loading…</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "admin") return <Navigate to="/admin" replace />;

  return <>{children}</>;
}
