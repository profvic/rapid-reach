const axios = require("axios");
const config = require("../config/config");
const { successResponse, errorResponse } = require("../utils/apiResponse");

// Get directions between two points
exports.getDirections = async (req, res) => {
  try {
    const {
      startLng,
      startLat,
      endLng,
      endLat,
      profile = "driving",
    } = req.body;

    if (!startLng || !startLat || !endLng || !endLat) {
      return errorResponse(res, "Start and end coordinates are required", 400);
    }

    // Validate profile (driving, walking, cycling)
    const validProfiles = ["driving", "walking", "cycling"];
    if (!validProfiles.includes(profile)) {
      return errorResponse(
        res,
        "Invalid profile. Must be one of: driving, walking, cycling",
        400
      );
    }

    // Call Mapbox Directions API
    const response = await axios.get(
      `https://api.mapbox.com/directions/v5/mapbox/${profile}/${startLng},${startLat};${endLng},${endLat}`,
      {
        params: {
          access_token: config.mapbox.accessToken,
          geometries: "geojson",
          overview: "full",
          steps: true,
          annotations: "distance,duration,speed",
        },
      }
    );

    if (
      !response.data ||
      !response.data.routes ||
      response.data.routes.length === 0
    ) {
      return errorResponse(res, "No route found", 404);
    }

    const route = response.data.routes[0];

    // Format the response
    const result = {
      distance: route.distance, // meters
      duration: route.duration, // seconds
      geometry: route.geometry, // GeoJSON LineString
      steps: route.legs[0].steps.map((step) => ({
        instruction: step.maneuver.instruction,
        distance: step.distance,
        duration: step.duration,
        coordinates: step.geometry.coordinates,
      })),
    };

    return successResponse(res, result, "Route retrieved successfully");
  } catch (error) {
    console.error("Error getting directions:", error);
    return errorResponse(res, "Failed to get directions", 500, error);
  }
};

// Reverse geocode (convert coordinates to address)
exports.reverseGeocode = async (req, res) => {
  try {
    const { longitude, latitude } = req.query;

    if (!longitude || !latitude) {
      return errorResponse(res, "Longitude and latitude are required", 400);
    }

    // Call Mapbox Geocoding API
    const response = await axios.get(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json`,
      {
        params: {
          access_token: config.mapbox.accessToken,
          limit: 1,
        },
      }
    );

    if (
      !response.data ||
      !response.data.features ||
      response.data.features.length === 0
    ) {
      return errorResponse(res, "No address found for these coordinates", 404);
    }

    const feature = response.data.features[0];

    // Format the response
    const result = {
      placeName: feature.place_name,
      placeType: feature.place_type[0],
      coordinates: feature.geometry.coordinates,
      address: {
        fullAddress: feature.place_name,
        city: feature.context?.find((ctx) => ctx.id.startsWith("place"))?.text,
        state: feature.context?.find((ctx) => ctx.id.startsWith("region"))
          ?.text,
        country: feature.context?.find((ctx) => ctx.id.startsWith("country"))
          ?.text,
        postcode: feature.context?.find((ctx) => ctx.id.startsWith("postcode"))
          ?.text,
      },
    };

    return successResponse(res, result, "Address retrieved successfully");
  } catch (error) {
    console.error("Error reverse geocoding:", error);
    return errorResponse(res, "Failed to reverse geocode", 500, error);
  }
};

// Get estimated arrival time
exports.getETA = async (req, res) => {
  try {
    const {
      startLng,
      startLat,
      endLng,
      endLat,
      profile = "driving",
    } = req.body;

    if (!startLng || !startLat || !endLng || !endLat) {
      return errorResponse(res, "Start and end coordinates are required", 400);
    }

    // Call Mapbox Directions API (simplified version)
    const response = await axios.get(
      `https://api.mapbox.com/directions/v5/mapbox/${profile}/${startLng},${startLat};${endLng},${endLat}`,
      {
        params: {
          access_token: config.mapbox.accessToken,
          geometries: "geojson",
          overview: "simplified",
        },
      }
    );

    if (
      !response.data ||
      !response.data.routes ||
      response.data.routes.length === 0
    ) {
      return errorResponse(res, "No route found", 404);
    }

    const route = response.data.routes[0];

    // Calculate ETA based on current time
    const now = new Date();
    const etaTimestamp = new Date(now.getTime() + route.duration * 1000);

    // Format the response
    const result = {
      distance: route.distance, // meters
      duration: route.duration, // seconds
      etaTimestamp: etaTimestamp,
      etaText: formatETA(etaTimestamp),
      durationText: formatDuration(route.duration),
    };

    return successResponse(res, result, "ETA retrieved successfully");
  } catch (error) {
    console.error("Error getting ETA:", error);
    return errorResponse(res, "Failed to get ETA", 500, error);
  }
};

// Helper function to format ETA
function formatETA(date) {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// Helper function to format duration
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours} hr ${minutes} min`;
  } else {
    return `${minutes} min`;
  }
}
