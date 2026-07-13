import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  createPickupAddressApi,
  fetchPickupAddressesApi,
  updatePickupAddressApi,
  deletePickupAddressApi,
  createConsigneeApi,
  fetchConsigneesApi,
  updateConsigneeApi, // Added this import
  createOrderApi,
  fetchOrdersApi,
  fetchOrderCountsApi,
  duplicateOrderApi,
  updateOrderApi,
  deleteOrderApi,
  fetchOrdersByEntityApi,
} from "../services/apiCalls";

/**
 * Filter orders by specific entities
 */
export const fetchOrdersByEntity = createAsyncThunk(
  "orders/fetchOrdersByEntity",
  async (params, { rejectWithValue }) => {
    try {
      return await fetchOrdersByEntityApi(params);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || "Failed to filter orders by entity"
      );
    }
  }
);

export const createPickupAddress = createAsyncThunk(
  "orders/createPickupAddress",
  async (data, { rejectWithValue }) => {
    try {
      return await createPickupAddressApi(data);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || "Failed to create pickup address"
      );
    }
  }
);

export const fetchPickupAddresses = createAsyncThunk(
  "orders/fetchPickupAddresses",
  async (params, { rejectWithValue }) => {
    try {
      return await fetchPickupAddressesApi(params);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || "Failed to fetch pickup addresses"
      );
    }
  }
);

export const updatePickupAddress = createAsyncThunk(
  "orders/updatePickupAddress",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await updatePickupAddressApi(id, data);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || "Failed to update pickup address"
      );
    }
  }
);

export const deletePickupAddress = createAsyncThunk(
  "orders/deletePickupAddress",
  async (id, { rejectWithValue }) => {
    try {
      await deletePickupAddressApi(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || "Failed to delete pickup address"
      );
    }
  }
);

export const createConsignee = createAsyncThunk(
  "orders/createConsignee",
  async (data, { rejectWithValue }) => {
    try {
      return await createConsigneeApi(data);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || "Failed to create consignee"
      );
    }
  }
);

// --- ADDED UPDATE CONSIGNEE THUNK ---
export const updateConsignee = createAsyncThunk(
  "orders/updateConsignee",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await updateConsigneeApi(id, data);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || "Failed to update consignee"
      );
    }
  }
);

export const fetchConsignees = createAsyncThunk(
  "orders/fetchConsignees",
  async (params, { rejectWithValue }) => {
    try {
      return await fetchConsigneesApi(params);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || "Failed to fetch consignees"
      );
    }
  }
);

export const createOrder = createAsyncThunk(
  "orders/createOrder",
  async (orderData, { rejectWithValue }) => {
    try {
      return await createOrderApi(orderData);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || "Order creation failed"
      );
    }
  }
);

export const fetchOrders = createAsyncThunk(
  "orders/fetchOrders",
  async (params, { rejectWithValue }) => {
    try {
      return await fetchOrdersApi(params);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || "Failed to fetch orders"
      );
    }
  }
);

export const fetchOrderCounts = createAsyncThunk(
  "orders/fetchOrderCounts",
  async (_, { rejectWithValue }) => {
    try {
      return await fetchOrderCountsApi();
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || "Failed to fetch order counts"
      );
    }
  }
);

export const duplicateOrder = createAsyncThunk(
  "orders/duplicateOrder",
  async (orderId, { rejectWithValue }) => {
    try {
      return await duplicateOrderApi(orderId);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || "Failed to duplicate order"
      );
    }
  }
);

export const updateOrder = createAsyncThunk(
  "orders/updateOrder",
  async ({ orderId, data }, { rejectWithValue }) => {
    try {
      return await updateOrderApi(orderId, data);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || "Failed to update order"
      );
    }
  }
);

export const deleteOrder = createAsyncThunk(
  "orders/deleteOrder",
  async (orderId, { rejectWithValue }) => {
    try {
      await deleteOrderApi(orderId);
      return orderId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || "Failed to delete order"
      );
    }
  }
);

