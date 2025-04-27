import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MapComponent = ({
  initialCenter = [-74.0066, 40.7135],
  initialZoom = 15.5,
  markerColor = "red",
  onLocationChange = null,
  height = "400px",
  width = "100%",
  showControls = true,
  draggableMarker = false,
  markers = [],
  routeCoordinates = null,
  showDirections = false,
  enableRealTimeTracking = false,
  userLocation = null,
  showSOSButton = true
}) => {
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const [mainMarker, setMainMarker] = useState(null);
  const markersRef = useRef([]);
  const routeRef = useRef(null);
  const userMarkerRef = useRef(null);
  const watchPositionId = useRef(null);
  const [isTracking, setIsTracking] = useState(false);
  const [location, setLocation] = useState({
    latitude: Array.isArray(initialCenter) ? initialCenter[1] : initialCenter.latitude,
    longitude: Array.isArray(initialCenter) ? initialCenter[0] : initialCenter.longitude
  });

  useEffect(() => {
    if (initialCenter) {
      setLocation({
        latitude: Array.isArray(initialCenter) ? initialCenter[1] : initialCenter.latitude,
        longitude: Array.isArray(initialCenter) ? initialCenter[0] : initialCenter.longitude
      });
    }
  }, [initialCenter]);

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [location.longitude, location.latitude],
      zoom: initialZoom,
      antialias: true
    });

    mapInstance.current = map;

    if (showControls) {
      map.addControl(new mapboxgl.NavigationControl(), "top-right");
      map.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true
        }),
        "top-right"
      );
    }

    if (draggableMarker || markers.length === 0) {
      const newMarker = new mapboxgl.Marker({ color: markerColor, draggable: draggableMarker })
        .setLngLat([location.longitude, location.latitude])
        .addTo(map);

      setMainMarker(newMarker);

      if (draggableMarker) {
        newMarker.on("dragend", () => {
          const lngLat = newMarker.getLngLat();
          const newLocation = { latitude: lngLat.lat, longitude: lngLat.lng };
          setLocation(newLocation);
          if (onLocationChange) onLocationChange(newLocation);
        });
      }
    }

    if (markers.length > 0) {
      markers.forEach(markerData => {
        try {
          const marker = new mapboxgl.Marker({ color: markerData.color || markerColor })
            .setLngLat([markerData.longitude, markerData.latitude]);
          if (markerData.popupContent) {
            marker.setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(markerData.popupContent));
          }
          marker.addTo(map);
          markersRef.current.push(marker);
        } catch (error) {
          console.error("Error adding marker:", error);
        }
      });
    }

    return () => {
      map.remove();
      if (mainMarker) mainMarker.remove();
      markersRef.current.forEach(marker => marker.remove());
    };
  }, []);

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation = { latitude, longitude };
          setLocation(newLocation);
          if (onLocationChange) onLocationChange(newLocation);
          if (mapInstance.current) {
            mapInstance.current.flyTo({
              center: [longitude, latitude],
              zoom: initialZoom,
              essential: true
            });
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          alert(`Could not get your location: ${error.message}`);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      alert("Geolocation not supported by this browser.");
    }
  };

  const handleSendSOS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          import("../services/socketService").then(({ sendSOSAlert }) => {
            sendSOSAlert({ longitude, latitude });
            alert("SOS alert sent!");
          }).catch(error => {
            console.error("Error importing socket service:", error);
            alert("Failed to send SOS alert.");
          });
        },
        (error) => {
          console.error("Error getting location for SOS:", error);
          alert(`Could not get your location: ${error.message}`);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      alert("Geolocation not supported by this browser.");
    }
  };

  const stopRealTimeTracking = () => {
    if (watchPositionId.current) {
      navigator.geolocation.clearWatch(watchPositionId.current);
      watchPositionId.current = null;
    }
    setIsTracking(false);
  };

  return (
    <div style={{ position: "relative", width: width, height: height }}>
      {/* Map container */}
      <div
        ref={mapContainer}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "8px"
        }}
      />

      {/* Buttons */}
      <div style={{
        position: "absolute",
        bottom: "20px",
        left: "20px",
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        gap: "10px"
      }}>
        {showSOSButton && (
          <button
            onClick={handleSendSOS}
            style={{
              padding: "10px 20px",
              backgroundColor: "#FF0000",
              color: "white",
              borderRadius: "8px",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
              transition: "0.3s"
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v8M12 18v4M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M2 12h8M18 12h4M4.93 19.07l4.24-4.24M14.83 9.17l4.24-4.24"></path>
            </svg>
            SOS
          </button>
        )}

        {enableRealTimeTracking ? (
          <button
            onClick={stopRealTimeTracking}
            style={{
              padding: "8px 12px",
              backgroundColor: "#4285F4",
              color: "white",
              borderRadius: "8px",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.3)"
            }}
          >
            Stop Tracking
          </button>
        ) : (
          <button
            onClick={handleLocateMe}
            style={{
              padding: "8px 12px",
              backgroundColor: "#FF3A3A",
              color: "white",
              borderRadius: "8px",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.3)"
            }}
          >
            Locate Me
          </button>
        )}
      </div>
    </div>
  );
};

export default MapComponent;
