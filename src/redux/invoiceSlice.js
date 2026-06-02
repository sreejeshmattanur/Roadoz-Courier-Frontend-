import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchInvoicesApi, fetchInvoiceByIdApi } from "../services/apiCalls";

export const fetchInvoices = createAsyncThunk(
  "invoices/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      return await fetchInvoicesApi(params);
    } catch (error) {
      return rejectWithValue(
        error.response?.data || error.message || "Failed to fetch invoices",
      );
    }
  },
);

export const fetchInvoiceDetail = createAsyncThunk(
  "invoices/fetchDetail",
  async (id, { rejectWithValue }) => {
    try {
      return await fetchInvoiceByIdApi(id);
    } catch (error) {
      return rejectWithValue(
        error.response?.data ||
          error.message ||
          "Failed to fetch invoice details",
      );
    }
  },
);

const initialState = {
  items: [],
  selectedInvoice: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 25,
    pages: 1,
  },
  loading: false,
  detailLoading: false,
  error: null,
};

const invoiceSlice = createSlice({
  name: "invoices",
  initialState,
  reducers: {
    clearSelectedInvoice: (state) => {
      state.selectedInvoice = null;
    },
  },
  extraReducers: (builder) => {
    builder

      // Fetch Invoices
      .addCase(fetchInvoices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.loading = false;

        state.items = action.payload.items || [];

        state.pagination = {
          total: action.payload.total || 0,
          page: action.payload.page || 1,
          limit: action.payload.limit || 25,
          pages: action.payload.pages || 1,
        };
      })

      .addCase(fetchInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Invoice Detail
      .addCase(fetchInvoiceDetail.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })

      .addCase(fetchInvoiceDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedInvoice = action.payload;
      })

      .addCase(fetchInvoiceDetail.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearSelectedInvoice } = invoiceSlice.actions;

export default invoiceSlice.reducer;
