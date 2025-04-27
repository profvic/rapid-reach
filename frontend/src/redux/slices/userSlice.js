// src/redux/slices/userSlice.js
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
export const getCurrentUser = createAsyncThunk(
  "user/getCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/users/me`, getAuthHeader());
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch user profile"
      );
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  "user/updateUserProfile",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_URL}/users/me`,
        userData,
        getAuthHeader()
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update profile"
      );
    }
  }
);

export const updateUserLocation = createAsyncThunk(
  "user/updateUserLocation",
  async ({ longitude, latitude }, { rejectWithValue, dispatch }) => {
    try {
      // Validate coordinates
      if (isNaN(longitude) || isNaN(latitude) ||
          longitude < -180 || longitude > 180 ||
          latitude < -90 || latitude > 90) {
        return rejectWithValue("Invalid coordinates provided");
      }
      
      // Update local state immediately for better UX
      dispatch(setCurrentLocation([longitude, latitude]));
      
      // Then update on server
      const response = await axios.patch(
        `${API_URL}/users/me/location`,
        {
          longitude: parseFloat(longitude),
          latitude: parseFloat(latitude)
        },
        getAuthHeader()
      );
      
      return response.data.data;
    } catch (error) {
      console.error("Location update error:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to update location"
      );
    }
  }
);

export const updateAvailability = createAsyncThunk(
  "user/updateAvailability",
  async (availabilityStatus, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `${API_URL}/users/me/availability`,
        { availabilityStatus },
        getAuthHeader()
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update availability"
      );
    }
  }
);

const initialState = {
  profile: null,
  currentLocation: null,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    resetUserError: (state) => {
      state.error = null;
    },
    setCurrentLocation: (state, action) => {
      // Ensure coordinates are in the correct format [longitude, latitude]
      if (Array.isArray(action.payload) && action.payload.length === 2) {
        const [longitude, latitude] = action.payload;
        
        // Validate coordinates
        if (!isNaN(longitude) && !isNaN(latitude) &&
            longitude >= -180 && longitude <= 180 &&
            latitude >= -90 && latitude <= 90) {
          state.currentLocation = [parseFloat(longitude), parseFloat(latitude)];
          console.log(`Location set in Redux: [${longitude}, ${latitude}]`);
        } else {
          console.error("Invalid coordinates:", action.payload);
        }
      } else {
        console.error("Invalid location format:", action.payload);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Get current user
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
        if (action.payload.currentLocation) {
          state.currentLocation = action.payload.currentLocation.coordinates;
        }
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update user profile
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update user location
      .addCase(updateUserLocation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserLocation.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
        if (action.payload.currentLocation &&
            action.payload.currentLocation.coordinates &&
            action.payload.currentLocation.coordinates.length === 2) {
          state.currentLocation = action.payload.currentLocation.coordinates;
          console.log("Location updated from server response:", state.currentLocation);
        }
      })
      .addCase(updateUserLocation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.error("Location update rejected:", action.payload);
      })

      // Update availability
      .addCase(updateAvailability.fulfilled, (state, action) => {
        state.profile = action.payload;
      });
  },
});

export const { resetUserError, setCurrentLocation } = userSlice.actions;
export default userSlice.reducer;
