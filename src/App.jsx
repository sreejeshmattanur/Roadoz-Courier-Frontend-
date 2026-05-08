import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Cookies from "js-cookie";
import { Toaster, toast } from "react-hot-toast";
import { useSelector } from "react-redux";
import { useEffect } from "react";

import { Login } from "./pages/Login";
import { ForgotPassword } from "./pages/ForgotPassword";
import { Profile } from "./pages/Profile";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { Dashboard } from "./pages/Dashboard";
import NewOrder from "./pages/NewOrder";
import { ProcessingOrders } from "./pages/ProcessingOrders";
import { ServiceablePincode } from "./pages/ServiceablePincode";
import { RateCalculator } from "./pages/RateCalculator";
import { ChannelIntegration } from "./pages/ChannelIntegration";
import { Wallet } from "./pages/Wallet";
import { CODRemittance } from "./pages/CODRemittance";
import { Invoices } from "./pages/Invoices";
import { Consignees } from "./pages/Consignees";
import { Tickets } from "./pages/Tickets";
import { Reports } from "./pages/Reports";
import { ChangePassword } from "./pages/ChangePassword";
import { PickupAddress } from "./pages/PickupAddress";
import { GeneralDetails } from "./pages/GeneralDetails";
import { RTOAddress } from "./pages/RTOAddress";
import { LabelSetting } from "./pages/LabelSetting";
import { KYC } from "./pages/KYC";
import { Permissions } from "./pages/admin/Permissions";
import { Roles } from "./pages/admin/Roles";
import { Users } from "./pages/admin/Users";
import { Franchise } from "./pages/Franchise";
import StaffRegistration from "./pages/StaffRegistration";
import FranchiseWizard from "./components/common/FranchiseWizard";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { NotFound } from "./pages/NotFound";
import { ThemeProvider } from "./contexts/ThemeContext";
import { RolesManagement } from "./pages/admin/RolesManagement";
import AddRolePage from "./pages/admin/AddRolePage";
import RoleWizard from "./components/common/RoleWizard";
import ScannedOrders from "./pages/ScannedOrders";
import ActivityLogs from "./pages/ActivityLogs";

const PermissionRoute = ({ children, permission }) => {
  const { role, permissions, isAuthenticated } = useSelector(
    (state) => state.auth,
  );

  const hasAccess =
    role === "super_admin" ||
    (permission ? permissions?.includes(permission) : true);

  useEffect(() => {
    if (isAuthenticated && !hasAccess) {
      toast.error("Access Denied! You do not have permission.", {
        id: "access-denied",
        icon: "🚫",
      });
    }
  }, [hasAccess, isAuthenticated]);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return hasAccess ? children : <Navigate to="/dashboard" />;
};

