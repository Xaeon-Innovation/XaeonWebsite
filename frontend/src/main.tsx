import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router";

import "./index.css";
import { captureAttribution } from "./lib/attribution";
import { initAnalytics } from "./lib/analytics";

import ErrorPage from "./Pages/ErrorPage.tsx";
import Home from "./Pages/Home.tsx";
import LoginSignup from "./Pages/LoginSignup.tsx";
import Blog from "./Pages/Blog.tsx";
import About from "./Pages/About.tsx";
import BookNow from "./Pages/BookNow.tsx";
import Services from "./Pages/Services.tsx";
import ServiceDetail from "./Pages/ServiceDetail.tsx";
import OurWork from "./Pages/OurWork.tsx";
import CaseStudyDetail from "./Pages/CaseStudyDetail.tsx";
import Packages from "./Pages/Packages.tsx";
import Terms from "./Pages/Terms.tsx";
import Privacy from "./Pages/Privacy.tsx";
import MainLayout from "./layouts/MainLayout.tsx";
import ContextProviders from "./context/ContextProviders.tsx";
import RequireUser from "./context/RequireUser.tsx";
import ClientDashboard from "./Pages/ClientDashboard.tsx";
import { dashboardLoader, serviceRequestsLoader } from "./lib/adminLoaders.ts";
import { clientDashboardLoader } from "./lib/clientPortalLoaders.ts";

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "about-us",
        element: <About />,
      },
      {
        path: "services",
        element: <Services />,
      },
      {
        path: "services/:slug",
        element: <ServiceDetail />,
      },
      {
        path: "our-work",
        element: <OurWork />,
      },
      {
        path: "case-studies/:slug",
        element: <CaseStudyDetail />,
      },
      {
        path: "case-studies",
        element: <Navigate to="/our-work" replace />,
      },
      {
        path: "packages",
        element: <Packages />,
      },
      {
        path: "blog",
        element: <Blog />,
      },
      {
        path: "login",
        element: <LoginSignup />,
      },
      {
        path: "register",
        element: <LoginSignup />,
      },
      {
        path: "book-now",
        element: <BookNow />,
      },
      {
        path: "terms",
        element: <Terms />,
      },
      {
        path: "privacy",
        element: <Privacy />,
      },
      {
        path: "dashboard",
        loader: clientDashboardLoader,
        element: (
          <RequireUser>
            <ClientDashboard />
          </RequireUser>
        ),
      },
    ],
  },
  {
    path: "admin",
    lazy: () => import("./layouts/AdminLayout"),
    children: [
      { index: true, lazy: () => import("./Pages/admin/Dashboard"), loader: dashboardLoader },
      { path: "users", lazy: () => import("./Pages/admin/UsersPage") },
      { path: "employees", lazy: () => import("./Pages/admin/EmployeesPage") },
      { path: "projects", lazy: () => import("./Pages/admin/ProjectsPage") },
      { path: "project-types", lazy: () => import("./Pages/admin/ProjectTypesPage") },
      { path: "packages", lazy: () => import("./Pages/admin/PackagesPage") },
      { path: "blog-posts", lazy: () => import("./Pages/admin/BlogPostsPage") },
      { path: "site-team", lazy: () => import("./Pages/admin/TeamMembersPage") },
      { path: "site-case-studies", lazy: () => import("./Pages/admin/CaseStudiesCmsPage") },
      { path: "site-testimonials", lazy: () => import("./Pages/admin/TestimonialsPage") },
      { path: "site-social", lazy: () => import("./Pages/admin/SiteSocialSettingsPage") },
      { path: "bookings", lazy: () => import("./Pages/admin/BookingsPage") },
      { path: "service-requests", lazy: () => import("./Pages/admin/ServiceRequestsPage"), loader: serviceRequestsLoader },
    ],
  },
]);

/**
 * Once the public site runs on Next.js (xaeons.com), this app is served from app.xaeons.com for
 * the admin panel and client portal only. Set VITE_PUBLIC_SITE_ORIGIN there: any public page
 * is sent to the real site, and nothing on this host is indexed.
 */
const PUBLIC_SITE_ORIGIN = (import.meta.env.VITE_PUBLIC_SITE_ORIGIN ?? "").replace(/\/+$/, "");
const APP_ONLY_PATH = /^\/(admin|dashboard|login|register)(\/|$)/;
if (PUBLIC_SITE_ORIGIN) {
  const robots = document.createElement("meta");
  robots.name = "robots";
  robots.content = "noindex, nofollow";
  document.head.appendChild(robots);
  if (!APP_ONLY_PATH.test(window.location.pathname)) {
    const target = window.location.pathname === "/" ? "/login" : window.location.pathname;
    if (target === "/login") window.history.replaceState(null, "", "/login");
    else window.location.replace(`${PUBLIC_SITE_ORIGIN}${window.location.pathname}${window.location.search}`);
  }
}

captureAttribution();
initAnalytics();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ContextProviders>
      <RouterProvider router={router} />
    </ContextProviders>
  </StrictMode>
);

