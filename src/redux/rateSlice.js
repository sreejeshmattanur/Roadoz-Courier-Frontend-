import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import Cookies from "js-cookie";

const BASE_URL = import.meta.env.VITE_APP_BASE_URL || "http://api.roadozcourier.com/api/v1";

export const calculateRates = createAsyncThunk(
  "rate/calculate",
  async (payload, { rejectWithValue }) => {
    try {
      const token = Cookies.get("access_token");
      const response = await axios.post(`${BASE_URL}/rate-calculator/calculate`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Calculation failed");
    }
  }
);

const rateSlice = createSlice({
  name: "rate",
  initialState: { result: null, loading: false, error: null },
  reducers: {
    clearRateResult: (state) => {
      state.result = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(calculateRates.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(calculateRates.fulfilled, (state, action) => { state.loading = false; state.result = action.payload; })
      .addCase(calculateRates.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export const { clearRateResult } = rateSlice.actions;
export default rateSlice.reducer;