export const SUPER_ADMIN_ROLES = ["super_admin", "Super Admin"];

export const hasPermission = (permissions, role, permission) => {
  if (SUPER_ADMIN_ROLES.includes(role)) return true;
  if (!permission) return true;

  if (Array.isArray(permission)) {
    return permission.some((p) => permissions?.includes(p));
  }

  return permissions?.includes(permission);
};

export const hasAllPermissions = (permissions, role, required) => {
  if (SUPER_ADMIN_ROLES.includes(role)) return true;
  if (!required?.length) return true;
  return required.every((p) => permissions?.includes(p));
};
