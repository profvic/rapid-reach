# 🌍 RapidReach - Emergency Reporting & Response Platform

## 💡 Project Overview
RapidReach is a real-time emergency reporting and response web application that empowers users to quickly report emergencies, alert others, and assist those in need.
Built for SJ Hacks, it combines geolocation services, SOS alerts, live emergency tracking, and AI voice assistance for enhanced emergency management.

---

## 🔗 Key Features

1. **Report Emergencies:**
   - Drag the marker to the exact location.
   - Select emergency type (Fire, Medical, Security, Natural Disaster, Other).
   - Provide a description manually or via voice assistant.

2. **Real-time Dashboard:**
   - View nearby emergencies instantly on a map.
   - See detailed emergency cards with time, address, and responder counts.

3. **SOS Button:**
   - Instantly send your live location with an SOS alert for urgent help.

4. **Emergency Details Page:**
   - Track routes to emergencies with directions.
   - View/respond to emergencies and mark status (Arrived, Resolved, Cancelled).

5. **Profile Management:**
   - View availability, phone number, emergency skills.
   - Track your emergency response history.

6. **Voice Assistant Integration:**
   - Report emergencies hands-free by recording descriptions.

---

## 🌐 Technologies Used

- **Frontend:** React.js, TailwindCSS, MapboxGL
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas
- **Real-time Features:** Socket.IO (for SOS alerts)
- **Voice Assistant:** Web Speech API

---

## 🔖 Setup Instructions

1. **Clone the repository:**
```bash
git clone <your-repo-link>
cd rapid-reach-frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
Create a `.env` file and add your Mapbox token:
```
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
```

4. **Start the development server:**
```bash
npm run dev
```

> Make sure backend server (API) is running separately.

---

## 🖋️ Screenshots

### 1. Login
![Login](https://github.com/pruthvik-sheth/rapid-reach/blob/main/Images/Login.png?raw=true)

### 2. Register
![Register](https://github.com/pruthvik-sheth/rapid-reach/blob/main/Images/Register.png?raw=true)

### 3. Dashboard - Nearby Emergencies
![Dashboard](https://github.com/pruthvik-sheth/rapid-reach/blob/main/Images/Dashboard.png?raw=true)

### 4. Emergency Details
![Emergency Detail](https://github.com/pruthvik-sheth/rapid-reach/blob/main/Images/Emergency%20Details.png?raw=true)

### 5. Report Emergency
![Report Emergency](https://github.com/pruthvik-sheth/rapid-reach/blob/main/Images/Report%20Emergency.png?raw=true)

### 6. SOS Alert Sent
![SOS Alert Sent](https://github.com/pruthvik-sheth/rapid-reach/blob/main/Images/SOS%20Alert.png?raw=true)

### 7. Voice Assistant Activated
![Voice Assistant](https://github.com/pruthvik-sheth/rapid-reach/blob/main/Images/Voice%20Assistant.png?raw=true)

### 8. Profile
![Profile](https://github.com/pruthvik-sheth/rapid-reach/blob/main/Images/Profile.png?raw=true)


---

## 🏆 Bonus Features Implemented
- [x] Project Pitch Slide Deck
- [x] Live SOS Button
- [x] Voice-powered Emergency Reporting
- [x] Real-time Emergency Updates

---

## 💡 Why We Built It
Emergencies require speed, clarity, and accessibility. RapidReach ensures that:
- **Anyone** can report an emergency in seconds.
- **First responders** get live, detailed updates.
- **Communities** can coordinate better in critical situations.

We envision RapidReach as a platform that saves time, saves lives.

---

## 🔍 Future Improvements
- Push Notifications for SOS alerts.
- Role-based access for Admins/Responders.
- Offline capabilities for low network areas.
- AI-based automatic emergency detection from user voice.

---

## 👥 Team Members
- Yugm Patel
- Pruthvik Sheth
- Shubham Kothiya
- Mansi Patel

---

### ✨ Thank you for checking out RapidReach!

