const socketIO = require("socket.io");
const jwt = require("jsonwebtoken");
const config = require("../config/config");
const User = require("../models/user.model");
const Emergency = require("../models/emergency.model");
const SOCKET_EVENTS = require("../constants/socket.events");

let io;

exports.initialize = (server) => {
  io = socketIO(server, {
    cors: {
      origin: "*", // In production, you'd restrict this to your frontend domain
      methods: ["GET", "POST"],
    },
  });

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication error: Token not provided"));
      }

      // Verify token
      const decoded = jwt.verify(token, config.jwtSecret);

      // Find user
      const user = await User.findById(decoded.id).select(
        "_id name availabilityStatus"
      );

      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      // Attach user to socket
      socket.user = user;
      next();
    } catch (error) {
      console.error("Socket authentication error:", error);
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.user.name} (${socket.id})`);

    // Join user's personal room for targeted messages
    socket.join(`user:${socket.user._id}`);

    // Update user's socketId and online status
    User.findByIdAndUpdate(socket.user._id, {
      $set: {
        socketId: socket.id,
        isOnline: true,
      },
    }).catch((err) => {
      console.error("Error updating user socket info:", err);
    });

    // Handle location updates
    socket.on(SOCKET_EVENTS.UPDATE_LOCATION, async (data) => {
      try {
        const { longitude, latitude } = data;

        if (!longitude || !latitude) {
          return;
        }

        await User.findByIdAndUpdate(socket.user._id, {
          $set: {
            "currentLocation.coordinates": [
              parseFloat(longitude),
              parseFloat(latitude),
            ],
            "currentLocation.lastUpdated": Date.now(),
          },
        });

        // Acknowledge receipt of location
        socket.emit(SOCKET_EVENTS.LOCATION_UPDATED);
      } catch (error) {
        console.error("Error updating location via socket:", error);
      }
    });

    // Handle availability status updates
    socket.on(SOCKET_EVENTS.UPDATE_AVAILABILITY, async (data) => {
      try {
        const { availabilityStatus } = data;

        if (availabilityStatus === undefined) {
          return;
        }

        await User.findByIdAndUpdate(socket.user._id, {
          $set: {
            availabilityStatus: Boolean(availabilityStatus),
          },
        });

        // Acknowledge receipt
        socket.emit(SOCKET_EVENTS.AVAILABILITY_UPDATED);
      } catch (error) {
        console.error("Error updating availability via socket:", error);
      }
    });

    // Handle emergency response status updates
    socket.on(SOCKET_EVENTS.UPDATE_RESPONSE_STATUS, async (data) => {
      try {
        const { emergencyId, status } = data;

        if (!emergencyId || !status) {
          return;
        }

        socket.broadcast
          .to(`emergency:${emergencyId}`)
          .emit(SOCKET_EVENTS.RESPONDER_STATUS_UPDATED, {
            responderId: socket.user._id,
            responderName: socket.user.name,
            status,
          });
      } catch (error) {
        console.error("Error updating response status via socket:", error);
      }
    });

    // Join emergency room when responding
    socket.on(SOCKET_EVENTS.JOIN_EMERGENCY, (emergencyId) => {
      socket.join(`emergency:${emergencyId}`);
      console.log(`User ${socket.user.name} joined emergency ${emergencyId}`);
    });

    // Leave emergency room
    socket.on(SOCKET_EVENTS.LEAVE_EMERGENCY, (emergencyId) => {
      socket.leave(`emergency:${emergencyId}`);
      console.log(`User ${socket.user.name} left emergency ${emergencyId}`);
    });
    
    // Handle SOS alerts
    socket.on(SOCKET_EVENTS.SEND_SOS_ALERT, async (data) => {
      try {
        const { location, timestamp } = data;
        
        if (!location || !location.longitude || !location.latitude) {
          console.error("Invalid location data for SOS alert");
          return;
        }
        
        console.log(`Received SOS alert from user: ${socket.user.name} at location: ${location.longitude}, ${location.latitude}`);
        
        // Create an emergency for the SOS alert
        const emergency = new Emergency({
          createdBy: socket.user._id,
          emergencyType: "sos",
          description: "SOS ALERT: User needs immediate assistance!",
          location: {
            coordinates: [parseFloat(location.longitude), parseFloat(location.latitude)],
            address: "Unknown location", // We could do reverse geocoding here if needed
          },
          status: "active",
        });
        
        await emergency.save();
        console.log("SOS emergency created with ID:", emergency._id);
        
        // Find nearby available users (within 5km)
        const nearbyUsers = await User.find({
          _id: { $ne: socket.user._id }, // Exclude the user who sent the SOS
          "currentLocation.coordinates": {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: [parseFloat(location.longitude), parseFloat(location.latitude)],
              },
              $maxDistance: 5000, // 5km in meters
            },
          },
        }).select("_id name");
        
        console.log(`Found ${nearbyUsers.length} nearby users for SOS alert`);
        
        // Create notifications for nearby users
        const notifications = nearbyUsers.map((user) => ({
          userId: user._id,
          emergencyId: emergency._id,
          type: "sos_alert",
          title: "URGENT SOS ALERT NEARBY",
          message: `${socket.user.name} has sent an SOS alert and needs immediate assistance!`,
        }));
        
        if (notifications.length > 0) {
          await Notification.insertMany(notifications);
          console.log(`Created ${notifications.length} notifications for SOS alert`);
        }
        
        // Emit socket event for nearby users
        nearbyUsers.forEach((user) => {
          io.to(`user:${user._id}`).emit(SOCKET_EVENTS.SOS_ALERT_RECEIVED, {
            emergency: {
              _id: emergency._id,
              emergencyType: "sos",
              description: "SOS ALERT: User needs immediate assistance!",
              location: emergency.location,
              createdAt: emergency.createdAt,
              createdBy: {
                _id: socket.user._id,
                name: socket.user.name
              }
            },
          });
        });
        
        // Broadcast to all active users in the area
        io.emit(SOCKET_EVENTS.EMERGENCY_CREATED, {
          emergencyId: emergency._id,
          emergencyType: "sos",
          location: emergency.location.coordinates,
        });
        
        // Also emit to the sender so they can see their own emergency
        socket.emit(SOCKET_EVENTS.NEW_EMERGENCY, {
          emergency: {
            _id: emergency._id,
            emergencyType: "sos",
            description: "SOS ALERT: User needs immediate assistance!",
            location: emergency.location,
            createdAt: emergency.createdAt,
            status: "active"
          },
        });
        
        console.log(`SOS alert processed, notified ${nearbyUsers.length} nearby users`);
      } catch (error) {
        console.error("Error processing SOS alert:", error);
      }
    });

    // Handle voice assistant audio
    socket.on(SOCKET_EVENTS.VOICE_ASSISTANT_AUDIO, async (data) => {
      try {
        const { audio, location } = data;
        
        if (!audio || !location) {
          return;
        }
        
        console.log(`Received voice audio from user: ${socket.user.name}`);
        
        // In a real implementation, you would send the audio to a speech-to-text service
        // For this example, we'll simulate processing with a timeout and predefined responses
        
        setTimeout(async () => {
          try {
            // Simulate speech-to-text processing
            const simulatedText = processAudioToText(audio);
            
            // Extract emergency type from text
            const emergencyInfo = extractEmergencyInfo(simulatedText);
            
            if (emergencyInfo.emergencyType) {
              // Create emergency report
              const emergency = new Emergency({
                createdBy: socket.user._id,
                emergencyType: emergencyInfo.emergencyType,
                description: simulatedText,
                location: {
                  coordinates: [parseFloat(location.longitude), parseFloat(location.latitude)],
                  address: location.address || "Unknown location",
                },
                status: "active",
              });
              
              await emergency.save();
              
              // Emit result back to user
              socket.emit(SOCKET_EVENTS.VOICE_ASSISTANT_RESULT, {
                success: true,
                emergencyId: emergency._id,
                message: `Emergency report created: ${emergencyInfo.emergencyType}`,
                text: simulatedText
              });
              
              // Find and notify nearby users (similar to createEmergency controller)
              // This would be implemented in a real application
              
            } else {
              // No emergency type detected
              socket.emit(SOCKET_EVENTS.VOICE_ASSISTANT_RESULT, {
                success: false,
                message: "Could not determine emergency type from audio",
                text: simulatedText
              });
            }
          } catch (error) {
            console.error("Error processing voice assistant audio:", error);
            socket.emit(SOCKET_EVENTS.VOICE_ASSISTANT_RESULT, {
              success: false,
              message: "Error processing audio",
              error: error.message
            });
          }
        }, 2000); // Simulate processing delay
        
      } catch (error) {
        console.error("Error handling voice assistant audio:", error);
      }
    });
    
    // Handle disconnection
    socket.on("disconnect", async () => {
      console.log(`User disconnected: ${socket.user.name} (${socket.id})`);

      // Update user's online status
      await User.findByIdAndUpdate(socket.user._id, {
        $set: {
          isOnline: false,
          lastOnline: Date.now(),
        },
      }).catch((err) => {
        console.error("Error updating user disconnect info:", err);
      });
    });
  });

  return io;
};

// Function to emit events
exports.emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

exports.emitToEmergency = (emergencyId, event, data) => {
  if (io) {
    io.to(`emergency:${emergencyId}`).emit(event, data);
  }
};

exports.emitToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

// Export the io instance
exports.getIO = () => {
  return io;
};

// Helper function to simulate processing audio to text
function processAudioToText(audioBase64) {
  // In a real implementation, this would call a speech-to-text API
  // For this example, we'll return a simulated response
  
  // Generate a random emergency scenario
  const scenarios = [
    "There's a fire in the building on the third floor. People are evacuating but some might be trapped.",
    "Medical emergency, someone collapsed in the lobby and needs immediate assistance. They're not responding.",
    "Security issue, there's an unauthorized person trying to access the restricted area.",
    "There's flooding in the basement due to a burst pipe. Water is rising quickly.",
    "Car accident at the intersection, multiple vehicles involved. People appear to be injured."
  ];
  
  return scenarios[Math.floor(Math.random() * scenarios.length)];
}

// Helper function to extract emergency type from text
function extractEmergencyInfo(text) {
  const emergencyTypes = {
    fire: ["fire", "burning", "smoke", "flames"],
    medical: ["medical", "collapsed", "injured", "heart attack", "breathing", "unconscious"],
    security: ["security", "threat", "suspicious", "unauthorized", "break-in"],
    natural_disaster: ["flood", "earthquake", "storm", "hurricane", "tornado", "tsunami"],
    other: ["accident", "emergency", "help", "danger"]
  };
  
  text = text.toLowerCase();
  
  // Check for each emergency type
  for (const [type, keywords] of Object.entries(emergencyTypes)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return { emergencyType: type };
      }
    }
  }
  
  // Default to "other" if no specific type is detected
  return { emergencyType: "other" };
}
