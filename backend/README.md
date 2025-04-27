# 📂 Backend - RapidReach

## Overview
This is the backend for **RapidReach**, a real-time emergency assistance system.  
It provides:
- User Authentication
- Emergency Reporting & Management
- Notification System
- WebSocket-powered real-time communication for SOS alerts

Built with **Node.js**, **Express.js**, **MongoDB**, and **Socket.IO**.

---

## 🏗️ Folder Structure

```
backend/
├── src/
│   ├── config/
│   │   └── config.js
│   ├── constants/
│   │   └── socket.events.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── emergency.controller.js
│   │   ├── mapbox.controller.js
│   │   ├── notification.controller.js
│   │   └── user.controller.js
│   ├── middleware/
│   │   └── auth.middleware.js
│   ├── models/
│   │   ├── emergency.model.js
│   │   ├── notification.model.js
│   │   └── user.model.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── emergency.routes.js
│   │   ├── mapbox.routes.js
│   │   ├── notification.routes.js
│   │   └── user.routes.js
│   ├── services/
│   │   └── socket.service.js
│   └── utils/
│       └── apiResponse.js
│   ├── app.js
│   ├── server.js
├── .env
├── package.json
├── README.md
```

---

## ⚙️ Installation

1. Go to the `backend/` folder:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   MAPBOX_TOKEN=your_mapbox_token
   FRONTEND_URL=http://localhost:5173
   ```

4. Start the backend server:
   ```bash
   npm run dev
   ```

---

## 🚀 APIs Overview

| Method | Endpoint | Description |
|:------:|:--------:|:-----------:|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login user |
| GET  | `/api/emergencies/nearby` | Fetch nearby emergencies |
| POST | `/api/emergencies/report` | Report new emergency |
| POST | `/api/emergencies/respond` | Respond to an emergency |
| GET  | `/api/notifications/` | Get user notifications |

---

## 🔥 Key Features
- JWT Authentication 🔑
- MongoDB database connection 🛢️
- REST APIs for Emergencies, Users, Notifications 📩
- Real-time WebSocket (Socket.IO) for instant SOS alerts 🚨
- Modular folder structure and clean code 🧹

---

## 👥 Tech Stack
- Node.js
- Express.js
- MongoDB (Mongoose)
- Socket.IO
- Mapbox Geocoding & Routing APIs
- JWT (Authentication)

---

# ✨ Final Notes:
- Make sure your backend (`localhost:5000`) and frontend (`localhost:5173`) are both running.
- Mapbox API key is required for location-related features.
- MongoDB Atlas or local MongoDB setup is required for database.
