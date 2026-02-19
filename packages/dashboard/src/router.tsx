/**
 * React Router Configuration
 * Declarative routing with lazy loading for code splitting
 */

import { createBrowserRouter, Navigate } from "react-router";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Eager load critical routes
import { LoginPage } from "./pages/LoginPage";
import { HomePage } from "./pages/HomePage";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          {
            index: true,
            element: <HomePage />,
          },
          {
            path: "tables",
            children: [
              {
                index: true,
                lazy: () => import("./pages/TablesPage"),
              },
              {
                path: ":tableName",
                lazy: () => import("./pages/TableDetailPage"),
              },
              {
                path: ":tableName/data",
                lazy: () => import("./pages/TableDataPage"),
              },
            ],
          },
          {
            path: "api-docs",
            lazy: () => import("./pages/APITestingPage"),
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
