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
import RequestService from "./Pages/RequestService.tsx";

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
        path: "login",
        element: <LoginSignup />,
      },
      {
        path: "blog",
        element: <Blog />,
      },
      {
        path: "about-us",
        element: <About />,
      },
      {
        path: "request-service",
        element: <RequestService />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
