    import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
    import { fetchNotificationsApi, markNotificationReadApi } from "../services/apiCalls";

    export const fetchNotifications = createAsyncThunk(
        "notifications/fetchAll",
        async (params, { rejectWithValue }) => {
            try {
                const response = await fetchNotificationsApi(params);
                return response; 
            } catch (err) {
                return rejectWithValue(err.response?.data?.message || err.message);
            }
        }
    );

    export const markNotificationAsRead = createAsyncThunk(
        "notifications/markRead",
        async (id, { rejectWithValue }) => {
            try {
                await markNotificationReadApi(id);
                return id;
            } catch (err) {
                return rejectWithValue(err.message);
            }
        }
    );

    const notificationSlice = createSlice({
        name: "notifications",
        initialState: {
            items: [],
            unreadCount: 0,
            loading: false,
        },
        reducers: {
            addNotification: (state, action) => {
                const exists = state.items.find(n => n.id === action.payload.id);
                if (!exists) {
                    state.items.unshift(action.payload);
                    if (!action.payload.is_read) {
                        state.unreadCount += 1;
                    }
                }
            },
        },
        extraReducers: (builder) => {
            builder
                .addCase(fetchNotifications.fulfilled, (state, action) => {
                    state.items = action.payload.items || [];
                    state.unreadCount = action.payload.unread_count || 0;
                })
                .addCase(markNotificationAsRead.fulfilled, (state, action) => {
                    const item = state.items.find(n => n.id === action.payload);
                    if (item && !item.is_read) {
                        item.is_read = true;
                        state.unreadCount = Math.max(0, state.unreadCount - 1);
                    }
                });
        }
    });

    export const { addNotification } = notificationSlice.actions;
    export default notificationSlice.reducer;