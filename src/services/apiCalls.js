import axios from "axios";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { ENDPOINTS } from "./endpoints";

const BASE_URL =
  import.meta.env.VITE_APP_BASE_URL || "http://api.roadozcourier.com/api/v1";

const API = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const isTokenExpired = (token) => {
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch (err) {
    return true;
  }
};

API.interceptors.request.use((config) => {
  const token = Cookies.get("access_token");

  if (token) {
    if (isTokenExpired(token)) {
      console.warn("Token expired. Logging out...");

      Cookies.remove("access_token");
      window.location.href = "/login";

      return Promise.reject("Token expired");
    }

    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const checkRoleApi = async (email) => {
  const res = await API.post(ENDPOINTS.CHECK_ROLE, { email });
  return res.data;
};

export const loginApi = async (data) => {
  const res = await API.post(ENDPOINTS.LOGIN, data);
  return res.data;
};

export const logoutApi = async () => {
  const res = await API.post(ENDPOINTS.LOGOUT);
  return res.data;
};

export const getProfileApi = async () => {
  const res = await API.get(ENDPOINTS.PROFILE);
  return res.data;
};

// export const getProfileImageApi = async () => {
//   const res = await API.get(ENDPOINTS.PROFILE_IMAGE);
//   return res.data;
// };

export const updateProfileApi = async (data) => {
  const res = await API.put(ENDPOINTS.PROFILE, data);
  return res.data;
};

export const uploadProfileImageApi = async (formData) => {
  const res = await API.post(ENDPOINTS.UPLOAD_IMAGE, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

export const changePasswordRequestApi = async (data) => {
  const res = await API.post(ENDPOINTS.CHANGE_PASSWORD_REQUEST, data);
  return res.data;
};

export const changePasswordVerifyApi = async (data) => {
  const res = await API.post(ENDPOINTS.CHANGE_PASSWORD_VERIFY, data);
  return res.data;
};

export const fetchFranchisesApi = async (params) => {
  const res = await API.get(ENDPOINTS.FRANCHISE, { params });
  return res.data;
};

export const fetchFranchiseByIdApi = async (id) => {
  const res = await API.get(`${ENDPOINTS.FRANCHISE}/${id}`);
  return res.data;
};

export const createFranchiseApi = async (data) => {
  const res = await API.post(ENDPOINTS.FRANCHISE, data);
  return res.data;
};

export const updateFranchiseApi = async (id, data) => {
  const res = await API.put(`${ENDPOINTS.FRANCHISE}/${id}`, data);
  return res.data;
};

export const deleteFranchiseApi = async (id) => {
  const res = await API.delete(`${ENDPOINTS.FRANCHISE}/${id}`);
  return res.data;
};

export const fetchUsersApi = async (params) => {
  const res = await API.get(ENDPOINTS.USERS, { params });
  return res.data;
};

export const createUserApi = async (data) => {
  const res = await API.post("/rbac/users", data);
  return res.data;
};

export const updateUserApi = async (id, data) => {
  const res = await API.put(`/rbac/users/${id}`, data);
  return res.data;
};

export const deleteUserApi = async (id) => {
  const res = await API.delete(`/rbac/users/${id}`);
  return res.data;
};

// export const fetchRolesApi = async () => {
//   const res = await API.get("/rbac/roles");
//   return res.data;
// };

// export const assignRoleToUserApi = async (userId, roleId) => {
//   const res = await API.put(`/rbac/users/${userId}`, { role_id: roleId });
//   return res.data;
// };

export const assignRoleToUserApi = async (userId, roleId) => {
  const res = await API.post(`/rbac/assign-role`, {
    user_id: userId,
    role_id: roleId,
  });
  return res.data;
};

export const fetchRolesApi = async (params) => {
  const res = await API.get(ENDPOINTS.ROLES, { params });
  return res.data;
};

export const fetchRoleByIdApi = async (id) => {
  const res = await API.get(`${ENDPOINTS.ROLES}/${id}`);
  return res.data;
};

export const createRoleApi = async (data) => {
  const res = await API.post(ENDPOINTS.ROLES, data);
  return res.data;
};

export const updateRoleApi = async (id, data) => {
  const res = await API.put(`${ENDPOINTS.ROLES}/${id}`, data);
  return res.data;
};

export const deleteRoleApi = async (id) => {
  const res = await API.delete(`${ENDPOINTS.ROLES}/${id}`);
  return res.data;
};

export const fetchPermissionsApi = async (params) => {
  const res = await API.get("/rbac/permissions", { params });
  return res.data;
};

export const fetchPermissionByIdApi = async (id) => {
  const res = await API.get(`/rbac/permissions/${id}`);
  return res.data;
};

export const createPermissionApi = async (data) => {
  const res = await API.post("/rbac/permissions", data);
  return res.data;
};

export const updatePermissionApi = async (id, data) => {
  const res = await API.put(`/rbac/permissions/${id}`, data);
  return res.data;
};

export const deletePermissionApi = async (id) => {
  const res = await API.delete(`/rbac/permissions/${id}`);
  return res.data;
};

export const createPickupAddressApi = async (data) => {
  const res = await API.post("/orders/pickup-addresses", data);
  return res.data;
};

export const fetchPickupAddressesApi = async (params) => {
  const res = await API.get("/orders/pickup-addresses", { params });
  return res.data;
};

export const updatePickupAddressApi = async (id, data) => {
  const res = await API.put(`/orders/pickup-addresses/${id}`, data);
  return res.data;
};

export const deletePickupAddressApi = async (id) => {
  const res = await API.delete(`/orders/pickup-addresses/${id}`);
  return res.data;
};

export const createConsigneeApi = async (data) => {
  const res = await API.post("/orders/consignees", data);
  return res.data;
};

export const fetchConsigneesApi = async (params) => {
  const res = await API.get("/orders/consignees", { params });
  return res.data;
};

export const updateConsigneeApi = async (id, data) => {
  const res = await API.put(`/orders/consignees/${id}`, data);
  return res.data;
};

export const deleteConsigneeApi = async (id) => {
  const res = await API.delete(`/orders/consignees/${id}`);
  return res.data;
};

export const createOrderApi = async (data) => {
  const res = await API.post("/orders", data);
  return res.data;
};

export const fetchOrdersApi = async (params) => {
  const res = await API.get("/orders", { params });
  return res.data;
};

export const fetchWalletTransactionsApi = async (params) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(
      ([_, v]) => v != null && v !== "" && v !== "All",
    ),
  );
  const res = await API.get(ENDPOINTS.WALLET, { params: cleanParams });
  return res.data;
};

export const fetchRemittanceApi = async (params) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v != null && v !== ""),
  );
  const res = await API.get(ENDPOINTS.REMITTANCE, { params: cleanParams });
  return res.data;
};

