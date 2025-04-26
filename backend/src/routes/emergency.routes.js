const express = require("express");
const emergencyController = require("../controllers/emergency.controller");
const router = express.Router();

// Create a new emergency
router.post("/", emergencyController.createEmergency);

// Get all active emergencies
router.get("/active", emergencyController.getActiveEmergencies);

// Get nearby emergencies
router.get("/nearby", emergencyController.getNearbyEmergencies);

// Get emergency details
router.get("/:emergencyId", emergencyController.getEmergency);

// Respond to an emergency
router.post("/:emergencyId/respond", emergencyController.respondToEmergency);

// Update emergency status
router.patch("/:emergencyId/status", emergencyController.updateEmergencyStatus);

module.exports = router;
