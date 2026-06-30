import { useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import { hasPermission, SUPER_ADMIN_ROLES } from "../lib/permissions";

export function usePermission() {
  const { role, permissions } = useSelector((state) => state.auth || {});
    const userPerms = useMemo(() => permissions || [], [permissions]);
  
  const isSuperAdmin = useMemo(() => SUPER_ADMIN_ROLES.includes(role), [role]);

 
  const can = useCallback(
    (permissionCode) => hasPermission(userPerms, role, permissionCode),
    [userPerms, role],
  );

  return {
    role,
    permissions: userPerms,
    isSuperAdmin,
    can, 
    has: can, 

    activityLogs: {
      view: can("activity_logs:view"),
    },

    bags: {
      manage: can("bags:manage"),
      view: can("bags:view"),
    },

    communication: {
      view: can("communication:view"),
    },

    consignees: {
      create: can("consignees:create"),
      view: can("consignees:view"),
      edit: can("consignees:edit"),
      delete: can("consignees:delete"),
    },

    franchises: {
      create: can("franchises:create"),
      delete: can("franchises:delete"),
      edit: can("franchises:edit"),
      view: can("franchises:view"),
    },

    invoices: {
      generate: can("invoices:generate"),
      view: can("invoices:view"),
    },

    orders: {
      create: can("orders:create"),
      delete: can("orders:delete"),
      edit: can("orders:edit"),
      view: can("orders:view"),
    },

    permissionsModule: {
      create: can("permissions:create"),
      delete: can("permissions:delete"),
      edit: can("permissions:edit"),
      view: can("permissions:view"),
    },

    pickupAddresses: {
      create: can("pickup_addresses:create"),
      view: can("pickup_addresses:view"),
    },

    profile: {
      edit: can("profile:edit"),
      view: can("profile:view"),
    },

    remittances: {
      manage: can("remittances:manage"),
      view: can("remittances:view"),
    },

    reviews: {
      create: can("reviews:create"),
      delete: can("reviews:delete"),
      edit: can("reviews:edit"),
      view: can("reviews:view"),
    },

    roles: {
      create: can("roles:create"),
      delete: can("roles:delete"),
      edit: can("roles:edit"),
      view: can("roles:view"),
    },

    tickets: {
      create: can("tickets:create"),
      view: can("tickets:view"),
    },

    userRoles: {
      assign: can("user_roles:assign"),
    },

    users: {
      create: can("users:create"),
      delete: can("users:delete"),
      edit: can("users:edit"),
      view: can("users:view"),
    },

    wallet: {
      manage: can("wallet:manage"),
      recharge: can("wallet:recharge"),
      view: can("wallet:view"),
    },

    warehouse: {
      create: can("warehouse:create"),
      delete: can("warehouse:delete"),
      edit: can("warehouse:edit"),
      view: can("warehouse:view"),
    },

    webConfig: {
      edit: can("webconfig:edit"),
      view: can("webconfig:view"),
    },
  };
}