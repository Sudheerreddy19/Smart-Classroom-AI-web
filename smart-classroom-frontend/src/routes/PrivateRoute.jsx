import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import { selectIsAuthenticated } from "../store/slices/authSlice";
import DashboardLayout from "../components/layout/DashboardLayout";

/**
 * PrivateRoute — requires authentication. Wraps page in DashboardLayout.
 * For role-based protection use RoleRoute inside the page itself.
 */
export default function PrivateRoute({ children }) {
  const isAuth   = useSelector(selectIsAuthenticated);
  const location = useLocation();

  if (!isAuth) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
