import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";

import "./index.css";

import App from "./App.tsx";
import ErrorPage from "./Pages/ErrorPage.tsx";
import Home from "./Pages/Home.tsx";
import LoginSignup from "./Pages/LoginSignup.tsx";
import Blog from "./Pages/Blog.tsx";
import About from "./Pages/About.tsx";
import BookNow from "./Pages/BookNow.tsx";
import Services from "./Pages/Services.tsx";
import OurWork from "./Pages/OurWork.tsx";
import Packages from "./Pages/Packages.tsx";
import Policy from "./Pages/Policy.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
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
        path: "our-work",
        element: <OurWork />,
      },
      {
        path: "case-studies",
        element: <OurWork />,
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
        path: "book-now",
        element: <BookNow />,
      },
      {
        path: "policy",
        element: <Policy />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
