// src/pages/AnalyticsDashboard.jsx
import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { Bar, Doughnut, Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js"

ChartJS.register(
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
)

// 📍 Reference Fire Station (Port Harcourt)
const STATION = {
  lat: 4.8156,
  lng: 7.0498,
}

// 🌍 Haversine Distance (km)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

const AnalyticsDashboard = () => {
  const reduxEmergencies = useSelector((state) => state.emergency.emergencies)
  const [emergencies, setEmergencies] = useState([])

  const [stats, setStats] = useState({
    total: 0,
    responded: 0,
    avgResponseTime: 0,
    successRate: 0,
    monthly: {},
    types: {},
    distance: {},
    responseTimes: [],
  })

  // 🔹 REAL BACKEND CALL
  useEffect(() => {
    fetch("/api/emergencies")
      .then((res) => res.json())
      .then(setEmergencies)
      .catch(() => setEmergencies(reduxEmergencies))
  }, [reduxEmergencies])

  // 🔹 PROCESS DATA
  useEffect(() => {
    if (!emergencies || emergencies.length === 0) return

    const total = emergencies.length
    const responded = emergencies.filter(
      (e) => e.responders && e.responders.length > 0
    ).length

    // ⏱ Response Time Trend
    const responseTimes = emergencies
      .filter((e) => e.createdAt && e.respondedAt)
      .map((e) => {
        const created = new Date(e.createdAt)
        const responded = new Date(e.respondedAt)
        return ((responded - created) / 60000).toFixed(1)
      })

    const avgResponseTime =
      responseTimes.length > 0
        ? (
            responseTimes.reduce((a, b) => a + Number(b), 0) /
            responseTimes.length
          ).toFixed(1)
        : 0

    // 📅 Monthly
    const monthly = {}
    emergencies.forEach((e) => {
      const m = new Date(e.createdAt).toLocaleString("default", {
        month: "short",
      })
      monthly[m] = (monthly[m] || 0) + 1
    })

    // 🔥 Incident Types
    const types = {}
    emergencies.forEach((e) => {
      types[e.emergencyType] = (types[e.emergencyType] || 0) + 1
    })

    // 📍 Distance Buckets
    const distance = {
      "0–1km": 0,
      "1–3km": 0,
      "3–5km": 0,
      "5–10km": 0,
      "10km+": 0,
    }

    emergencies.forEach((e) => {
      if (!e.location?.latitude || !e.location?.longitude) return

      const d = calculateDistance(
        STATION.lat,
        STATION.lng,
        e.location.latitude,
        e.location.longitude
      )

      if (d <= 1) distance["0–1km"]++
      else if (d <= 3) distance["1–3km"]++
      else if (d <= 5) distance["3–5km"]++
      else if (d <= 10) distance["5–10km"]++
      else distance["10km+"]++
    })

    setStats({
      total,
      responded,
      avgResponseTime,
      successRate: ((responded / total) * 100).toFixed(1),
      monthly,
      types,
      distance,
      responseTimes,
    })
  }, [emergencies])

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Incident Analytics</h1>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          ["Total Incidents", stats.total],
          ["Responded", stats.responded],
          ["Avg Response Time", `${stats.avgResponseTime} min`],
          ["Success Rate", `${stats.successRate}%`],
        ].map(([label, value]) => (
          <div key={label} className="bg-card rounded-lg shadow p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <h2 className="text-2xl font-bold">{value}</h2>
          </div>
        ))}
      </div>

      {/* ROW 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Reported vs Responded */}
        <div className="bg-card rounded-lg shadow p-4">
          <h2 className="font-semibold mb-4">Reported vs Responded</h2>
          <Doughnut
            data={{
              labels: ["Reported", "Responded"],
              datasets: [
                {
                  data: [stats.total, stats.responded],
                  backgroundColor: ["#EF4444", "#22C55E"],
                },
              ],
            }}
          />
        </div>

        {/* Incident Types */}
        <div className="bg-card rounded-lg shadow p-4">
          <h2 className="font-semibold mb-4">Incident by Type</h2>
          <Doughnut
            data={{
              labels: Object.keys(stats.types),
              datasets: [
                {
                  data: Object.values(stats.types),
                  backgroundColor: [
                    "#EF4444",
                    "#F97316",
                    "#22C55E",
                    "#3B82F6",
                  ],
                },
              ],
            }}
          />
        </div>
      </div>

      {/* ROW 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly */}
        <div className="bg-card rounded-lg shadow p-4">
          <h2 className="font-semibold mb-4">Monthly Incidents</h2>
          <Bar
            data={{
              labels: Object.keys(stats.monthly),
              datasets: [
                {
                  label: "Incidents",
                  data: Object.values(stats.monthly),
                  backgroundColor: "#6366F1",
                },
              ],
            }}
          />
        </div>

        {/* Distance */}
        <div className="bg-card rounded-lg shadow p-4">
          <h2 className="font-semibold mb-4">Incidents by Distance</h2>
          <Line
            data={{
              labels: Object.keys(stats.distance),
              datasets: [
                {
                  label: "Incidents",
                  data: Object.values(stats.distance),
                  borderColor: "#0EA5E9",
                  tension: 0.4,
                },
              ],
            }}
          />
        </div>
      </div>

      {/* RESPONSE TIME TREND (RESTORED ✅) */}
      <div className="bg-card rounded-lg shadow p-4">
        <h2 className="font-semibold mb-4">Response Time Trend</h2>
        <Line
          data={{
            labels: stats.responseTimes.map((_, i) => `Incident ${i + 1}`),
            datasets: [
              {
                label: "Response Time (minutes)",
                data: stats.responseTimes,
                borderColor: "#F59E0B",
                backgroundColor: "#F59E0B",
                tension: 0.3,
              },
            ],
          }}
        />
      </div>
    </div>
  )
}

export default AnalyticsDashboard
