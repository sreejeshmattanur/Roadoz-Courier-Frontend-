import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchActivityLogsApi } from "../services/apiCalls"; 

export const getActivityLogs = createAsyncThunk(
  "activityLogs/get", 
  async (params, { rejectWithValue }) => {
    try {
      const response = await fetchActivityLogsApi(params);
      return response;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch activity logs");
    }
  }
);

const activityLogSlice = createSlice({
  name: "activityLogs",
  initialState: { 
    items: [], 
    loading: false, 
    pagination: {
        total: 0,
        page: 1,
        size: 50,
        pages: 0
    } 
  },
  reducers: {
  },
  extraReducers: (builder) => {
    builder
      .addCase(getActivityLogs.pending, (state) => { 
        state.loading = true; 
      })
      .addCase(getActivityLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items; 
        
        // Update pagination data
        state.pagination = {
          total: action.payload.total,
          page: action.payload.page,
          size: action.payload.size,
          // Calculate total pages for the Pagination component
          pages: Math.ceil(action.payload.total / action.payload.size)
        };
      })
      // Handle the "Error" state
      .addCase(getActivityLogs.rejected, (state) => { 
        state.loading = false; 
      });
  }
});

export default activityLogSlice.reducer;