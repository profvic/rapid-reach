const Emergency = require("../models/emergency.model");
const User = require("../models/user.model");
const Notification = require("../models/notification.model");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const mongoose = require("mongoose");
const axios = require("axios");
const config = require("../config/config");
const socketService = require("../services/socket.service");
const SOCKET_EVENTS = require("../constants/socket.events");

// Create a new emergency
exports.createEmergency = async (req, res) => {
  try {
    const { emergencyType, description, longitude, latitude } = req.body;
    const userId = req.userId; // From auth middleware

    if (!emergencyType || !description || !longitude || !latitude) {
      return errorResponse(res, "Missing required fields", 400);
    }

    // Get address from coordinates using Mapbox
    let address = "Unknown location";
    try {
      const mapboxResponse = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json`,
        {
          params: {
            access_token: config.mapbox.accessToken,
            limit: 1,
          },
        }
      );

      if (
        mapboxResponse.data &&
        mapboxResponse.data.features &&
        mapboxResponse.data.features.length > 0
      ) {
        address = mapboxResponse.data.features[0].place_name;
      }
    } catch (error) {
      console.error("Error in reverse geocoding:", error);
      // Continue with unknown address
    }

    // Create new emergency
    const emergency = new Emergency({
      createdBy: userId,
      emergencyType,
      description,
      location: {
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
        address,
      },
      status: "active",
    });

    await emergency.save();

    // Find nearby available users (within 5km)
    const nearbyUsers = await User.find({
      _id: { $ne: userId }, // Exclude the user who created the emergency
      availabilityStatus: true,
      "currentLocation.lastUpdated": {
        $gte: new Date(Date.now() - 30 * 60 * 1000), // Active in last 30 minutes
      },
      "currentLocation.coordinates": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: 5000, // 5km in meters
        },
      },
    }).select("_id name");

    // Create notifications for nearby users (in real-world, this would go to a queue)
    const notifications = nearbyUsers.map((user) => ({
      userId: user._id,
      emergencyId: emergency._id,
      type: "emergency_alert",
      title: `${emergencyType.toUpperCase()} EMERGENCY NEARBY`,
      message: `Someone needs help with a ${emergencyType} emergency about ${address}. Can you respond?`,
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    // Emit socket event for nearby users
    nearbyUsers.forEach((user) => {
      socketService.emitToUser(user._id, SOCKET_EVENTS.NEW_EMERGENCY, {
        emergency: {
          _id: emergency._id,
          emergencyType: emergency.emergencyType,
          description: emergency.description,
          location: emergency.location,
          createdAt: emergency.createdAt,
        },
      });
    });

    // Broadcast to all active users in the area
    socketService.emitToAll(SOCKET_EVENTS.EMERGENCY_CREATED, {
      emergencyId: emergency._id,
      emergencyType: emergency.emergencyType,
      location: emergency.location.coordinates,
    });

    return successResponse(
      res,
      {
        emergency,
        notifiedUsers: nearbyUsers.length,
      },
      "Emergency created and nearby users notified",
      201
    );
  } catch (error) {
    console.error("Error creating emergency:", error);
    return errorResponse(res, "Failed to create emergency", 500, error);
  }
};

// Get all active emergencies
exports.getActiveEmergencies = async (req, res) => {
  try {
    const emergencies = await Emergency.find({
      status: { $in: ["active", "responding"] },
    })
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    return successResponse(
      res,
      emergencies,
      "Active emergencies retrieved successfully"
    );
  } catch (error) {
    console.error("Error retrieving active emergencies:", error);
    return errorResponse(
      res,
      "Failed to retrieve active emergencies",
      500,
      error
    );
  }
};

// Get nearby emergencies
exports.getNearbyEmergencies = async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 5000 } = req.query; // Distance in meters

    if (!longitude || !latitude) {
      return errorResponse(res, "Longitude and latitude are required", 400);
    }

    const emergencies = await Emergency.find({
      status: { $in: ["active", "responding"] },
      "location.coordinates": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: parseInt(maxDistance),
        },
      },
    })
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    return successResponse(
      res,
      emergencies,
      "Nearby emergencies retrieved successfully"
    );
  } catch (error) {
    console.error("Error retrieving nearby emergencies:", error);
    return errorResponse(
      res,
      "Failed to retrieve nearby emergencies",
      500,
      error
    );
  }
};

// Get emergency details
exports.getEmergency = async (req, res) => {
  try {
    const { emergencyId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(emergencyId)) {
      return errorResponse(res, "Invalid emergency ID", 400);
    }

    const emergency = await Emergency.findById(emergencyId)
      .populate("createdBy", "name")
      .populate("responders.userId", "name phone currentLocation");

    if (!emergency) {
      return errorResponse(res, "Emergency not found", 404);
    }

    return successResponse(
      res,
      emergency,
      "Emergency details retrieved successfully"
    );
  } catch (error) {
    console.error("Error retrieving emergency details:", error);
    return errorResponse(
      res,
      "Failed to retrieve emergency details",
      500,
      error
    );
  }
};

// Respond to an emergency
exports.respondToEmergency = async (req, res) => {
  try {
    const { emergencyId } = req.params;
    const userId = req.userId;

    if (!mongoose.Types.ObjectId.isValid(emergencyId)) {
      return errorResponse(res, "Invalid emergency ID", 400);
    }

    // Find the emergency
    const emergency = await Emergency.findById(emergencyId);

    if (!emergency) {
      return errorResponse(res, "Emergency not found", 404);
    }

    if (emergency.status === "resolved" || emergency.status === "cancelled") {
      return errorResponse(
        res,
        "This emergency has already been resolved or cancelled",
        400
      );
    }

    // Check if user is already a responder
    const existingResponder = emergency.responders.find(
      (responder) => responder.userId.toString() === userId
    );

    if (existingResponder) {
      // Update responder status if already responding
      if (existingResponder.status === "notified") {
        existingResponder.status = "en_route";
        existingResponder.respondedAt = Date.now();
      } else if (existingResponder.status === "en_route") {
        existingResponder.status = "on_scene";
        existingResponder.arrivedAt = Date.now();
      } else if (existingResponder.status === "on_scene") {
        existingResponder.status = "completed";
        existingResponder.completedAt = Date.now();
      }
    } else {
      // Add user as a new responder
      emergency.responders.push({
        userId,
        status: "en_route",
        notifiedAt: Date.now(),
        respondedAt: Date.now(),
      });
    }

    // Update emergency status if needed
    if (emergency.status === "active" && emergency.responders.length > 0) {
      emergency.status = "responding";
    }

    // Calculate ETA for responder
    if (
      existingResponder?.status === "en_route" ||
      (!existingResponder && emergency.status === "responding")
    ) {
      try {
        // Get user's current location
        const user = await User.findById(userId).select("currentLocation");
        const emergencyLocation = emergency.location.coordinates;

        if (user && user.currentLocation && user.currentLocation.coordinates) {
          const userLocation = user.currentLocation.coordinates;

          // Call Mapbox API for directions
          const mapboxResponse = await axios.get(
            `https://api.mapbox.com/directions/v5/mapbox/driving/${userLocation[0]},${userLocation[1]};${emergencyLocation[0]},${emergencyLocation[1]}`,
            {
              params: {
                access_token: config.mapbox.accessToken,
                overview: "simplified",
              },
            }
          );

          if (
            mapboxResponse.data &&
            mapboxResponse.data.routes &&
            mapboxResponse.data.routes.length > 0
          ) {
            const route = mapboxResponse.data.routes[0];
            const etaSeconds = route.duration;
            const etaTimestamp = new Date(Date.now() + etaSeconds * 1000);

            // Add ETA to responder info
            const responderIndex = emergency.responders.findIndex(
              (r) => r.userId.toString() === userId
            );
            if (responderIndex !== -1) {
              emergency.responders[responderIndex].eta = {
                seconds: etaSeconds,
                timestamp: etaTimestamp,
              };
            }
          }
        }
      } catch (error) {
        console.error("Error calculating ETA:", error);
        // Continue without ETA
      }
    }

    await emergency.save();

    // Create notification for the emergency creator
    await Notification.create({
      userId: emergency.createdBy,
      emergencyId: emergency._id,
      type: "response_update",
      title: "Someone is responding to your emergency",
      message: "A responder is on the way to help you.",
    });

    // Emit socket event to the emergency creator
    socketService.emitToUser(
      emergency.createdBy,
      SOCKET_EVENTS.RESPONDER_ADDED,
      {
        emergencyId: emergency._id,
        responder: {
          _id: userId,
          status: existingResponder ? existingResponder.status : "en_route",
        },
      }
    );

    // Emit to all users in the emergency room
    socketService.emitToEmergency(
      emergencyId,
      SOCKET_EVENTS.RESPONDER_UPDATED,
      {
        emergencyId: emergency._id,
        responder: {
          _id: userId,
          status: existingResponder ? existingResponder.status : "en_route",
        },
      }
    );

    return successResponse(
      res,
      { emergency },
      "Response recorded successfully"
    );
  } catch (error) {
    console.error("Error responding to emergency:", error);
    return errorResponse(res, "Failed to respond to emergency", 500, error);
  }
};

