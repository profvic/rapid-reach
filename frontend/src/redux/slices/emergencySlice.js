// src/redux/slices/emergencySlice.js
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
export const createEmergency = createAsyncThunk(
  "emergency/createEmergency",
  async (
    { emergencyType, description, longitude, latitude },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post(
        `${API_URL}/emergencies`,
        { emergencyType, description, longitude, latitude },
        getAuthHeader()
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create emergency"
      );
    }
  }
);

export const getNearbyEmergencies = createAsyncThunk(
  "emergency/getNearbyEmergencies",
  async ({ longitude, latitude, maxDistance = 5000 }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_URL}/emergencies/nearby?longitude=${longitude}&latitude=${latitude}&maxDistance=${maxDistance}`,
        getAuthHeader()
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch nearby emergencies"
      );
    }
  }
);

export const getEmergencyDetails = createAsyncThunk(
  "emergency/getEmergencyDetails",
  async (emergencyId, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_URL}/emergencies/${emergencyId}`,
        getAuthHeader()
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch emergency details"
      );
    }
  }
);

export const respondToEmergency = createAsyncThunk(
  "emergency/respondToEmergency",
  async (emergencyId, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL}/emergencies/${emergencyId}/respond`,
        {},
        getAuthHeader()
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to respond to emergency"
      );
    }
  }
);

export const updateEmergencyStatus = createAsyncThunk(
  "emergency/updateEmergencyStatus",
  async ({ emergencyId, status }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `${API_URL}/emergencies/${emergencyId}/status`,
        { status },
        getAuthHeader()
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update emergency status"
      );
    }
  }
);

const initialState = {
  emergencies: [],
  currentEmergency: null,
  loading: false,
  error: null,
};

const emergencySlice = createSlice({
  name: "emergency",
  initialState,
  reducers: {
    resetEmergencyError: (state) => {
      state.error = null;
    },
    updateEmergencyInRealtime: (state, action) => {
      // For socket.io updates
      const updatedEmergency = action.payload;

      // Update in emergencies list
      const index = state.emergencies.findIndex(
        (e) => e._id === updatedEmergency._id
      );
      if (index !== -1) {
        state.emergencies[index] = updatedEmergency;
      }

      // Update current emergency if it's the one being viewed
      if (state.currentEmergency?._id === updatedEmergency._id) {
        state.currentEmergency = updatedEmergency;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Create emergency
      .addCase(createEmergency.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createEmergency.fulfilled, (state, action) => {
        state.loading = false;
        state.emergencies.unshift(action.payload.emergency);
        state.currentEmergency = action.payload.emergency;
      })
      .addCase(createEmergency.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get nearby emergencies
      .addCase(getNearbyEmergencies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getNearbyEmergencies.fulfilled, (state, action) => {
        state.loading = false;
        state.emergencies = action.payload;
      })
      .addCase(getNearbyEmergencies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get emergency details
      .addCase(getEmergencyDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getEmergencyDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.currentEmergency = action.payload;
      })
      .addCase(getEmergencyDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Respond to emergency
      .addCase(respondToEmergency.fulfilled, (state, action) => {
        state.currentEmergency = action.payload.emergency;

        // Update in emergencies list
        const index = state.emergencies.findIndex(
          (e) => e._id === action.payload.emergency._id
        );
        if (index !== -1) {
          state.emergencies[index] = action.payload.emergency;
        }
      })

      // Update emergency status
      .addCase(updateEmergencyStatus.fulfilled, (state, action) => {
        state.currentEmergency = action.payload.emergency;

        // Update in emergencies list
        const index = state.emergencies.findIndex(
          (e) => e._id === action.payload.emergency._id
        );
        if (index !== -1) {
          state.emergencies[index] = action.payload.emergency;
        }
      });
  },
});

export const { resetEmergencyError, updateEmergencyInRealtime } =
  emergencySlice.actions;
export default emergencySlice.reducer;
