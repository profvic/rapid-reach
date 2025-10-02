// src/pages/Dashboard.jsx
import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { AlertCircle, Navigation, Clock, Eye } from "lucide-react"
import { getNearbyEmergencies } from "../redux/slices/emergencySlice"
import MapComponent from "../components/MapComponent"

import { Bar, Doughnut } from "react-chartjs-2"
import {
  Chart as ChartJS,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js"

ChartJS.register(
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
)

const Dashboard = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { emergencies, loading, error } = useSelector(
    (state) => state.emergency
  )
  const { currentLocation } = useSelector((state) => state.user)

  const [mapMarkers, setMapMarkers] = useState([])
  const [typeStats, setTypeStats] = useState({})
  const [reportStats, setReportStats] = useState({ reported: 0, responded: 0 })

  // Default to San Francisco if no location is available
  const defaultLocation = [-122.4194, 37.7749] // San Francisco coordinates
  const initialCenter = currentLocation || defaultLocation

  // Fetch nearby emergencies when location changes
  useEffect(() => {
    if (currentLocation) {
      const [longitude, latitude] = currentLocation
      dispatch(getNearbyEmergencies({ longitude, latitude }))
    } else {
      const [longitude, latitude] = defaultLocation
      dispatch(getNearbyEmergencies({ longitude, latitude }))
    }
  }, [currentLocation, dispatch])

  // Prepare emergency markers and stats
  useEffect(() => {
    if (emergencies.length > 0) {
      const markers = emergencies
        .map((emergency) => {
          if (emergency.location && emergency.location.coordinates) {
            const [lng, lat] = emergency.location.coordinates
            return {
              id: emergency._id,
              longitude: lng,
              latitude: lat,
              color: getEmergencyColor(emergency.emergencyType),
              popupContent: `
                <h3 class="text-base font-bold">${emergency.emergencyType.toUpperCase()}</h3>
                <p class="text-sm">${emergency.description}</p>
                <p class="text-xs text-gray-500 mt-1">
                  ${new Date(emergency.createdAt).toLocaleTimeString()}
                </p>
              `,
              onClick: () => navigate(`/emergency/${emergency._id}`),
            }
          }
          return null
        })
        .filter(Boolean)

      setMapMarkers(markers)

      // Stats by type
      const countsByType = {}
      let reported = 0
      let responded = 0

      emergencies.forEach((emergency) => {
        const type = emergency.emergencyType.toLowerCase()
        countsByType[type] = (countsByType[type] || 0) + 1
        reported++
        if (emergency.responders && emergency.responders.length > 0) {
          responded++
        }
      })

      setTypeStats(countsByType)
      setReportStats({ reported, responded })
    }
  }, [emergencies, navigate])

  // Helper to get color based on emergency type
  const getEmergencyColor = (type) => {
    switch (type.toLowerCase()) {
      case "wild_fire":
        return "#FF4136" // Red
      case "electrical_fire":
        return "#2ECC40" // Green
      case "fuel_fire":
        return "#0074D9" // Blue
      case "domestic_fire":
        return "#FF851B" // Orange
      default:
        return "#B10DC9" // Purple
    }
  }

  // Format time elapsed
  const formatTimeElapsed = (dateString) => {
    const created = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now - created) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`

    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Map */}
      <div className="md:col-span-2">
        <div className="bg-card rounded-lg shadow-md overflow-hidden h-[500px] relative">
          <MapComponent
            initialCenter={initialCenter}
            initialZoom={13}
            height="500px"
            width="100%"
            markerColor="#0074D9"
            markers={mapMarkers}
            showSOSButton={true}
          />
        </div>
      </div>

      {/* Emergency List */}
      <div>
        <div className="bg-card rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold">Nearby Emergencies</h2>
          </div>

          <div className="p-0 max-h-[460px] overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">
                Loading emergencies...
              </div>
            ) : error ? (
              <div className="p-4 text-center text-destructive">
                Error: {error}
              </div>
            ) : emergencies.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No emergencies nearby
              </div>
            ) : (
              <div className="divide-y divide-border">
                {emergencies.map((emergency) => (
                  <div
                    key={emergency._id}
                    className="p-4 hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => navigate(`/emergency/${emergency._id}`)}
                  >
                    <div className="flex items-start">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center mr-3 mt-1"
                        style={{
                          backgroundColor: `${getEmergencyColor(
                            emergency.emergencyType
                          )}20`,
                        }}
                      >
                        <AlertCircle
                          size={20}
                          className="text-foreground"
                          style={{
                            color: getEmergencyColor(emergency.emergencyType),
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">
                          {emergency.emergencyType.charAt(0).toUpperCase() +
                            emergency.emergencyType.slice(1)}{" "}
                          Emergency
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {emergency.description}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                          <div className="flex items-center">
                            <Clock size={12} className="mr-1" />
                            {formatTimeElapsed(emergency.createdAt)}
                          </div>
                          <div className="flex items-center">
                            <Navigation size={12} className="mr-1" />
                            {emergency.location?.address
                              ? emergency.location.address.split(",")[0]
                              : "Unknown location"}
                          </div>
                          <div className="flex items-center">
                            <Eye size={12} className="mr-1" />
                            {emergency.responders?.length || 0}{" "}
                            {emergency.responders?.length === 1
                              ? "responder"
                              : "responders"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <button
  className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded"
  onClick={() => navigate("/analytics")}
>
  View Analytics Dashboard
</button>


      {/* Charts */}
      <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        

        {/* Doughnut Chart */}
        <div className="bg-card rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-4">Reported vs Responded</h2>
          <Doughnut
            data={{
              labels: ["Reported", "Responded"],
              datasets: [
                {
                  label: "Count",
                  data: [reportStats.reported, reportStats.responded],
                  backgroundColor: ["#6366F1", "#10B981"],
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: "bottom",
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default Dashboard
