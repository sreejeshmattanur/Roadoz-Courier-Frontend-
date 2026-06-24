import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchConversationsApi, fetchMessagesApi, sendMessageApi } from "../services/apiCalls";

export const getConversations = createAsyncThunk("chat/getConversations", async (_, { rejectWithValue }) => {
  try {
    return await fetchConversationsApi();
  } catch (err) {
    return rejectWithValue(err.response.data);
  }
});

export const getMessages = createAsyncThunk("chat/getMessages", async ({ id, type }, { rejectWithValue }) => {
  try {
    return await fetchMessagesApi(id, type);
  } catch (err) {
    return rejectWithValue(err.response.data);
  }
});

export const sendMessage = createAsyncThunk("chat/sendMessage", async (payload, { rejectWithValue }) => {
  try {
    return await sendMessageApi(payload);
  } catch (err) {
    return rejectWithValue(err.response.data);
  }
});

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    conversations: [],
    activeMessages: [],
    loading: false,
    sending: false,
    error: null,
  },
  reducers: {
    clearActiveMessages: (state) => {
      state.activeMessages = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Conversations
      .addCase(getConversations.fulfilled, (state, action) => {
        state.conversations = action.payload.conversations;
      })
      // Fetch Messages
      .addCase(getMessages.pending, (state) => {
        state.loading = true;
      })
      .addCase(getMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.activeMessages = action.payload.messages;
      })
      // Send Message (Optimistic update or handled via re-fetch)
      .addCase(sendMessage.pending, (state) => {
        state.sending = true;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.sending = false;
        // The API returns the new message object
        state.activeMessages.push(action.payload.message || action.payload); 
      });
  },
});

export const { clearActiveMessages } = chatSlice.actions;
export default chatSlice.reducer;