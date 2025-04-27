# 🚀 RapidReach Frontend

## 📂 Project Structure

```
frontend/
├── public/
├── src/
│   ├── assets/                 # Static assets (images, icons, etc.)
│   ├── components/              # Reusable UI and functional components
│   │   ├── ui/                  # Toasts, Notification Dropdowns, etc.
│   │   ├── AudioAssistantBot.jsx
│   │   ├── MapComponent.jsx
│   │   ├── NotificationDropdown.jsx
│   ├── layouts/                 # Layouts for pages
│   │   ├── AppLayout.jsx
│   │   ├── AuthLayout.jsx
│   ├── lib/                     # (optional utilities here if needed)
│   ├── pages/                   # Main pages
│   │   ├── Dashboard.jsx
│   │   ├── EmergencyDetail.jsx
│   │   ├── EmergencyReport.jsx
│   │   ├── Login.jsx
│   │   ├── NotFound.jsx
│   │   ├── Profile.jsx
│   │   ├── Register.jsx
│   ├── redux/                   # State management (Redux Toolkit)
│   │   ├── slices/              # Redux slices
│   │   ├── services/            # API service files
│   ├── App.jsx                  # Main App component
│   ├── main.jsx                 # Entry point
│   ├── index.css                # Global CSS
├── .env                         # Environment Variables
├── vite.config.js               # Vite configuration
├── package.json                 # NPM Dependencies
├── README.md                    # Project documentation
```

---

## 📜 Project Overview

RapidReach Frontend is the user-facing client application of the RapidReach emergency management system.  
It allows users to **report emergencies**, **view nearby incidents**, **send SOS alerts**, and **respond to emergencies**.

---

## ✨ Features

- **User Authentication** — Login and Registration system.
- **Emergency Reporting** — Report emergencies by setting location and selecting type.
- **Emergency Dashboard** — View nearby incidents on a live map.
- **Real-Time Location Tracking** — Locate yourself and responders in real time.
- **SOS Alert Button** — Instantly send SOS alerts with current location.
- **Profile Management** — View and edit personal information and skills.
- **Audio Assistant Bot** — Voice-enabled reporting for faster interaction.
- **Dynamic Routing** — Navigate between emergency details, dashboard, report page, etc.
- **Toast Notifications** — Instant feedback for user actions.

---

## 🛠️ Tech Stack

- **Frontend Framework:** React.js (Vite)
- **State Management:** Redux Toolkit
- **Maps & Location:** Mapbox GL JS
- **API Communication:** Axios
- **Styling:** Tailwind CSS (light customizations)
- **Other Libraries:** 
  - Lucide React Icons
  - Voice Recognition (Web Speech API)

---

## 🖥️ Setup Instructions

1. **Install dependencies**

```bash
npm install
```

2. **Configure Environment Variables**

Create a `.env` file in the `frontend/` root with:

```bash
VITE_API_URL=http://localhost:5000/api
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token
```

3. **Run the application**

```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📚 Folder Highlights

| Folder/File | Purpose |
|-------------|---------|
| `components/` | Reusable React components like Map, Toasts, Notifications |
| `layouts/` | Page layouts for authenticated vs unauthenticated users |
| `pages/` | Major screens - Dashboard, Emergency Details, Reporting, etc |
| `redux/` | Redux slices and services for state management |
| `App.jsx` | Main router and component structure |
| `MapComponent.jsx` | Handles maps, markers, SOS buttons, real-time tracking |
| `AudioAssistantBot.jsx` | Voice-based reporting assistant |

---

## 📢 Important Notes

- Make sure you have a valid **Mapbox Access Token** to render maps.
- Backend API must be running for authentication and emergency features.
- Responsive across mobile and desktop.

---

## 👨‍💻 Authors

- Yugm Patel
- Shubham Kothiya
- Pruthvik Sheth
- Mansi Patel
