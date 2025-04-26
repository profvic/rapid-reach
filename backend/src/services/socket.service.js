const socketIO = require("socket.io");
const jwt = require("jsonwebtoken");
const config = require("../config/config");
const User = require("../models/user.model");
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
