import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Settings,
  RotateCcw,
  ShieldCheck,
  UserCheck,
  ShieldAlert,
  CheckCircle2,
  ChevronRight,
  Lock,
  Key,
  Mail,
  Shield,
  Loader2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "motion/react";

import { Button } from "../../components/ui/button";
import { usePermission } from "../../hooks/usePermission";
import { Card, CardContent } from "../../components/ui/card";
import { cn } from "../../lib/utils";
import { swalConfirmDelete, swalSuccess, swalError } from "../../lib/swal";

import { getUsers, editUser } from "../../redux/userSlice";
import { getRoles } from "../../redux/roleSlice";
import Pagination from "../../components/ui/Pagination";
import { assignRoleToUserApi } from "../../services/apiCalls";

export function Permissions() {
  const { userRoles } = usePermission();
  const dispatch = useDispatch();

  const {
    items: users,
    loading: usersLoading,
    pagination,
  } = useSelector((state) => state.users);
  const { items: roles, loading: rolesLoading } = useSelector(
    (state) => state.roles,
  );

  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = (customParams = {}) => {
    const params = {
      // assigned_by_me: true,
      page: customParams.page || pagination.page || 1,
      limit: 10,
      search: searchTerm || undefined,
      ...customParams,
    };
    dispatch(getUsers(params));
  };

  useEffect(() => {
    fetchData({ page: 1 });
    dispatch(getRoles());
  }, [dispatch]);

  const activeRoleData = useMemo(() => {
    return roles.find((r) => r.id === selectedRoleId);
  }, [selectedRoleId, roles]);

  const activeUserData = useMemo(() => {
    return users.find((u) => u.id === selectedUserId);
  }, [selectedUserId, users]);

  const sortedUsers = useMemo(() => {
    if (!users) return [];
    return [...users].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at),
    );
  }, [users]);

  // const handleAssignRole = async () => {
  //     if (!selectedUserId || !selectedRoleId) {
  //         toast.error("Please select both a user and a role");
  //         return;
  //     }

  //     const toastId = toast.loading("Updating user permissions...");
  //     try {
  //         await dispatch(editUser({
  //             id: selectedUserId,
  //             data: { role_id: selectedRoleId }
  //         })).unwrap();

  //         toast.success("Role assigned successfully", { id: toastId });
  //         setSelectedUserId("");
  //         setSelectedRoleId("");
  //         fetchData();
  //     } catch (err) {
  //         toast.error(err || "Failed to assign role", { id: toastId });
  //     }
  // };

  const handleAssignRole = async () => {
    if (!selectedUserId || !selectedRoleId) {
      toast.error("Please select both a user and a role");
      return;
    }

    const toastId = toast.loading("Updating user permissions...");
    try {
      await assignRoleToUserApi(selectedUserId, selectedRoleId);

      toast.success("Role assigned successfully", { id: toastId });
      setSelectedUserId("");
      setSelectedRoleId("");
      fetchData();
    } catch (err) {
      toast.error(err || "Failed to assign role", { id: toastId });
    }
  };

  const handlePageChange = (newPage) => {
    fetchData({ page: newPage });
    const tableElement = document.getElementById("assigned-users-registry");
    if (tableElement) tableElement.scrollIntoView({ behavior: "smooth" });
  };

  const clearFilters = () => {
    setSelectedUserId("");
    setSelectedRoleId("");
    setSearchTerm("");
    fetchData({ page: 1, search: undefined });
  };

  const formatPermission = (perm) => {
    return perm
      .split(":")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const selectClass =
    "w-full bg-card-bg border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-main focus:border-primary focus:outline-none appearance-none cursor-pointer hover:border-primary/50 transition-all";

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-text-main uppercase tracking-tight">
            Role & Permissions
          </h1>
          <p className="text-xs md:text-sm text-primary mt-1 font-medium">
            <Link to="/" className="hover:underline">
              Dashboard
            </Link>
            <span className="text-text-muted mx-2">&gt;&gt;</span> Admin
            Settings
            <span className="text-text-muted mx-2">&gt;&gt;</span> Permissions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={clearFilters}
            className="border-border-subtle text-text-muted h-10 text-xs"
          >
            <RotateCcw size={14} className="mr-2" /> Reset
          </Button>
          {userRoles.assign && (
            <Button
              onClick={handleAssignRole}
              className="bg-primary hover:bg-primary/90 text-black font-bold h-10 px-6 shadow-lg rounded-xl text-xs"
            >
              <ShieldCheck size={16} className="mr-2" /> Save Assignment
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card-bg border-border-subtle shadow-sm overflow-hidden">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-primary mb-2">
              <UserCheck size={18} />
              <h3 className="font-bold uppercase text-[10px] tracking-widest">
                Target User
              </h3>
            </div>
            <div className="relative">
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className={selectClass}
              >
                <option value="">-- Choose User --</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
              <ChevronRight
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                size={16}
              />
            </div>
            {activeUserData && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-dashboard-bg/30 rounded-lg border border-primary/10 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  {activeUserData.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-text-main">
                    {activeUserData.name}
                  </p>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">
                    Current Role: {activeUserData.role?.name || "None"}
                  </p>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card-bg border-border-subtle shadow-sm overflow-hidden">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-primary mb-2">
              <ShieldAlert size={18} />
              <h3 className="font-bold uppercase text-[10px] tracking-widest">
                Designated Role
              </h3>
            </div>
            <div className="relative">
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className={selectClass}
              >
                <option value="">-- Select Role --</option>
                {roles
                  .filter((r) => r.is_active)
                  .map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name.toUpperCase()}
                    </option>
                  ))}
              </select>
              <ChevronRight
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                size={16}
              />
            </div>
            {activeRoleData && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-green-500/5 rounded-lg border border-green-500/20 flex items-center gap-3"
              >
                <div className="p-2 bg-green-500/20 rounded-lg text-green-500">
                  <Settings size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-text-main uppercase">
                    {activeRoleData.name}
                  </p>
                  <p className="text-[10px] text-green-500 font-bold uppercase">
                    {activeRoleData.permissions?.length} Permissions Bundled
                  </p>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card
        id="assigned-users-registry"
        className="bg-card-bg border-border-subtle shadow-sm overflow-hidden rounded-2xl"
      >
        <CardContent className="p-0">
          <div className="p-6 bg-dashboard-bg/30 border-b border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Shield size={18} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-main">
                  Assigned Users Registry
                </h2>
                <p className="text-xs text-text-muted">
                  Users managed by your account
                </p>
              </div>
            </div>
            <div className="relative w-full md:w-72">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                size={16}
              />
              <input
                type="text"
                placeholder="Search by name..."
                className="w-full bg-card-bg border border-border-subtle rounded-lg pl-10 pr-4 py-2 text-xs text-text-main focus:border-primary focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchData({ page: 1 })}
              />
            </div>
          </div>

          {usersLoading ? (
            <div className="py-20 flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-primary" size={32} />
              <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest">
                Loading Registry...
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-dashboard-bg/50 text-text-muted text-[10px] font-bold uppercase tracking-widest border-b border-border-subtle">
                      <th className="px-6 py-4">User Details</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Active Role</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {sortedUsers.length === 0 ? (
                      <tr>
                        <td
                          colSpan="4"
                          className="py-10 text-center text-text-muted text-[10px] uppercase font-bold tracking-widest"
                        >
                          No assigned users found
                        </td>
                      </tr>
                    ) : (
                      sortedUsers.map((user) => (
                        <tr
                          key={user.id}
                          className="hover:bg-dashboard-bg/20 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-[10px]">
                                {user.name.charAt(0)}
                              </div>
                              <span className="text-sm font-bold text-text-main">
                                {user.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-[11px] text-text-muted truncate max-w-[200px]">
                              <Mail size={12} /> {user.email}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase">
                              <Lock size={12} />{" "}
                              {user.role?.name || "Unassigned"}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => setSelectedUserId(user.id)}
                                title="Modify Role"
                                className="p-1.5 text-primary border border-primary/20 rounded-lg hover:bg-primary/10 transition-all"
                              >
                                <Edit size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Integration */}
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.pages}
                totalEntries={pagination.total}
                limit={pagination.limit}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </CardContent>
      </Card>

      <AnimatePresence>
        {activeRoleData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <Card className="bg-card-bg border-border-subtle shadow-sm overflow-hidden rounded-2xl border-t-2 border-t-primary">
              <CardContent className="p-0">
                <div className="p-6 bg-dashboard-bg/30 border-b border-border-subtle flex items-center gap-3">
                  <ShieldCheck className="text-primary" size={20} />
                  <h2 className="text-lg font-bold text-text-main uppercase tracking-tight">
                    Access Matrix: {activeRoleData.name}
                  </h2>
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {activeRoleData.permissions?.map((permission) => (
                    <div
                      key={permission}
                      className="flex items-center gap-3 p-3 bg-dashboard-bg/40 border border-border-subtle rounded-xl hover:border-primary/30 transition-all group"
                    >
                      <CheckCircle2
                        size={16}
                        className="text-green-500 shrink-0 group-hover:scale-110 transition-transform"
                      />
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-text-main truncate">
                          {formatPermission(permission)}
                        </p>
                        <p className="text-[9px] text-text-muted font-mono">
                          {permission}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
