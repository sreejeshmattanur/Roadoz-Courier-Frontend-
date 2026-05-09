import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { uploadBulkOrderApi } from "../services/apiCalls";

export const bulkUploadOrders = createAsyncThunk(
  "orders/bulkUpload",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await uploadBulkOrderApi(formData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Upload failed");
    }
  }
);

const bulkOrderSlice = createSlice({
  name: "bulkOrders",
  initialState: {
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    resetOrderState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bulkUploadOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(bulkUploadOrders.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(bulkUploadOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      });
  },
});

export const { resetOrderState } = bulkOrderSlice.actions;
export default bulkOrderSlice.reducer;