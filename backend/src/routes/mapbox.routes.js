const express = require("express");
const mapboxController = require("../controllers/mapbox.controller");
const router = express.Router();

// Get directions between two points
router.post("/directions", mapboxController.getDirections);

// Reverse geocode (convert coordinates to address)
router.get("/reverse-geocode", mapboxController.reverseGeocode);

// Get estimated arrival time
router.post("/eta", mapboxController.getETA);

module.exports = router;
