import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchFranchiseApplicationsApi,
  approveFranchiseApi,
  rejectFranchiseApi,
} from "../services/apiCalls"; // adjust path as needed

export const getApplications = createAsyncThunk(
  "franchiseApp/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      return await fetchFranchiseApplicationsApi(params);
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to fetch applications"
      );
    }
  }
);

export const approveApplication = createAsyncThunk(
  "franchiseApp/approve",
  async (data, { rejectWithValue }) => {
    try {
      return await approveFranchiseApi(data);
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to approve application"
      );
    }
  }
);

export const rejectApplication = createAsyncThunk(
  "franchiseApp/reject",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await rejectFranchiseApi(id, data);
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to reject application"
      );
    }
  }
);

const franchiseAppSlice = createSlice({
  name: "franchiseApp",
  initialState: {
    items: [],
    loading: false,
    error: null,
    pagination: {
      total: 0,
      page: 1,
      limit: 10,
      pages: 1,
    },
  },
  reducers: {
    resetAppError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      /* Fetch Applications */
      .addCase(getApplications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getApplications.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
        state.pagination = {
          total: action.payload.total || 0,
          page: action.payload.page || 1,
          limit: action.payload.limit || 10,
          pages: action.payload.pages || 1,
        };
      })
      .addCase(getApplications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* Approve Application */
      .addCase(approveApplication.pending, (state) => {
        state.loading = true;
      })
      .addCase(approveApplication.fulfilled, (state, action) => {
        state.loading = false;
        // Remove from pending list after approval
        const approvedId = action.meta.arg.application_id;
        state.items = state.items.filter((item) => item.id !== approvedId);
        state.pagination.total -= 1;
      })
      .addCase(approveApplication.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* Reject Application */
      .addCase(rejectApplication.pending, (state) => {
        state.loading = true;
      })
      .addCase(rejectApplication.fulfilled, (state, action) => {
        state.loading = false;
        // Remove from list after rejection
        const rejectedId = action.meta.arg.id;
        state.items = state.items.filter((item) => item.id !== rejectedId);
        state.pagination.total -= 1;
      })
      .addCase(rejectApplication.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetAppError } = franchiseAppSlice.actions;
export default franchiseAppSlice.reducer;