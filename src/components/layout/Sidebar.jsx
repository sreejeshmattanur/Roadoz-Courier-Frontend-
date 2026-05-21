import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ClipboardList,
  Wrench,
  CircleDollarSign,
  Users,
  Ticket,
  FileText,
  Settings,
  ChevronDown,
  ChevronUp,
  LogOut,
  X,
  ShieldCheck,
  Store,
  Warehouse,
  ClipboardCheck,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { NavLink } from "../NavLink";
import { cn } from "../../lib/utils";
import logo from "../../assets/images/Roadoz Golden hd.png";
import { logoutUser } from "../../redux/authSlice";
import { toast } from "react-hot-toast";

export function Sidebar({ isOpen, setIsOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { role, permissions } = useSelector((state) => state.auth);

  const base = "/dashboard";

  const [openMenus, setOpenMenus] = useState({
    orders: false,
    tools: false,
    finance: false,
    settings: false,
    admin: false,
  });

  /* =========================
     Permission Helper
  ========================= */
  const hasPerm = (perm) => {
    if (role === "super_admin") return true;
    if (!perm) return true;
    return permissions?.includes(perm);
  };

  /* =========================
     Sidebar Sections
  ========================= */
  const sections = {
    orders: [
      { name: "All Orders", to: `${base}/all-orders`, perm: "orders:view" },
      { name: "Manifested", to: `${base}/manifested`, perm: "orders:view" },
      {
        name: "Scanned Orders",
        to: `${base}/scanned-orders`,
        perm: "orders:view",
      },
      { name: "Not Picked", to: `${base}/not-picked`, perm: "orders:view" },
      {
        name: "In Transit Orders",
        to: `${base}/in-transit`,
        perm: "orders:view",
      },
      { name: "Pending", to: `${base}/pending`, perm: "orders:view" },
      {
        name: "Out For Delivery",
        to: `${base}/out-for-delivery`,
        perm: "orders:view",
      },
      { name: "Delivered", to: `${base}/delivered`, perm: "orders:view" },
      {
        name: "RTO In Transit",
        to: `${base}/rto-in-transit`,
        perm: "orders:view",
      },
      {
        name: "RTO Delivered",
        to: `${base}/rto-delivered`,
        perm: "orders:view",
      },
      { name: "Returned", to: `${base}/returned`, perm: "orders:view" },
      { name: "Cancelled", to: `${base}/cancelled`, perm: "orders:view" },
    ],

    admin: [
      {
        name: "User Management",
        to: `${base}/admin/users`,
        perm: "users:view",
      },
      {
        name: "Role Permissions",
        to: `${base}/admin/roles`,
        perm: "roles:view",
      },
      {
        name: "Assign Roles",
        to: `${base}/admin/assign-roles`,
        perm: "user_roles:assign",
      },
      {
        name: "Activity Logs",
        to: `${base}/admin/activity-logs`,
        perm: "logs:view",
      },
    ],

    tools: [
      {
        name: "Serviceable Pincode",
        to: `${base}/serviceable-pincode`,
        perm: "tools:view",
      },
      {
        name: "Rate Calculator",
        to: `${base}/rate-calculator`,
        perm: "tools:view",
      },
      {
        name: "Channel Integration",
        to: `${base}/channel-integration`,
        perm: "tools:view",
      },
    ],

    finance: [
      { name: "Wallet", to: `${base}/wallet`, perm: "finance:view" },
      {
        name: "COD Remittance",
        to: `${base}/cod-remittance`,
        perm: "finance:view",
      },
      { name: "Invoices", to: `${base}/invoices`, perm: "finance:view" },
    ],

    settings: [
      {
        name: "General Details",
        to: `${base}/settings/general`,
        perm: "profile:view",
      },
      { name: "Change Password", to: `${base}/settings/password` },
      {
        name: "Pickup Address",
        to: `${base}/settings/pickup`,
        perm: "profile:edit",
      },
      { name: "RTO Address", to: `${base}/settings/rto`, perm: "profile:edit" },
      {
        name: "Label Setting",
        to: `${base}/settings/label"`,
        perm: "profile:edit",
      },
      { name: "KYC", to: `${base}/settings/kyc`, perm: "profile:edit" },
    ],
  };

  /* =========================
     Auto Open Active Menu
  ========================= */
  useEffect(() => {
    const currentPath = location.pathname;

    const activeSection = Object.keys(sections).find((key) =>
      sections[key].some((item) => currentPath.startsWith(item.to)),
    );

    if (activeSection) {
      setOpenMenus({
        orders: false,
        tools: false,
        finance: false,
        settings: false,
        admin: false,
        [activeSection]: true,
      });
    }
  }, [location.pathname]);

  /* =========================
     Toggle Menu
  ========================= */
  const toggleMenu = (menu) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  };

  /* =========================
     Logout
  ========================= */
  const handleLogout = async () => {
    const loadingToast = toast.loading("Logging out...");

    try {
      const response = await dispatch(logoutUser()).unwrap();

      toast.success(response?.message || "Logged out successfully", {
        id: loadingToast,
        icon: "✅",
      });

      navigate("/login");
    } catch (error) {
      toast.error("Logout completed with server issue", {
        id: loadingToast,
        icon: "⚠️",
      });

      navigate("/login");
    }
  };

  /* =========================
     Dropdown Component
  ========================= */
  const NavDropdown = ({ id, label, icon: Icon, items }) => {
    const allowedItems = items.filter((item) => hasPerm(item.perm));

    if (allowedItems.length === 0) return null;

    return (
      <div className="px-2 py-1">
        <button
          onClick={() => toggleMenu(id)}
          className={cn(
            "flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-all",
            isOpen ? "justify-between" : "justify-center",
            openMenus[id]
              ? "bg-primary/10 text-text-main"
              : "text-text-muted hover:bg-text-muted/5",
          )}
        >
          <div className="flex items-center gap-3">
            <Icon size={20} className={openMenus[id] ? "text-primary" : ""} />
            {isOpen && <span>{label}</span>}
          </div>

          {isOpen &&
            (openMenus[id] ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            ))}
        </button>

        {isOpen && openMenus[id] && (
          <div className="mt-1 ml-4 space-y-1">
            {allowedItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "py-2 pl-8 pr-4 text-xs rounded-md flex items-center gap-2",
                    isActive
                      ? "text-primary bg-primary/10 font-bold"
                      : "text-text-muted hover:bg-text-muted/5",
                  )
                }
              >
                {item.name}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 flex flex-col h-screen bg-dashboard-bg border-r border-border-subtle transition-all duration-300",
        isOpen
          ? "w-64 translate-x-0"
          : "w-0 lg:w-20 -translate-x-full lg:translate-x-0",
      )}
    >
      {/* Logo */}
      <div className="p-4 flex items-center justify-between lg:justify-center">
        <img
          src={logo}
          alt="Logo"
          className={cn(
            "object-contain transition-all",
            isOpen ? "w-40 h-12" : "w-10 h-10",
          )}
        />

        <button
          onClick={() => setIsOpen(false)}
          className="lg:hidden p-2 text-primary"
        >
          <X size={24} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-1 custom-scrollbar">
        <NavLink
          to={base}
          end
          icon={<LayoutDashboard size={20} />}
          hideText={!isOpen}
        >
          Dashboard
        </NavLink>

        {hasPerm("orders:create") && (
          <NavLink
            to={`${base}/new-orders`}
            icon={<ShoppingCart size={20} />}
            hideText={!isOpen}
          >
            New Orders
          </NavLink>
        )}

        {hasPerm("franchise:view") && (
          <NavLink
            to={`${base}/franchise`}
            icon={<Store size={20} />}
            hideText={!isOpen}
          >
            Franchise
          </NavLink>
        )}

        {hasPerm("orders:view") && (
          <NavLink
            to={`${base}/processing-order`}
            icon={<Package size={20} />}
            hideText={!isOpen}
            onClick={() =>
              setOpenMenus((prev) => ({ ...prev, orders: true }))
            }
          >
            Processing Order
          </NavLink>
        )}

        <NavDropdown
          id="orders"
          label="Orders"
          icon={ClipboardList}
          items={sections.orders}
        />

        <NavDropdown
          id="admin"
          label="Administrative"
          icon={ShieldCheck}
          items={sections.admin}
        />

        <NavDropdown
          id="tools"
          label="Tools"
          icon={Wrench}
          items={sections.tools}
        />

        <NavDropdown
          id="finance"
          label="Finance"
          icon={CircleDollarSign}
          items={sections.finance}
        />

        {hasPerm("users:view") && (
          <NavLink
            to={`${base}/consignees`}
            icon={<Users size={20} />}
            hideText={!isOpen}
          >
            Consignees
          </NavLink>
        )}

        {hasPerm("orders:view") && (
          <NavLink
            to={`${base}/warehouse`}
            icon={<Warehouse size={20} />}
            hideText={!isOpen}
          >
            Warehouse
          </NavLink>
        )}

        {hasPerm("orders:view") && (
          <NavLink
            to={`${base}/reviews`}
            icon={<ClipboardCheck size={20} />}
            hideText={!isOpen}
          >
            Review
          </NavLink>
        )}

        <NavLink
          to={`${base}/scanned-orders`}
          icon={<Package size={20} />}
          hideText={!isOpen}
        >
          Scanned Orders
        </NavLink>

        <NavLink
          to={`${base}/tickets`}
          icon={<Ticket size={20} />}
          hideText={!isOpen}
        >
          Tickets
        </NavLink>

        <NavLink
          to={`${base}/reports`}
          icon={<FileText size={20} />}
          hideText={!isOpen}
        >
          Reports
        </NavLink>

        <NavDropdown
          id="settings"
          label="Settings"
          icon={Settings}
          items={sections.settings}
        />

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-100 w-full rounded-lg"
        >
          <LogOut size={20} />
          {isOpen && "Logout"}
        </button>
      </nav>
    </aside>
  );
}
