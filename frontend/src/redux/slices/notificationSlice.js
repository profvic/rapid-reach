// src/redux/slices/notificationSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = "http://localhost:3000/api";

// Helper to set auth header
const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// Async thunks
export const getNotifications = createAsyncThunk(
  "notification/getNotifications",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_URL}/notifications`,
        getAuthHeader()
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch notifications"
      );
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  "notification/markNotificationAsRead",
  async (notificationId, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `${API_URL}/notifications/${notificationId}/read`,
        {},
        getAuthHeader()
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to mark notification as read"
      );
    }
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  "notification/markAllNotificationsAsRead",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `${API_URL}/notifications/read-all`,
        {},
        getAuthHeader()
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to mark all notifications as read"
      );
    }
  }
);

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
};

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    resetNotificationError: (state) => {
      state.error = null;
    },
    addNotification: (state, action) => {
      // For socket.io real-time notifications
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get notifications
      .addCase(getNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload;
        state.unreadCount = action.payload.filter(
          (notification) => notification.status !== "read"
        ).length;
      })
      .addCase(getNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Mark notification as read
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const index = state.notifications.findIndex(
          (n) => n._id === action.payload._id
        );

        if (index !== -1) {
          state.notifications[index] = action.payload;
          if (state.unreadCount > 0) state.unreadCount -= 1;
        }
      })

      // Mark all notifications as read
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.notifications = state.notifications.map((notification) => ({
          ...notification,
          status: "read",
          readAt: new Date().toISOString(),
        }));
        state.unreadCount = 0;
      });
  },
});

export const { resetNotificationError, addNotification } =
  notificationSlice.actions;
export default notificationSlice.reducer;
