import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import profileReducer from "./profileSlice";
import franchiseReducer from "./franchiseSlice";
import userReducer from "./userSlice";
import roleReducer from "./roleSlice";
import permissionReducer from "./permissionSlice";
import orderReducer from "./orderSlice";
import walletReducer from "./walletSlice";
import remittanceReducer from "./remittanceSlice";
import invoiceReducer from "./invoiceSlice";
import consigneeReducer from "./consigneeSlice";
import activityLogReducer from "./activityLogSlice";
import warehouseReducer from "./warehouseSlice";
import reviewReducer from "./reviewSlice";
import bulkOrderReducer from "./bulkOrderSlice";
import notificationReducer from "./notificationSlice";
import rateReducer from "./rateSlice";
import reportsReducer from "./reportsSlice";
import analyticsReducer from "./analyticsSlice";
export const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
    franchise: franchiseReducer,
    users: userReducer,
    roles: roleReducer,
    permissions: permissionReducer,
    consignees: consigneeReducer,
    orders: orderReducer,
    wallet: walletReducer,
    remittance: remittanceReducer,
    invoices: invoiceReducer,
    activityLogs: activityLogReducer,
    bulkOrders: bulkOrderReducer,
    warehouse: warehouseReducer,
    review: reviewReducer,
    notifications: notificationReducer,
    rate: rateReducer,
    reports: reportsReducer,
    analytics: analyticsReducer,
  },
});