const orderSlice = createSlice({
  name: "orders",
  initialState: {
    pickupAddresses: [],
    consignees: [],
    orders: [],
    totalOrders: 0,
    totalPages: 1,
    page: 1,
    limit: 25,
    orderCounts: {},
    selectedAddress: null,
    totalPickupAddresses: 0,
    totalConsignees: 0,
    loading: false,
    orderLoading: false,
    error: null,
    lastCreatedOrder: null,
  },
  reducers: {
    clearOrderError: (state) => {
      state.error = null;
    },
    clearSelectedAddress: (state) => {
      state.selectedAddress = null;
    },
    setSelectedAddress: (state, action) => {
      state.selectedAddress = action.payload;
    },
    resetOrderState: (state) => {
      state.lastCreatedOrder = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrdersByEntity.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOrdersByEntity.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload;
        if (Array.isArray(data)) {
          state.orders = data;
          state.totalOrders = data.length;
          state.totalPages = 1;
          state.page = 1;
        } else {
          state.orders = data.items || [];
          state.totalOrders = data.pagination?.total || data.total || 0;
          state.totalPages = data.pagination?.pages || 1;
        }
        state.error = null;
      })
      .addCase(fetchOrdersByEntity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // PICKUP ADDRESSES
      .addCase(createPickupAddress.pending, (state) => {
        state.loading = true;
      })
      .addCase(createPickupAddress.fulfilled, (state, action) => {
        state.loading = false;
        state.pickupAddresses.unshift(action.payload);
        state.selectedAddress = action.payload;
        state.error = null;
      })
      .addCase(createPickupAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchPickupAddresses.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPickupAddresses.fulfilled, (state, action) => {
        state.loading = false;
        state.pickupAddresses = action.payload.items || [];
        state.totalPickupAddresses = action.payload.total || 0;
        state.error = null;
        if (!state.selectedAddress && action.payload.items?.length > 0) {
          state.selectedAddress = action.payload.items[0];
        }
      })
      .addCase(fetchPickupAddresses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updatePickupAddress.fulfilled, (state, action) => {
        state.loading = false;
        state.pickupAddresses = state.pickupAddresses.map((addr) =>
          addr.id === action.payload.id ? action.payload : addr
        );
        // If the current selected address was updated, sync it
        if(state.selectedAddress?.id === action.payload.id) {
            state.selectedAddress = action.payload;
        }
      })

      .addCase(deletePickupAddress.fulfilled, (state, action) => {
        state.pickupAddresses = state.pickupAddresses.filter(
          (addr) => addr.id !== action.payload
        );
      })

      // CONSIGNEES
      .addCase(fetchConsignees.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchConsignees.fulfilled, (state, action) => {
        state.loading = false;
        state.consignees = action.payload.items || [];
        state.totalConsignees = action.payload.total || 0;
      })
      .addCase(fetchConsignees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(createConsignee.fulfilled, (state, action) => {
        state.consignees.unshift(action.payload);
      })

      // --- ADDED UPDATE CONSIGNEE REDUCER ---
      .addCase(updateConsignee.fulfilled, (state, action) => {
        state.loading = false;
        state.consignees = state.consignees.map((c) =>
          c.id === action.payload.id ? action.payload : c
        );
      })

      // ORDERS
      .addCase(createOrder.pending, (state) => {
        state.orderLoading = true;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.orderLoading = false;
        state.lastCreatedOrder = action.payload;
        state.error = null;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.orderLoading = false;
        state.error = action.payload;
      })

      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        const pagination = action.payload?.pagination || {};
        state.orders = action.payload?.items || [];
        state.totalOrders = pagination.total || 0;
        state.page = pagination.page || 1;
        state.limit = pagination.limit || 25;
        state.totalPages = pagination.pages || 1;
        state.error = null;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchOrderCounts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOrderCounts.fulfilled, (state, action) => {
        state.loading = false;
        state.orderCounts = action.payload;
      })
      .addCase(fetchOrderCounts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(duplicateOrder.pending, (state) => {
        state.loading = true;
      })
      .addCase(duplicateOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.orders.unshift(action.payload);
        state.totalOrders += 1;
      })
      .addCase(duplicateOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updateOrder.pending, (state) => {
        state.orderLoading = true;
      })
      .addCase(updateOrder.fulfilled, (state, action) => {
        state.orderLoading = false;
        state.orders = state.orders.map((order) =>
          order.id === action.payload.id ? action.payload : order
        );
      })
      .addCase(updateOrder.rejected, (state, action) => {
        state.orderLoading = false;
        state.error = action.payload;
      })

      .addCase(deleteOrder.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = state.orders.filter(
          (order) => order.id !== action.payload
        );
        state.totalOrders -= 1;
      })
      .addCase(deleteOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearOrderError,
  clearSelectedAddress,
  setSelectedAddress,
  resetOrderState,
} = orderSlice.actions;

export default orderSlice.reducer;