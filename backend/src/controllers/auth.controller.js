const User = require("../models/user.model");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config/config");

// Register a new user
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, skills } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, "Email already in use", 400);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      skills,
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, config.jwtSecret, {
      expiresIn: "7d",
    });

    // Return user data (excluding password) and token
    const userData = user.toObject();
    delete userData.password;

    return successResponse(
      res,
      { user: userData, token },
      "User registered successfully",
      201
    );
  } catch (error) {
    console.error("Error registering user:", error);
    return errorResponse(res, "Failed to register user", 500, error);
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return errorResponse(res, "Invalid credentials", 401);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return errorResponse(res, "Invalid credentials", 401);
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, config.jwtSecret, {
      expiresIn: "7d",
    });

    // Return user data (excluding password) and token
    const userData = user.toObject();
    delete userData.password;

    return successResponse(res, { user: userData, token }, "Login successful");
  } catch (error) {
    console.error("Error logging in:", error);
    return errorResponse(res, "Failed to login", 500, error);
  }
};
