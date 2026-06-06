import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Edit,
  Trash2,
  ToggleRight,
  ToggleLeft,
  Shield,
  Plus,
  Download,
  Search,
  Filter,
  RotateCcw,
} from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import Pagination from "../../components/ui/Pagination";

import { fetchRoles, deleteRole, updateRole } from "../../redux/roleSlice";
import { usePermission } from "../../hooks/usePermission";

export function RolesManagement() {
  const dispatch = useDispatch();
  const { roles: rolePerms } = usePermission();
  const { items, loading, pagination } = useSelector((state) => state.roles);

  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetchData({ page: 1 });
  }, []);

  // FIXED: removed backend filters
  const fetchData = (custom = {}) => {
    dispatch(
      fetchRoles({
        page: custom.page || 1,
        limit: 10,
      }),
    );
  };

  // FIXED: no API call on clear
  const clearFilters = () => {
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
  };

  const exportToCSV = () => {
    if (!items?.length) return;

    const headers = ["Role,Status,Permissions,Created"];
    const rows = items.map((r) =>
      [
        r.name,
        r.is_active ? "Active" : "Inactive",
        r.permissions?.join("|"),
        new Date(r.created_at).toLocaleDateString(),
      ].join(","),
    );

    const csv =
      "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", "roles.csv");
    link.click();
  };

  // NEW: frontend filtering + search
  const filteredRoles = useMemo(() => {
    if (!items) return [];

    let data = [...items];

    // SEARCH (name + permissions)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();

      data = data.filter((role) => {
        const nameMatch = role.name.toLowerCase().includes(term);

        const permissionMatch = role.permissions?.some((perm) =>
          perm.toLowerCase().includes(term),
        );

        return nameMatch || permissionMatch;
      });
    }

    // DATE FILTER
    if (startDate) {
      data = data.filter(
        (role) => new Date(role.created_at) >= new Date(startDate),
      );
    }

    if (endDate) {
      data = data.filter(
        (role) => new Date(role.created_at) <= new Date(endDate),
      );
    }

    // SORT
    return data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [items, searchTerm, startDate, endDate]);

  const toggleStatus = async (role) => {
    try {
      await dispatch(
        updateRole({
          id: role.id,
          data: { is_active: !role.is_active },
        }),
      ).unwrap();

      toast.success(
        `Role ${role.is_active ? "deactivated" : "activated"} successfully`,
      );

      fetchData({ page: pagination?.page || 1 });
    } catch (err) {
      toast.error("Failed to update role status");
    }
  };

  const handleDelete = async (id) => {
    try {
      await dispatch(deleteRole(id)).unwrap();

      toast.success("Role deleted successfully");

      fetchData({ page: pagination?.page || 1 });
    } catch (err) {
      toast.error("Failed to delete role");
    }
  };

  return (
    <div className="space-y-6 pb-20 p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-text-main uppercase tracking-tight">
            Role Management
          </h1>
          <p className="text-xs md:text-sm text-primary mt-1 font-medium">
            Dashboard <span className="mx-2 text-text-muted">&gt;&gt;</span>
            Admin Settings
            <span className="mx-2 text-text-muted">&gt;&gt;</span>
            Roles
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={exportToCSV}
            className="flex-1 sm:flex-none border border-border-subtle h-10 px-4 text-xs text-text-main rounded-xl flex items-center justify-center gap-2 hover:bg-dashboard-bg/40 transition"
          >
            <Download size={16} />
            Export CSV
          </button>

          {rolePerms.create && (
            <button
              onClick={() => navigate("/dashboard/admin/roles/add")}
              className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-black font-bold h-10 px-4 rounded-xl shadow-lg text-xs flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Add New Role
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-card-bg border-border-subtle shadow-sm">
        <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-text-muted ml-1">
                Search Role
              </label>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Role name..."
                  className="bg-transparent border border-border-subtle rounded-lg px-3 py-2 pl-10 text-xs text-text-main w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-text-muted ml-1">
                Created From
              </label>
              <input
                type="date"
                className="bg-transparent border border-border-subtle rounded-lg px-3 py-2 text-xs w-full"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-text-muted ml-1">
                Created To
              </label>
              <input
                type="date"
                className="bg-transparent border border-border-subtle rounded-lg px-3 py-2 text-xs w-full"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => fetchData({ page: 1 })}
                className="flex-1 bg-primary hover:bg-primary/90 text-black h-9 text-xs rounded-lg flex items-center justify-center gap-2"
              >
                <Filter size={14} />
                Filter
              </Button>

              <button
                onClick={clearFilters}
                className="h-9 px-3 border border-border-subtle text-text-muted rounded-lg"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="bg-card-bg border-border-subtle shadow-sm overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-dashboard-bg/50 text-text-muted text-[10px] font-bold uppercase tracking-widest border-b border-border-subtle">
                <th className="px-6 py-4">No</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Permissions</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border-subtle">
              {filteredRoles.map((role, index) => (
                <tr
                  key={role.id}
                  className="hover:bg-dashboard-bg/20 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-bold text-text-main">
                    {index + 1}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary/20 rounded-full flex items-center justify-center">
                        <Shield size={14} className="text-primary" />
                      </div>
                      <span className="font-bold text-text-main capitalize">
                        {role.name}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2 max-w-md">
                      {role.permissions?.length > 0 ? (
                        role.permissions.map((perm, i) => {
                          const [module, action] = perm.split(":");
                          return (
                            <span
                              key={i}
                              className="text-[10px] px-2 py-1 rounded-md bg-primary/10 text-primary border border-primary/20 font-semibold capitalize"
                            >
                              {module} : {action}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-xs text-text-muted">
                          No Permissions
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    {rolePerms.edit ? (
                      <button onClick={() => toggleStatus(role)}>
                        {role.is_active ? (
                          <ToggleRight size={28} className="text-green-500" />
                        ) : (
                          <ToggleLeft size={28} className="text-text-muted/50" />
                        )}
                      </button>
                    ) : (
                      <span className={`text-[10px] px-2 py-1 rounded font-bold ${role.is_active ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                        {role.is_active ? "ACTIVE" : "INACTIVE"}
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex justify-center items-center gap-2">
                      {rolePerms.edit && (
                        <button
                          onClick={() =>
                            navigate(`/dashboard/admin/roles/edit/${role.id}`)
                          }
                          className="p-1.5 text-primary bg-primary/10 rounded-lg border border-primary/20 hover:bg-primary hover:text-black"
                        >
                          <Edit size={16} />
                        </button>
                      )}

                      {rolePerms.delete && (
                        <button
                          onClick={() => handleDelete(role.id)}
                          className="p-1.5 text-red-500 bg-red-500/10 rounded-lg border border-red-500/20 hover:bg-red-500 hover:text-white"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={pagination?.page || 1}
          totalPages={pagination?.pages || 1}
          totalEntries={pagination?.total || 0}
          onPageChange={(p) => fetchData({ page: p })}
        />
      </Card>

      {loading && (
        <div className="text-center py-10 text-primary font-bold">
          Loading roles...
        </div>
      )}
    </div>
  );
}
