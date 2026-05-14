import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import {
  fetchWarehousesApi,
  createWarehouseApi,
  fetchWarehouseByPincodeApi,
  updateWarehouseApi,
} from "../services/apiCalls";

export const fetchWarehouses = createAsyncThunk(
  "warehouse/fetchWarehouses",

  async (_, { rejectWithValue }) => {
    try {
      return await fetchWarehousesApi();
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || "Failed to fetch warehouses",
      );
    }
  },
);

export const fetchWarehouseByPincode = createAsyncThunk(
  "warehouse/fetchWarehouseByPincode",

  async (pincode, { rejectWithValue }) => {
    try {
      return await fetchWarehouseByPincodeApi(pincode);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || "Failed to fetch warehouse by pincode",
      );
    }
  },
);

export const createWarehouse = createAsyncThunk(
  "warehouse/createWarehouse",

  async (data, { rejectWithValue }) => {
    try {
      return await createWarehouseApi(data);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || "Failed to create warehouse",
      );
    }
  },
);

export const updateWarehouse = createAsyncThunk(
  "warehouse/updateWarehouse",

  async ({ addressId, data }, { rejectWithValue }) => {
    try {
      return await updateWarehouseApi(addressId, data);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || "Failed to update warehouse",
      );
    }
  },
);

const warehouseSlice = createSlice({
  name: "warehouse",

  initialState: {
    items: [],
    loading: false,
    error: null,
  },

  reducers: {},

  extraReducers: (builder) => {
    builder

      /* FETCH */
      .addCase(fetchWarehouses.pending, (state) => {
        state.loading = true;
      })

      .addCase(fetchWarehouses.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload || [];
        state.error = null;
      })

      .addCase(fetchWarehouses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* FETCH BY PINCODE */
      .addCase(fetchWarehouseByPincode.pending, (state) => {
        state.loading = true;
      })

      .addCase(fetchWarehouseByPincode.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload || [];
        state.error = null;
      })

      .addCase(fetchWarehouseByPincode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* CREATE */
      .addCase(createWarehouse.pending, (state) => {
        state.loading = true;
      })

      .addCase(createWarehouse.fulfilled, (state, action) => {
        state.loading = false;

        state.items.unshift(action.payload);

        state.error = null;
      })

      .addCase(createWarehouse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* UPDATE */
      .addCase(updateWarehouse.pending, (state) => {
        state.loading = true;
      })

      .addCase(updateWarehouse.fulfilled, (state, action) => {
        state.loading = false;

        state.items = state.items.map((item) =>
          item.id === action.payload.id ? action.payload : item,
        );

        state.error = null;
      })

      .addCase(updateWarehouse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default warehouseSlice.reducer;
