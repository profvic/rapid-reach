import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// 📍 Port Harcourt (lng, lat)
const PORT_HARCOURT = [7.0498, 4.8156];

const MapComponent = ({
  initialCenter = PORT_HARCOURT,
  initialZoom = 15,
  markerColor = "red",
  onLocationChange,
  height = "400px",
  width = "100%",
  showControls = true,
  draggableMarker = false,
  markers = [],
  showSOSButton = true
}) => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const mainMarkerRef = useRef(null);
  const externalMarkersRef = useRef([]);
  const geolocateControlRef = useRef(null);

  const [location, setLocation] = useState({
    latitude: initialCenter[1],
    longitude: initialCenter[0]
  });

  /* ------------------------------------
     Initialize Map (runs once)
  ------------------------------------ */
  useEffect(() => {
    if (!mapContainer.current) return;

    const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    if (!token) {
      console.error("❌ Mapbox token missing");
      return;
    }

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [location.longitude, location.latitude],
      zoom: initialZoom
    });

    mapRef.current = map;

    /* ---------- Controls ---------- */
    if (showControls) {
      map.addControl(new mapboxgl.NavigationControl(), "top-right");

      const geolocate = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true,
        showAccuracyCircle: true
      });

      geolocateControlRef.current = geolocate;
      map.addControl(geolocate, "top-right");

      // OPTIONAL: auto-trigger location on load
      // map.on("load", () => geolocate.trigger());
    }

    /* ---------- Main Marker ---------- */
    const marker = new mapboxgl.Marker({
      color: markerColor,
      draggable: draggableMarker
    })
      .setLngLat([location.longitude, location.latitude])
      .addTo(map);

    mainMarkerRef.current = marker;

    if (draggableMarker) {
      marker.on("dragend", () => {
        const lngLat = marker.getLngLat();
        const newLoc = { latitude: lngLat.lat, longitude: lngLat.lng };
        setLocation(newLoc);
        if (onLocationChange) onLocationChange(newLoc);
      });
    }

    return () => {
      map.remove();
      marker.remove();
      externalMarkersRef.current.forEach(m => m.remove());
    };
  }, []);

  /* ------------------------------------
     Recenter map when location changes
  ------------------------------------ */
  useEffect(() => {
    if (!mapRef.current || !mainMarkerRef.current) return;

    mapRef.current.flyTo({
      center: [location.longitude, location.latitude],
      zoom: initialZoom,
      essential: true
    });

    mainMarkerRef.current.setLngLat([
      location.longitude,
      location.latitude
    ]);
  }, [location]);

  /* ------------------------------------
     External markers (incidents/responders)
  ------------------------------------ */
  useEffect(() => {
    if (!mapRef.current) return;

    externalMarkersRef.current.forEach(m => m.remove());
    externalMarkersRef.current = [];

    markers.forEach(data => {
      const m = new mapboxgl.Marker({ color: data.color || markerColor })
        .setLngLat([data.longitude, data.latitude])
        .addTo(mapRef.current);

      if (data.popupContent) {
        m.setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(data.popupContent)
        );
      }

      externalMarkersRef.current.push(m);
    });
  }, [markers]);

  /* ------------------------------------
     Locate Me (manual button)
  ------------------------------------ */
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        const newLoc = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        };
        setLocation(newLoc);
        if (onLocationChange) onLocationChange(newLoc);
      },
      err => alert(err.message),
      { enableHighAccuracy: true }
    );
  };

  /* ------------------------------------
     SOS Button
  ------------------------------------ */
  const handleSendSOS = async () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude, longitude } = pos.coords;
        const { sendSOSAlert } = await import("../services/socketService");
        sendSOSAlert({ latitude, longitude });
        alert("🚨 SOS alert sent");
      },
      err => alert(err.message)
    );
  };

  return (
    <div style={{ position: "relative", width, height }}>
      {/* Map */}
      <div
        ref={mapContainer}
        style={{ width: "100%", height: "100%", borderRadius: "8px" }}
      />

      {/* Buttons */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: 20,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          zIndex: 5
        }}
      >
        {showSOSButton && (
          <button onClick={handleSendSOS} style={btn("#ff0000")}>
            🚨 SOS
          </button>
        )}

        <button onClick={handleLocateMe} style={btn("#ff3a3a")}>
          📍 Locate Me
        </button>
      </div>
    </div>
  );
};

/* ------------------------------------
   Button style helper
------------------------------------ */
const btn = bg => ({
  backgroundColor: bg,
  color: "#fff",
  border: "none",
  padding: "10px 14px",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: "bold",
  boxShadow: "0 4px 8px rgba(0,0,0,0.3)"
});

export default MapComponent;
