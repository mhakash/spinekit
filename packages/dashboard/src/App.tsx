/**
 * Main App Component
 */

import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { TablesPage } from "./pages/TablesPage";
import { TableDetailPage } from "./pages/TableDetailPage";
import { TableDataPage } from "./pages/TableDataPage";
import { APITestingPage } from "./pages/APITestingPage";
import { Toaster } from "@/components/ui/sonner";

export default function App() {
  return (
    <>
      <Toaster />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="tables" element={<TablesPage />} />
          <Route path="tables/:tableName" element={<TableDetailPage />} />
          <Route path="tables/:tableName/data" element={<TableDataPage />} />
          <Route path="api-docs" element={<APITestingPage />} />
        </Route>
      </Routes>
    </>
  );
}
