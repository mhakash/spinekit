/**
 * Main Application Component
 */

import { RouterProvider } from "react-router";
import { Toaster } from "@/components/ui/sonner";
import { router } from "./router";

export default function App() {
  return (
    <>
      <Toaster />
      <RouterProvider router={router} />
    </>
  );
}
