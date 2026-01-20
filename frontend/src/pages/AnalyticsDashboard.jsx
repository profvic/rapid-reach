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

const AnalyticsDashboard = () => {
  const { emergencies } = useSelector((state) => state.emergency)

  const [stats, setStats] = useState({
    totalIncidents: 0,
    avgResponseTime: 0,
    successRate: 0,
    highRiskAreas: 0,
    monthlyData: {},
    typeData: {},
    responseTimes: [],
    locationData: {},
    respondedCount: 0, // ✅ added
  })

  useEffect(() => {
    if (!emergencies || emergencies.length === 0) return

    // --- Total Incidents ---
    const totalIncidents = emergencies.length

    // --- Response Times ---
    const responseTimes = emergencies
      .filter((e) => e.respondedAt && e.createdAt)
      .map(
        (e) =>
          (new Date(e.respondedAt) - new Date(e.createdAt)) / (1000 * 60)
      )

    const avgResponseTime =
      responseTimes.length > 0
        ? (
            responseTimes.reduce((a, b) => a + b, 0) /
            responseTimes.length
          ).toFixed(1)
        : 0

    // --- Responded Count ---
    const respondedCount = emergencies.filter(
      (e) => e.responders && e.responders.length > 0
    ).length

    const successRate = ((respondedCount / totalIncidents) * 100).toFixed(1)

    // --- High Risk Areas ---
    const locationCounts = {}
    emergencies.forEach((e) => {
      const loc = e.location?.address?.split(",")[0] || "Unknown"
      locationCounts[loc] = (locationCounts[loc] || 0) + 1
    })
    const highRiskAreas = Object.values(locationCounts).filter(
      (c) => c > 3
    ).length

    // --- Monthly Trends ---
    const monthlyCounts = {}
    emergencies.forEach((e) => {
      const month = new Date(e.createdAt).toLocaleString("default", {
        month: "short",
      })
      monthlyCounts[month] = (monthlyCounts[month] || 0) + 1
    })

    // --- Type Distribution ---
    const typeCounts = {}
    emergencies.forEach((e) => {
      typeCounts[e.emergencyType] =
        (typeCounts[e.emergencyType] || 0) + 1
    })

    setStats({
      totalIncidents,
      avgResponseTime,
      successRate,
      highRiskAreas,
      monthlyData: monthlyCounts,
      typeData: typeCounts,
      responseTimes,
      locationData: locationCounts,
      respondedCount,
    })
  }, [emergencies])

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Incident Analytics</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg shadow p-4">
          <p className="text-sm text-muted-foreground">Total Incidents</p>
          <h2 className="text-2xl font-bold">{stats.totalIncidents}</h2>
        </div>
        <div className="bg-card rounded-lg shadow p-4">
          <p className="text-sm text-muted-foreground">Avg Response Time</p>
          <h2 className="text-2xl font-bold">
            {stats.avgResponseTime} min
          </h2>
        </div>
        <div className="bg-card rounded-lg shadow p-4">
          <p className="text-sm text-muted-foreground">Success Rate</p>
          <h2 className="text-2xl font-bold">{stats.successRate}%</h2>
        </div>
        <div className="bg-card rounded-lg shadow p-4">
          <p className="text-sm text-muted-foreground">High Risk Areas</p>
          <h2 className="text-2xl font-bold">{stats.highRiskAreas}</h2>
        </div>
      </div>

      {/* ✅ NEW: Reported vs Responded */}
      <div className="bg-card rounded-lg shadow p-4 max-w-md">
        <h2 className="text-lg font-semibold mb-4">
          Reported vs Responded Incidents
        </h2>
        <Doughnut
          data={{
            labels: ["Reported", "Responded"],
            datasets: [
              {
                data: [
                  stats.totalIncidents,
                  stats.respondedCount,
                ],
                backgroundColor: ["#EF4444", "#22C55E"],
              },
            ],
          }}
        />
      </div>

      {/* Existing Charts (UNCHANGED) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">
            Monthly Incident Trends
          </h2>
          <Bar
            data={{
              labels: Object.keys(stats.monthlyData),
              datasets: [
                {
                  label: "Incidents",
                  data: Object.values(stats.monthlyData),
                  backgroundColor: "#EF4444",
                },
              ],
            }}
          />
        </div>

        <div className="bg-card rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">
            Incident Types Distribution
          </h2>
          <Doughnut
            data={{
              labels: Object.keys(stats.typeData),
              datasets: [
                {
                  data: Object.values(stats.typeData),
                  backgroundColor: [
                    "#EF4444",
                    "#F97316",
                    "#22C55E",
                    "#EAB308",
                  ],
                },
              ],
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">
            Response Time Trends
          </h2>
          <Line
            data={{
              labels: stats.responseTimes.map((_, i) => i + 1),
              datasets: [
                {
                  label: "Response Time (min)",
                  data: stats.responseTimes,
                  borderColor: "#3B82F6",
                },
              ],
            }}
          />
        </div>

        <div className="bg-card rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">
            Incidents by Location
          </h2>
          <Bar
            data={{
              labels: Object.keys(stats.locationData),
              datasets: [
                {
                  label: "Incidents",
                  data: Object.values(stats.locationData),
                  backgroundColor: "#6366F1",
                },
              ],
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default AnalyticsDashboard
