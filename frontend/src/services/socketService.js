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
  
  // SOS events
  SEND_SOS_ALERT: "send_sos_alert",
  SOS_ALERT_RECEIVED: "sos_alert_received",

  // Response events
  JOIN_EMERGENCY: "join_emergency",
  LEAVE_EMERGENCY: "leave_emergency",
  RESPONDER_ADDED: "responder_added",
  RESPONDER_UPDATED: "responder_updated",
  UPDATE_RESPONSE_STATUS: "update_response_status",
  RESPONDER_STATUS_UPDATED: "responder_status_updated",

  // Notification events
  NEW_NOTIFICATION: "new_notification",
  
  // Voice Assistant events
  VOICE_ASSISTANT_AUDIO: "voice_assistant_audio",
  VOICE_ASSISTANT_RESULT: "voice_assistant_result",
};

// Initialize socket connection
export const initializeSocket = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    console.warn("[SOCKET] Cannot initialize socket: No authentication token found");
    return null;
  }

  console.log("[SOCKET] Initializing socket connection...");

  // Close existing connection if exists
  if (socket) {
    console.log("[SOCKET] Closing existing connection");
    socket.disconnect();
  }

  try {
    // Create new connection
    socket = io("http://localhost:3000", {
      auth: {
        token,
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    // Connection events
    socket.on(SOCKET_EVENTS.CONNECT, () => {
      console.log("[SOCKET] Connected successfully with ID:", socket.id);
    });

    socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
      console.log("[SOCKET] Disconnected. Reason:", reason);
    });

    socket.on("connect_error", (error) => {
      console.error("[SOCKET] Connection error:", error.message);
    });

    socket.on("reconnect_attempt", (attemptNumber) => {
      console.log("[SOCKET] Reconnection attempt:", attemptNumber);
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log("[SOCKET] Reconnected after", attemptNumber, "attempts");
    });

    socket.on("reconnect_error", (error) => {
      console.error("[SOCKET] Reconnection error:", error.message);
    });

    socket.on("reconnect_failed", () => {
      console.error("[SOCKET] Failed to reconnect after maximum attempts");
    });

    socket.on("error", (error) => {
      console.error("[SOCKET] General error:", error);
    });

    // Add a timeout to check if connection was successful
    const connectionTimeout = setTimeout(() => {
      if (!socket.connected) {
        console.error("[SOCKET] Connection timeout - socket not connected after 5 seconds");
      }
    }, 5000);

    // Clear timeout when connected
    socket.on(SOCKET_EVENTS.CONNECT, () => {
      clearTimeout(connectionTimeout);
    });
    
    // Listen for new emergencies
    socket.on(SOCKET_EVENTS.NEW_EMERGENCY, (data) => {
      console.log("[SOCKET] New emergency received:", data);

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
    
    // Listen for SOS alerts
    socket.on(SOCKET_EVENTS.SOS_ALERT_RECEIVED, (data) => {
      console.log("[SOCKET] SOS alert received:", data);

      // Add notification with high priority
      store.dispatch(
        addNotification({
          _id: Date.now().toString(), // Temporary ID
          type: "sos_alert",
          title: "URGENT SOS ALERT",
          message: `${data.emergency.createdBy.name} has sent an SOS alert and needs immediate assistance!`,
          status: "sent",
          priority: "high",
          createdAt: new Date().toISOString(),
          emergencyId: data.emergency._id,
        })
      );
      
      // Play alert sound
      try {
        const alertSound = new Audio('/alert-sound.mp3');
        alertSound.volume = 1.0;
        
        // Add error handling for the case where the sound file doesn't exist
        alertSound.addEventListener('error', (e) => {
          console.warn("[SOCKET] Alert sound file not found or cannot be played:", e);
          // Fallback to browser's native alert if sound can't be played
          if (window.Notification && Notification.permission === "granted") {
            new Notification("URGENT SOS ALERT", {
              body: `${data.emergency.createdBy.name} has sent an SOS alert and needs immediate assistance!`,
              icon: "/vite.svg" // Use any available icon as fallback
            });
          }
        });
        
        alertSound.play().catch(e => {
          console.error("[SOCKET] Error playing alert sound:", e);
          // Fallback to browser notification
          if (window.Notification && Notification.permission === "granted") {
            new Notification("URGENT SOS ALERT", {
              body: `${data.emergency.createdBy.name} has sent an SOS alert and needs immediate assistance!`,
              icon: "/vite.svg" // Use any available icon as fallback
            });
          }
        });
      } catch (error) {
        console.error("[SOCKET] Error setting up alert sound:", error);
      }
    });

    // Listen for emergency updates
    socket.on(SOCKET_EVENTS.EMERGENCY_STATUS_UPDATED, (data) => {
      console.log("[SOCKET] Emergency status updated:", data);

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
      console.log("[SOCKET] Responder updated:", data);
      
      // Get current state
      const state = store.getState();
      const currentEmergency = state.emergency.currentEmergency;
      
      // If this is the emergency we're currently viewing, update it
      if (currentEmergency && currentEmergency._id === data.emergencyId) {
        // Fetch the updated emergency details to get the full responder information
        store.dispatch(updateEmergencyInRealtime({
          _id: data.emergencyId,
          responderUpdated: true,
          responder: data.responder
        }));
      }
    });
    
    // Listen for responder added
    socket.on(SOCKET_EVENTS.RESPONDER_ADDED, (data) => {
      console.log("[SOCKET] Responder added:", data);
      
      // Get current state
      const state = store.getState();
      const currentEmergency = state.emergency.currentEmergency;
      
      // If this is the emergency we're currently viewing, update it
      if (currentEmergency && currentEmergency._id === data.emergencyId) {
        // Fetch the updated emergency details to get the full responder information
        store.dispatch(updateEmergencyInRealtime({
          _id: data.emergencyId,
          responderAdded: true,
          responder: data.responder
        }));
      }
    });

    return socket;
  } catch (error) {
    console.error("[SOCKET] Error creating socket:", error);
    return null;
  }
};

// Disconnect socket
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log("[SOCKET] Socket disconnected manually");
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

// Send voice assistant audio
export const sendVoiceAssistantAudio = (audioBlob, location) => {
  console.log("[SOCKET] Preparing to send audio data...");
  
  if (!socket) {
    console.error("[SOCKET] Cannot send audio: Socket not initialized");
    return false;
  }
  
  if (!socket.connected) {
    console.error("[SOCKET] Cannot send audio: Socket not connected");
    return false;
  }
  
  try {
    // Convert blob to base64 for transmission
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    
    reader.onloadend = () => {
      try {
        console.log("[SOCKET] Audio converted to base64, size:", Math.round(reader.result.length / 1024), "KB");
        const base64data = reader.result.split(',')[1];
        
        // For debugging, create a mock response if server is not available
        if (window.location.hostname === 'localhost' && !socket.connected) {
          console.log("[SOCKET] DEV MODE: Creating mock response");
          setTimeout(() => {
            if (window.socket) {
              window.socket.emit('voice_assistant_result', {
                success: true,
                text: "This is a mock response for testing. Fire emergency detected at your location.",
                emergencyId: "mock-emergency-123",
                message: "Fire emergency detected"
              });
            }
          }, 2000);
          return true;
        }
        
        console.log("[SOCKET] Emitting audio data to server...");
        socket.emit(SOCKET_EVENTS.VOICE_ASSISTANT_AUDIO, {
          audio: base64data,
          location
        });
        
        console.log("[SOCKET] Audio data sent successfully");
        return true;
      } catch (error) {
        console.error("[SOCKET] Error sending audio data:", error);
        return false;
      }
    };
    
    reader.onerror = (error) => {
      console.error("[SOCKET] Error reading audio file:", error);
      return false;
    };
    
    return true;
  } catch (error) {
    console.error("[SOCKET] Error in sendVoiceAssistantAudio:", error);
    return false;
  }
};

// Create a mock socket for testing
export const createMockSocket = () => {
  console.log("[SOCKET] Creating mock socket for testing");
  
  const mockSocket = {
    id: "mock-socket-id",
    connected: true,
    on: (event, callback) => {
      console.log("[MOCK SOCKET] Added listener for event:", event);
      if (event === 'voice_assistant_result') {
        // Store the callback to call it later
        mockSocket._callbacks = mockSocket._callbacks || {};
        mockSocket._callbacks[event] = callback;
      }
    },
    off: (event) => {
      console.log("[MOCK SOCKET] Removed listener for event:", event);
      if (mockSocket._callbacks && mockSocket._callbacks[event]) {
        delete mockSocket._callbacks[event];
      }
    },
    emit: (event) => {
      console.log("[MOCK SOCKET] Emitted event:", event);
      
      // If this is a voice assistant audio event, create a mock response
      if (event === SOCKET_EVENTS.VOICE_ASSISTANT_AUDIO) {
        setTimeout(() => {
          if (mockSocket._callbacks && mockSocket._callbacks['voice_assistant_result']) {
            console.log("[MOCK SOCKET] Creating mock response");
            mockSocket._callbacks['voice_assistant_result']({
              success: true,
              text: "This is a mock response for testing. Fire emergency detected at your location.",
              emergencyId: "mock-emergency-123",
              message: "Fire emergency detected"
            });
          }
        }, 2000);
      }
    },
    disconnect: () => {
      console.log("[MOCK SOCKET] Disconnected");
      mockSocket.connected = false;
    }
  };
  
  return mockSocket;
};

// Send SOS alert
export const sendSOSAlert = (location) => {
  console.log("[SOCKET] Sending SOS alert with location:", location);
  
  if (!socket) {
    console.error("[SOCKET] Cannot send SOS alert: Socket not initialized");
    return false;
  }
  
  if (!socket.connected) {
    console.error("[SOCKET] Cannot send SOS alert: Socket not connected");
    return false;
  }
  
  try {
    socket.emit(SOCKET_EVENTS.SEND_SOS_ALERT, {
      location,
      timestamp: new Date().toISOString()
    });
    
    console.log("[SOCKET] SOS alert sent successfully");
    return true;
  } catch (error) {
    console.error("[SOCKET] Error sending SOS alert:", error);
    return false;
  }
};
