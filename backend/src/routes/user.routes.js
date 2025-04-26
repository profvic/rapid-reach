const express = require("express");
const userController = require("../controllers/user.controller");
const router = express.Router();

// Get current user profile
router.get("/me", userController.getCurrentUser);

// Update user profile
router.put("/me", userController.updateUser);

// Update user location
router.patch("/me/location", userController.updateLocation);

// Update availability status
router.patch("/me/availability", userController.updateAvailability);

module.exports = router;
