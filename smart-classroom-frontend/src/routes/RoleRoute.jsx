import { useSelector } from "react-redux";
import { selectIsAuthenticated, selectUser } from "../store/slices/authSlice";
import { Navigate, useLocation } from "react-router-dom";
import AccessDenied from "../components/common/AccessDenied";

/**
 * RoleRoute — wraps a page with authentication + role check.
 *
 * Props:
 *   allowedRoles  string[]  — roles that can access this route. Empty = all authenticated.
 *   children      ReactNode
 */
export default function RoleRoute({ children, allowedRoles = [] }) {
  const isAuth  = useSelector(selectIsAuthenticated);
  const user    = useSelector(selectUser);
  const location = useLocation();

  // Not logged in → redirect to login
  if (!isAuth) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Role check — if allowedRoles specified, user must have one of them
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <AccessDenied />;
  }

  return children;
}
