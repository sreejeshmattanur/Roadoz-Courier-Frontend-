import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { 
    fetchTripDriversApi, 
    fetchTripVehiclesApi, 
    fetchTripFranchisesApi, 
    fetchTripSheetsApi,
    createTripSheetApi,
    deleteTripSheetApi
} from "../services/apiCalls";
import { toast } from "react-hot-toast";

// Async Thunks
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

const tripSlice = createSlice({
    name: "trip",
    initialState: {
        drivers: [],
        vehicles: [],
        franchises: [],
        tripSheets: [],
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
            .addCase(getTripSheets.fulfilled, (state, action) => {
                state.tripSheets = action.payload.items;
                state.pagination = {
                    total: action.payload.total,
                    page: action.payload.page,
                    pages: action.payload.pages
                };
            });
    }
});

export default tripSlice.reducer;