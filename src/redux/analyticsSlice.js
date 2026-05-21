import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchAnalyticsDashboardApi } from "../services/apiCalls";

export const fetchAnalyticsDashboard = createAsyncThunk(
  "analytics/fetchDashboard",
  async (params, { rejectWithValue }) => {
    try {
      const data = await fetchAnalyticsDashboardApi(params);
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.detail || "Failed to load analytics"
      );
    }
  }
);

const analyticsSlice = createSlice({
  name: "analytics",
  initialState: {
    data: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnalyticsDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAnalyticsDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchAnalyticsDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default analyticsSlice.reducer;
