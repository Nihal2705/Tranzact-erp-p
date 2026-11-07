import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import InventoryPage from "./pages/InventoryPage";
import OrdersPage from "./pages/OrdersPage";
import OrderDetailsPage from "./pages/OrderDetailsPage";
import ProductionPage from "./pages/ProductionPage";
import ProductionDetailsPage from "./pages/ProductionDetailsPage";
import ReportsPage from "./pages/ReportsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

const MANAGEMENT = ["Admin", "Manager"];

const guard = (page, roles) => <ProtectedRoute roles={roles}>{page}</ProtectedRoute>;

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard"      element={guard(<DashboardPage />, MANAGEMENT)} />
          <Route path="/inventory"      element={<InventoryPage />} />
          <Route path="/orders"         element={guard(<OrdersPage />, MANAGEMENT)} />
          <Route path="/orders/:id"     element={guard(<OrderDetailsPage />, MANAGEMENT)} />
          <Route path="/production"     element={<ProductionPage />} />
          <Route path="/production/:id" element={<ProductionDetailsPage />} />
          <Route path="/reports"        element={guard(<ReportsPage />, MANAGEMENT)} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}