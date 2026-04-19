import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router";

import "./index.css";

import ErrorPage from "./Pages/ErrorPage.tsx";
import Home from "./Pages/Home.tsx";
import LoginSignup from "./Pages/LoginSignup.tsx";
import Blog from "./Pages/Blog.tsx";
import About from "./Pages/About.tsx";
import BookNow from "./Pages/BookNow.tsx";
import Services from "./Pages/Services.tsx";
import ServiceDetail from "./Pages/ServiceDetail.tsx";
import OurWork from "./Pages/OurWork.tsx";
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
      { path: "site-social", lazy: () => import("./Pages/admin/SiteSocialSettingsPage") },
      { path: "service-requests", lazy: () => import("./Pages/admin/ServiceRequestsPage"), loader: serviceRequestsLoader },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ContextProviders>
      <RouterProvider router={router} />
    </ContextProviders>
  </StrictMode>
);

