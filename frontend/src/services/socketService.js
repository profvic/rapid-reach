// src/services/socketService.js
import { io } from "socket.io-client";
import store from "../redux/store";
import { updateEmergencyInRealtime } from "../redux/slices/emergencySlice";
import { addNotification } from "../redux/slices/notificationSlice";

// Socket.io client instance
let socket = null;

const SOCKET_EVENTS = {
  // Connection events
  CONNECT: "connect",
  DISCONNECT: "disconnect",

  // Location events
  UPDATE_LOCATION: "update_location",
  LOCATION_UPDATED: "location_updated",

  // Availability events
  UPDATE_AVAILABILITY: "update_availability",
  AVAILABILITY_UPDATED: "availability_updated",

  // Emergency events
  NEW_EMERGENCY: "new_emergency",
  EMERGENCY_CREATED: "emergency_created",
  EMERGENCY_STATUS_UPDATED: "emergency_status_updated",
  EMERGENCY_RESOLVED: "emergency_resolved",

  // Response events
  JOIN_EMERGENCY: "join_emergency",
  LEAVE_EMERGENCY: "leave_emergency",
  RESPONDER_ADDED: "responder_added",
  RESPONDER_UPDATED: "responder_updated",
  UPDATE_RESPONSE_STATUS: "update_response_status",
  RESPONDER_STATUS_UPDATED: "responder_status_updated",

  // Notification events
  NEW_NOTIFICATION: "new_notification",
};

// Initialize socket connection
export const initializeSocket = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    console.warn("Cannot initialize socket: No authentication token found");
    return;
  }

  // Close existing connection if exists
  if (socket) {
    socket.disconnect();
  }

  // Create new connection
  socket = io("http://localhost:3000", {
    auth: {
      token,
    },
  });

  // Connection events
  socket.on(SOCKET_EVENTS.CONNECT, () => {
    console.log("Socket connected", socket.id);
  });

  socket.on(SOCKET_EVENTS.DISCONNECT, () => {
    console.log("Socket disconnected");
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
  });

  // Listen for new emergencies
  socket.on(SOCKET_EVENTS.NEW_EMERGENCY, (data) => {
    console.log("New emergency received:", data);

    // Add notification
    store.dispatch(
      addNotification({
        _id: Date.now().toString(), // Temporary ID
        type: "emergency_alert",
        title: `${data.emergency.emergencyType.toUpperCase()} EMERGENCY NEARBY`,
        message: data.emergency.description,
        status: "sent",
        createdAt: new Date().toISOString(),
        emergencyId: data.emergency._id,
      })
    );
  });

  // Listen for emergency updates
  socket.on(SOCKET_EVENTS.EMERGENCY_STATUS_UPDATED, (data) => {
    console.log("Emergency status updated:", data);

    // Update emergency in store
    store.dispatch(
      updateEmergencyInRealtime({
        _id: data.emergencyId,
        status: data.status,
      })
    );
  });

  // Listen for responder updates
  socket.on(SOCKET_EVENTS.RESPONDER_UPDATED, (data) => {
    console.log("Responder updated:", data);

    // Update emergency in store if needed
  });

  return socket;
};

// Disconnect socket
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log("Socket disconnected manually");
  }
};

// Update location
export const updateLocation = (longitude, latitude) => {
  if (socket && socket.connected) {
    socket.emit(SOCKET_EVENTS.UPDATE_LOCATION, { longitude, latitude });
  }
};

// Update availability
export const updateAvailability = (availabilityStatus) => {
  if (socket && socket.connected) {
    socket.emit(SOCKET_EVENTS.UPDATE_AVAILABILITY, { availabilityStatus });
  }
};

// Join emergency
export const joinEmergency = (emergencyId) => {
  if (socket && socket.connected) {
    socket.emit(SOCKET_EVENTS.JOIN_EMERGENCY, emergencyId);
  }
};

// Leave emergency
export const leaveEmergency = (emergencyId) => {
  if (socket && socket.connected) {
    socket.emit(SOCKET_EVENTS.LEAVE_EMERGENCY, emergencyId);
  }
};

// Update response status
export const updateResponseStatus = (emergencyId, status) => {
  if (socket && socket.connected) {
    socket.emit(SOCKET_EVENTS.UPDATE_RESPONSE_STATUS, { emergencyId, status });
  }
};
