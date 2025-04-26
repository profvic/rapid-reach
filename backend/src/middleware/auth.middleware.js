const jwt = require("jsonwebtoken");
const { errorResponse } = require("../utils/apiResponse");
const config = require("../config/config");

module.exports = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse(res, "No token, authorization denied", 401);
    }

    // Extract token
    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret);

    // Add user ID to request
    req.userId = decoded.id;

    next();
  } catch (error) {
    return errorResponse(res, "Token is not valid", 401);
  }
};
