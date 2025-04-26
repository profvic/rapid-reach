// Load environment variables from .env file
require("dotenv").config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  mongoURI: process.env.MONGODB_URI,
  jwtSecret:
    process.env.JWT_SECRET || "your-default-secret-key-for-development",
  mapbox: {
    accessToken: process.env.MAPBOX_ACCESS_TOKEN,
  },
  aws: {
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
};
