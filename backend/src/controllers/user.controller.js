const User = require("../models/user.model")
const { successResponse, errorResponse } = require("../utils/apiResponse")

// Get current user profile
exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId // This will come from auth middleware later

    const user = await User.findById(userId).select("-password")

    if (!user) {
      return errorResponse(res, "User not found", 404)
    }

    return successResponse(res, user, "User profile retrieved successfully")
  } catch (error) {
    console.error("Error getting user profile:", error)
    return errorResponse(res, "Failed to get user profile", 500, error)
  }
}

// Update user profile
exports.updateUser = async (req, res) => {
  try {
    const userId = req.userId // This will come from auth middleware later
    const { name, phone, skills, certifications } = req.body

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          name,
          phone,
          skills,
          certifications,
          updatedAt: Date.now(),
        },
      },
      { new: true, runValidators: true }
    ).select("-password")

    if (!updatedUser) {
      return errorResponse(res, "User not found", 404)
    }

    return successResponse(
      res,
      updatedUser,
      "User profile updated successfully"
    )
  } catch (error) {
    console.error("Error updating user profile:", error)
    return errorResponse(res, "Failed to update user profile", 500, error)
  }
}

// Update user location
exports.updateLocation = async (req, res) => {
  try {
    const userId = req.userId // This will come from auth middleware later
    const { longitude, latitude } = req.body

    // Validate coordinates
    if (longitude === undefined || latitude === undefined) {
      return errorResponse(res, "Longitude and latitude are required", 400)
    }

    // Parse coordinates to ensure they're numbers
    const lng = parseFloat(longitude)
    const lat = parseFloat(latitude)

    // Validate coordinate ranges
    if (isNaN(lng) || isNaN(lat)) {
      return errorResponse(
        res,
        "Longitude and latitude must be valid numbers",
        400
      )
    }

    if (lng < -180 || lng > 180) {
      return errorResponse(res, "Longitude must be between -180 and 180", 400)
    }

    if (lat < -90 || lat > 90) {
      return errorResponse(res, "Latitude must be between -90 and 90", 400)
    }

    console.log(`Updating user location to: [${lng}, ${lat}]`)

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          "currentLocation.type": "Point",
          "currentLocation.coordinates": [lng, lat],
          "currentLocation.lastUpdated": Date.now(),
        },
      },
      { new: true }
    ).select("-password")

    if (!updatedUser) {
      return errorResponse(res, "User not found", 404)
    }

    return successResponse(
      res,
      updatedUser,
      "User location updated successfully"
    )
  } catch (error) {
    console.error("Error updating user location:", error)
    return errorResponse(res, "Failed to update user location", 500, error)
  }
}

// Update availability status
exports.updateAvailability = async (req, res) => {
  try {
    const userId = req.userId // This will come from auth middleware later
    const { availabilityStatus } = req.body

    if (availabilityStatus === undefined) {
      return errorResponse(res, "Availability status is required", 400)
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          availabilityStatus: Boolean(availabilityStatus),
        },
      },
      { new: true }
    ).select("-password")

    if (!updatedUser) {
      return errorResponse(res, "User not found", 404)
    }

    return successResponse(
      res,
      updatedUser,
      "Availability status updated successfully"
    )
  } catch (error) {
    console.error("Error updating availability status:", error)
    return errorResponse(
      res,
      "Failed to update availability status",
      500,
      error
    )
  }
}
