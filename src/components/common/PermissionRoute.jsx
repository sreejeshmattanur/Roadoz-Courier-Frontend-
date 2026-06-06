import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useEffect } from "react";
import { hasPermission } from "../../lib/permissions";

export const PermissionRoute = ({ children, permission }) => {
  const { role, permissions, isAuthenticated } = useSelector(
    (state) => state.auth,
  );

  const hasAccess = hasPermission(permissions, role, permission);

  useEffect(() => {
    if (isAuthenticated && !hasAccess) {
      toast.error("Access Denied! You do not have permission.", {
        id: "access-denied",
        icon: "🚫",
      });
    }
  }, [hasAccess, isAuthenticated]);

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!hasAccess) return <Navigate to="/dashboard" />;

  return children;
};