export const fetchInvoicesApi = async (params) => {
  const res = await API.get(ENDPOINTS.INVOICES, { params });
  return res.data;
};

export const fetchInvoiceByIdApi = async (id) => {
  const res = await API.get(`${ENDPOINTS.INVOICES}/${id}`);
  return res.data;
};

export const getOrderPincodeApi = async (orderNumber, lat, lng) => {

  console.log("[API CALL] getOrderPincodeApi");
  const body = {
    order_number: orderNumber,
    lat: Number(lat),
    lng: Number(lng)
  };

  console.log("📤 JSON Body:", body);

  try {

    const res = await API.post(
      `/orders/get-pincode`,
      `/orders/get-pincode/${orderNumber}`,
      body
    );

    console.log("✅ API SUCCESS");
    console.log("📥 Response:", res.data);

    return res.data;

  } catch (error) {
    console.error("❌ API ERROR:", error);

    throw error;
  }
};


export const scanOrderApi = async (orderNumber) => {
  const res = await API.get(`/orders/scan/${orderNumber}`);
  return res.data;
};

export const fetchTodayScannedOrdersApi = async (filters) => {
  const { date, status, page, limit } = filters;

  const body = { date: date };

  const config = {
    params: {
      status: status,
      page: page,
      limit: limit
    }
  };

  const res = await API.post("/orders/orders/today-status", body, config);

  return res.data;
};

export const getOrderBarcodeApi = async (orderId) => {
  const res = await API.get(`${ENDPOINTS.ORDERS}/${orderId}/barcode`);
  return res.data;
};
