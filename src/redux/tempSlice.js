import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { uploadBulkOrderApi } from "../services/apiCalls";

export const bulkUploadOrders = createAsyncThunk(
  "bulkOrders/bulkUploadOrders",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await uploadBulkOrderApi(formData);
      return response?.data || response;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "Bulk order upload failed"
      );
    }
  }
);


const initialState = {
  loading: false,
  error: null,
  success: false,
  data: null,
};

const bulkOrderSlice = createSlice({
  name: "bulkOrders",
  initialState,

  reducers: {
    resetOrderState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.data = null;
    },
  },

  extraReducers: (builder) => {
    builder

      .addCase(bulkUploadOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })

      .addCase(bulkUploadOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.data = action.payload;
      })

      .addCase(bulkUploadOrders.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      });
  },
});


export const { resetOrderState } = bulkOrderSlice.actions;

export default bulkOrderSlice.reducer;