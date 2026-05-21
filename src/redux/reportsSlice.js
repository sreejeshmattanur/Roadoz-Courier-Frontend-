import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API } from '../services/apiCalls'; 

export const fetchReportData = createAsyncThunk(
  'reports/fetchData',
  async ({ endpoint, params }, { rejectWithValue }) => {
    try {
      const response = await API.get(endpoint, { 
        params: { ...params, format: 'json' } 
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.detail || error.response?.data?.message || 'Data Retrieval Error';
      return rejectWithValue(message);
    }
  }
);

const reportsSlice = createSlice({
  name: 'reports',
  initialState: {
    data: null, 
    loading: false,
    error: null,
  },
  reducers: {
    clearReportData: (state) => {
      state.data = null;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReportData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReportData.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchReportData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearReportData } = reportsSlice.actions;
export default reportsSlice.reducer;