import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import {
  fetchOrderReviewsApi,
  fetchServiceReviewsApi,
} from "../services/apiCalls";

// ORDER REVIEWS
export const fetchOrderReviews = createAsyncThunk(
  "review/fetchOrderReviews",
  async ({ page = 1, limit = 10 } = {}) => {
    return await fetchOrderReviewsApi({
      page,
      limit,
    });
  },
);

// SERVICE REVIEWS
export const fetchServiceReviews = createAsyncThunk(
  "review/fetchServiceReviews",
  async ({ page = 1, limit = 10 } = {}) => {
    return await fetchServiceReviewsApi({
      page,
      limit,
    });
  },
);

const reviewSlice = createSlice({
  name: "review",

  initialState: {
    orderReviews: [],
    serviceReviews: [],

    orderPagination: {},
    servicePagination: {},

    loading: false,
    error: null,
  },

  reducers: {},

  extraReducers: (builder) => {
    builder

      // =========================
      // ORDER REVIEWS
      // =========================
      .addCase(fetchOrderReviews.pending, (state) => {
        state.loading = true;

        state.error = null;
      })

      .addCase(fetchOrderReviews.fulfilled, (state, action) => {
        state.loading = false;

        state.orderReviews = action.payload?.data || [];

        state.orderPagination = {
          total_reviews: action.payload?.total_reviews || 0,

          total_pages: action.payload?.total_pages || 1,

          current_page: action.payload?.current_page || 1,

          limit: action.payload?.limit || 10,
        };
      })

      .addCase(fetchOrderReviews.rejected, (state, action) => {
        state.loading = false;

        state.error = action.error.message;
      })

      // =========================
      // SERVICE REVIEWS
      // =========================
      .addCase(fetchServiceReviews.pending, (state) => {
        state.loading = true;

        state.error = null;
      })

      .addCase(fetchServiceReviews.fulfilled, (state, action) => {
        state.loading = false;

        /*
          Swagger schema seems incorrect.

          Supports:
          1. Array response
          2. Object with data array
        */

        if (Array.isArray(action.payload)) {
          state.serviceReviews = action.payload;
        } else {
          state.serviceReviews = action.payload?.data || [];
        }

        state.servicePagination = {
          total_reviews:
            action.payload?.total_reviews || state.serviceReviews.length,

          total_pages: action.payload?.total_pages || 1,

          current_page: action.payload?.current_page || 1,

          limit: action.payload?.limit || 10,
        };
      })

      .addCase(fetchServiceReviews.rejected, (state, action) => {
        state.loading = false;

        state.error = action.error.message;
      });
  },
});

export default reviewSlice.reducer;
