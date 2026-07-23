import { useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import { hasPermission, SUPER_ADMIN_ROLES } from "../lib/permissions";

export function usePermission() {
  const { role, permissions } = useSelector((state) => state.auth || {});
  const userPerms = useMemo(() => permissions || [], [permissions]);

  const isSuperAdmin = useMemo(() => SUPER_ADMIN_ROLES.includes(role), [role]);

  const can = useCallback(
    (permissionCode) => hasPermission(userPerms, role, permissionCode),
    [userPerms, role]
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
      send: can("communication:send"),
    },

    consignees: {
      create: can("consignees:create"),
      view: can("consignees:view"),
      edit: can("consignees:edit"),
      delete: can("consignees:delete"),
    },

    fleet: {
      drivers: {
        view: can("fleet:drivers:view"),
        create: can("fleet:drivers:create"),
        update: can("fleet:drivers:update"),
        delete: can("fleet:drivers:delete"),
        approve: can("fleet:drivers:approve"),
      },
      vehicles: {
        view: can("fleet:vehicle:view"),
        create: can("fleet:vehicle:create"),
        update: can("fleet:vehicle:update"),
        delete: can("fleet:vehicle:delete"),
      },
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
      delete: can("invoices:delete"),
    },

    monthEndClosing: {
      view: can("month_end_closing:view"),
      submit: can("month_end_closing:submit"),
      approve: can("month_end_closing:approve"),
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

    reset: {
      location: can("reset:location"),
    },

    reviews: {
      create: can("reviews:create"),
      delete: can("reviews:delete"),
      edit: can("reviews:edit"),
      view: can("reviews:view"),
      approve: can("reviews:approve"),
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

    tripsheet: {
      create: can("tripsheet:create"),
      view: can("tripsheet:view"),
      update: can("tripsheet:update"),
      delete: can("tripsheet:delete"),
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