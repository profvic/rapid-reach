const app = require("./app");
const config = require("./config/config");
const socketService = require("./services/socket.service");

// Start the server
const PORT = config.port;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Initialize Socket.io
const io = socketService.initialize(server);

// Handle unhandled rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  server.close(() => {
    process.exit(1);
  });
});