// Update emergency status
exports.updateEmergencyStatus = async (req, res) => {
  try {
    const { emergencyId } = req.params;
    const { status } = req.body;
    const userId = req.userId;

    if (!mongoose.Types.ObjectId.isValid(emergencyId)) {
      return errorResponse(res, "Invalid emergency ID", 400);
    }

    if (
      !status ||
      !["active", "responding", "resolved", "cancelled"].includes(status)
    ) {
      return errorResponse(res, "Invalid status", 400);
    }

    // Find the emergency
    const emergency = await Emergency.findById(emergencyId);

    if (!emergency) {
      return errorResponse(res, "Emergency not found", 404);
    }

    // Only allow the creator or an active responder to update status
    const isCreator = emergency.createdBy.toString() === userId;
    const isResponder = emergency.responders.some(
      (responder) =>
        responder.userId.toString() === userId &&
        ["en_route", "on_scene"].includes(responder.status)
    );

    if (!isCreator && !isResponder) {
      return errorResponse(res, "Not authorized to update this emergency", 403);
    }

    // Update status
    emergency.status = status;

    // If resolved, set resolvedAt
    if (status === "resolved") {
      emergency.resolvedAt = Date.now();
    }

    await emergency.save();

    // Emit socket event to all responders and the creator
    socketService.emitToEmergency(
      emergencyId,
      SOCKET_EVENTS.EMERGENCY_STATUS_UPDATED,
      {
        emergencyId: emergency._id,
        status: emergency.status,
        updatedBy: userId,
      }
    );

    // If resolved, also broadcast to all
    if (status === "resolved") {
      socketService.emitToAll(SOCKET_EVENTS.EMERGENCY_RESOLVED, {
        emergencyId: emergency._id,
      });
    }

    return successResponse(
      res,
      { emergency },
      "Emergency status updated successfully"
    );
  } catch (error) {
    console.error("Error updating emergency status:", error);
    return errorResponse(res, "Failed to update emergency status", 500, error);
  }
};
