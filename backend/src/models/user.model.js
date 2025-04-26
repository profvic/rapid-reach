const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    skills: [
      {
        type: String,
        enum: [
          "first_aid",
          "cpr",
          "fire_safety",
          "search_rescue",
          "medical",
          "emergency_response",
          "other",
        ],
      },
    ],
    certifications: [
      {
        type: {
          type: String,
          required: true,
        },
        issuer: String,
        expiryDate: Date,
      },
    ],
    currentLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },
    availabilityStatus: {
      type: Boolean,
      default: true,
    },
    trustScore: {
      type: Number,
      default: 3,
      min: 1,
      max: 5,
    },
    responseHistory: [
      {
        emergencyId: {
          type: Schema.Types.ObjectId,
          ref: "Emergency",
        },
        responseTime: Number, // in seconds
        feedback: Number, // 1-5 rating
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Create a 2dsphere index for geospatial queries
userSchema.index({ "currentLocation.coordinates": "2dsphere" });

const User = mongoose.model("User", userSchema);

module.exports = User;
