import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchConversationsApi, fetchMessagesApi, sendMessageApi } from "../services/apiCalls";

export const getConversations = createAsyncThunk("chat/getConversations", async (_, { rejectWithValue }) => {
  try {
    const response = await fetchConversationsApi();
    return response.conversations; 
  } catch (err) {
    return rejectWithValue(err.response?.data || "Failed to fetch");
  }
});

export const getMessages = createAsyncThunk("chat/getMessages", async ({ id, type }, { rejectWithValue }) => {
  try {
    const response = await fetchMessagesApi(id, type);
    return response.messages;
  } catch (err) {
    return rejectWithValue(err.response?.data || "Failed to fetch messages");
  }
});

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    conversations: [],
    activeMessages: [],
    loading: false,
    fetchingMessages: false,
    error: null,
  },
  reducers: {
    clearMessages: (state) => {
      state.activeMessages = [];
    },
    // New Reducer for WebSocket updates
    receiveSocketMessage: (state, action) => {
      const newMessage = action.payload;
      // Add message to active chat window if it belongs there
      state.activeMessages.push(newMessage);
      
      // Update the conversation list snippet
      const conversation = state.conversations.find(c => c.user_id === newMessage.sender_id || c.user_id === newMessage.receiver_id);
      if (conversation) {
        conversation.last_message = newMessage.message;
        conversation.last_message_at = new Date().toISOString();
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getConversations.fulfilled, (state, action) => {
        state.conversations = action.payload;
      })
      .addCase(getMessages.pending, (state) => {
        state.fetchingMessages = true;
      })
      .addCase(getMessages.fulfilled, (state, action) => {
        state.fetchingMessages = false;
        state.activeMessages = action.payload;
      });
  },
});

export const { clearMessages, receiveSocketMessage } = chatSlice.actions;
export default chatSlice.reducer;