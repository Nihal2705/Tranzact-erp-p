import InventoryPage from "./pages/InventoryPage";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ComingSoon from "./pages/ComingSoon";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard"  element={<DashboardPage />} />
          
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/production" element={<ComingSoon title="Production" />} />
          <Route path="/reports"    element={<ComingSoon title="Reports" />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}