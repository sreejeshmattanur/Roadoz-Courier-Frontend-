import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { 
    fetchTripDriversApi, 
    fetchTripVehiclesApi, 
    fetchTripFranchisesApi, 
    fetchTripSheetsApi,
    deleteTripSheetApi
} from "../services/apiCalls";

export const getTripMasters = createAsyncThunk("trip/getMasters", async () => {
    const [drivers, vehicles, franchises] = await Promise.all([
        fetchTripDriversApi(),
        fetchTripVehiclesApi(),
        fetchTripFranchisesApi()
    ]);
    return { drivers, vehicles, franchises };
});

export const getTripSheets = createAsyncThunk("trip/getTripSheets", async (params) => {
    return await fetchTripSheetsApi(params);
});

export const removeTripSheet = createAsyncThunk("trip/remove", async (id, { rejectWithValue }) => {
    try {
        await deleteTripSheetApi(id);
        return id;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || "Failed to delete");
    }
});

const tripSlice = createSlice({
    name: "trip",
    initialState: {
        drivers: [],
        vehicles: [],
        franchises: [],
        items: [], // Changed from tripSheets to items to match Registry
        pagination: { total: 0, page: 1, pages: 1 },
        loading: false,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(getTripMasters.pending, (state) => { state.loading = true; })
            .addCase(getTripMasters.fulfilled, (state, action) => {
                state.drivers = action.payload.drivers;
                state.vehicles = action.payload.vehicles;
                state.franchises = action.payload.franchises;
                state.loading = false;
            })
            .addCase(getTripSheets.pending, (state) => { state.loading = true; })
            .addCase(getTripSheets.fulfilled, (state, action) => {
                state.items = action.payload.items || [];
                state.pagination = {
                    total: action.payload.total,
                    page: action.payload.page,
                    pages: action.payload.pages
                };
                state.loading = false;
            })
            .addCase(removeTripSheet.fulfilled, (state, action) => {
                state.items = state.items.filter(item => item.id !== action.payload);
            });
    }
});

export default tripSlice.reducer;