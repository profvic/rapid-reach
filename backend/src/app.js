const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const config = require("./config/config");
const mapboxRoutes = require("./routes/mapbox.routes");

// Import routes
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const emergencyRoutes = require("./routes/emergency.routes");
const notificationRoutes = require("./routes/notification.routes");

// Import middleware
const authMiddleware = require("./middleware/auth.middleware");

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple route for testing
app.get("/", (req, res) => {
  res.json({ message: "Welcome to RapidReach API" });
});

// Auth routes (public)
app.use("/api/auth", authRoutes);

// Protected routes
app.use("/api/users", authMiddleware, userRoutes);
app.use("/api/emergencies", authMiddleware, emergencyRoutes);
app.use("/api/notifications", authMiddleware, notificationRoutes);
app.use("/api/mapbox", authMiddleware, mapboxRoutes);

// Connect to MongoDB
mongoose
  .connect(config.mongoURI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  });
});

module.exports = app;
