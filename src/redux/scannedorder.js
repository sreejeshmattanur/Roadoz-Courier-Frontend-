import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchTodayScannedOrdersApi, deleteScannedOrderApi } from "../services/apiCalls";
import { toast } from "react-hot-toast";

export const getScannedOrders = createAsyncThunk(
    "scannedOrders/fetchAll",
    async (filters, { rejectWithValue }) => {
        try {
            const response = await fetchTodayScannedOrdersApi(filters);
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data || "Error fetching orders");
        }
    }
);

export const deleteOrder = createAsyncThunk(
    "scannedOrders/delete",
    async (id, { rejectWithValue }) => {
        const toastId = toast.loading("Reverting scan record...");
        try {
            await deleteScannedOrderApi(id);
            toast.success("Scan record reverted", { id: toastId });
            return id; 
        } catch (error) {
            toast.error("Failed to delete record", { id: toastId });
            return rejectWithValue(error.response?.data);
        }
    }
);

const scannedOrderSlice = createSlice({
    name: "scannedOrders",
    initialState: {
        orders: [],
        pagination: { page: 1, total_pages: 1 },
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(getScannedOrders.pending, (state) => { state.loading = true; })
            .addCase(getScannedOrders.fulfilled, (state, action) => {
                state.loading = false;
                state.orders = action.payload.orders || [];
                state.pagination = action.payload.pagination || { page: 1, total_pages: 1 };
            })
            .addCase(getScannedOrders.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(deleteOrder.fulfilled, (state, action) => {
                state.orders = state.orders.filter(order => order.id !== action.payload);
            });
    },
});

export default scannedOrderSlice.reducer;