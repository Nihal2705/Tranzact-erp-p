import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, roles }) {
  if (!localStorage.getItem("token")) return <Navigate to="/login" replace />;

  if (roles) {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!roles.includes(user.role)) {
      return <Navigate to={user.role === "Worker" ? "/inventory" : "/dashboard"} replace />;
    }
  }
  return children;
}