export default function App() {
  const token = Cookies.get("access_token");

  return (
    <ThemeProvider>
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={10}
        toastOptions={{
          duration: 4000,
          style: {
            background: "#111827",
            color: "#ffffff",
            borderRadius: "12px",
            padding: "14px 18px",
            fontSize: "14px",
            fontWeight: "500",
            boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
          },
          success: {
            iconTheme: {
              primary: "#22c55e",
              secondary: "#ffffff",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#ffffff",
            },
          },
        }}
      />

      <Router>
        <Routes>
          <Route
            path="/"
            element={
              token ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
            }
          />

          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />

            {/* Orders */}
            <Route
              path="new-orders"
              element={
                <PermissionRoute permission="orders:create">
                  <NewOrder />
                </PermissionRoute>
              }
            />
            <Route
              path="processing-order"
              element={
                <PermissionRoute permission="orders:view">
                  <ProcessingOrders />
                </PermissionRoute>
              }
            />
            <Route
              path="all-orders"
              element={
                <PermissionRoute permission="orders:view">
                  <ProcessingOrders />
                </PermissionRoute>
              }
            />
            <Route
              path="manifested"
              element={
                <PermissionRoute permission="orders:view">
                  <ProcessingOrders />
                </PermissionRoute>
              }
            />
            <Route
              path="not-picked"
              element={
                <PermissionRoute permission="orders:view">
                  <ProcessingOrders />
                </PermissionRoute>
              }
            />
            <Route
              path="in-transit"
              element={
                <PermissionRoute permission="orders:view">
                  <ProcessingOrders />
                </PermissionRoute>
              }
            />
            <Route
              path="pending"
              element={
                <PermissionRoute permission="orders:view">
                  <ProcessingOrders />
                </PermissionRoute>
              }
            />
            <Route
              path="out-for-delivery"
              element={
                <PermissionRoute permission="orders:view">
                  <ProcessingOrders />
                </PermissionRoute>
              }
            />
            <Route
              path="delivered"
              element={
                <PermissionRoute permission="orders:view">
                  <ProcessingOrders />
                </PermissionRoute>
              }
            />

            <Route
              path="serviceable-pincode"
              element={<ServiceablePincode />}
            />
            <Route path="rate-calculator" element={<RateCalculator />} />
            <Route
              path="channel-integration"
              element={<ChannelIntegration />}
            />

            {/* <Route path="admin/roles/add" element={<AddRolePage />} /> */}
            <Route path="admin/roles" element={<RolesManagement />} />
            <Route
              path="admin/roles/add"
              element={
                <PermissionRoute permission="roles:add">
                  <RoleWizard />
                </PermissionRoute>
              }
            />
            <Route
              path="admin/roles/edit/:id"
              element={
                <PermissionRoute permission="roles:edit">
                  <RoleWizard />
                </PermissionRoute>
              }
            />

            <Route
              path="wallet"
              element={
                <PermissionRoute permission="finance:view">
                  <Wallet />
                </PermissionRoute>
              }
            />
            <Route
              path="cod-remittance"
              element={
                <PermissionRoute permission="finance:view">
                  <CODRemittance />
                </PermissionRoute>
              }
            />
            <Route
              path="invoices"
              element={
                <PermissionRoute permission="finance:view">
                  <Invoices />
                </PermissionRoute>
              }
            />

            {/* CRM */}
            <Route
              path="consignees"
              element={
                <PermissionRoute permission="users:view">
                  <Consignees />
                </PermissionRoute>
              }
            />
            <Route path="tickets" element={<Tickets />} />
            <Route path="reports" element={<Reports />} />

            <Route
              path="scanned-orders"
              element={
                <PermissionRoute permission="orders:view">
                  <ScannedOrders />
                </PermissionRoute>
              }
            />



            {/* Settings */}
            <Route
              path="settings/general"
              element={
                <PermissionRoute permission="profile:view">
                  <GeneralDetails />
                </PermissionRoute>
              }
            />
            <Route path="settings/password" element={<ChangePassword />} />
            <Route
              path="settings/pickup"
              element={
                <PermissionRoute permission="profile:edit">
                  <PickupAddress />
                </PermissionRoute>
              }
            />
            <Route
              path="settings/rto"
              element={
                <PermissionRoute permission="profile:edit">
                  <RTOAddress />
                </PermissionRoute>
              }
            />
            <Route path="settings/label" element={<LabelSetting />} />
            <Route
              path="settings/kyc"
              element={
                <PermissionRoute permission="profile:edit">
                  <KYC />
                </PermissionRoute>
              }
            />

            {/* Admin */}
            <Route
              path="admin/assign-roles"
              element={
                <PermissionRoute permission="user_roles:assign">
                  <Permissions />
                </PermissionRoute>
              }
            />
            <Route
              path="admin/roles"
              element={
                <PermissionRoute permission="roles:view">
                  <Roles />
                </PermissionRoute>
              }
            />
            <Route
              path="admin/users"
              element={
                <PermissionRoute permission="users:view">
                  <Users />
                </PermissionRoute>
              }
            />
            <Route
              path="admin/activity-logs"
              element={
                <PermissionRoute permission="logs:view">
                  <ActivityLogs />
                </PermissionRoute>
              }
            />

            {/* Franchise */}
            <Route
              path="franchise"
              element={
                <PermissionRoute permission="franchise:view">
                  <Franchise />
                </PermissionRoute>
              }
            />
            <Route
              path="franchise/add-staff"
              element={
                <PermissionRoute permission="users:create">
                  <StaffRegistration />
                </PermissionRoute>
              }
            />
            <Route
              path="franchise/edit-staff/:id"
              element={
                <PermissionRoute permission="users:edit">
                  <StaffRegistration />
                </PermissionRoute>
              }
            />
            <Route
              path="franchise/add"
              element={
                <PermissionRoute permission="franchise:create">
                  <FranchiseWizard />
                </PermissionRoute>
              }
            />
            <Route
              path="franchise/edit/:id"
              element={
                <PermissionRoute permission="franchise:edit">
                  <FranchiseWizard />
                </PermissionRoute>
              }
            />
          </Route>

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <PermissionRoute permission="profile:view">
                  <Profile />
                </PermissionRoute>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}
