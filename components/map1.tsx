"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

interface MapProps {
  userLocation: [number, number]
  vendorLocation: [number, number]
  onPositionChange?: (lat: number, lng: number) => void
  zoom?: number
  draggable?: boolean
}

export default function Map({
  userLocation,
  vendorLocation,
  onPositionChange,
  zoom = 13,
  draggable = false
}: MapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const userMarkerRef = useRef<L.Marker | null>(null)
  const vendorMarkerRef = useRef<L.Marker | null>(null)
  const routeLineRef = useRef<L.Polyline | null>(null)

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) {
      // Calculate center between user and vendor
      const centerLat = (userLocation[0] + vendorLocation[0]) / 2
      const centerLng = (userLocation[1] + vendorLocation[1]) / 2
      
      mapRef.current = L.map("map-container").setView([centerLat, centerLng], zoom)
      
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current)

      // Create custom icons
      const userIcon = L.icon({
        iconUrl: '/marker-icon-blue.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
      })
      
      const vendorIcon = L.icon({
        iconUrl: '/marker-icon-red.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
      })

      // Create user marker
      const userMarker = L.marker(userLocation, {
        draggable,
        icon: userIcon
      }).addTo(mapRef.current)
      .bindPopup("Your location")
      .openPopup()

      // Create vendor marker
      const vendorMarker = L.marker(vendorLocation, {
        icon: vendorIcon
      }).addTo(mapRef.current)
      .bindPopup("Vendor location")
      .openPopup()

      // Draw route line
      const routeLine = L.polyline([userLocation, vendorLocation], {
        color: 'blue',
        weight: 4,
        dashArray: '5, 10'
      }).addTo(mapRef.current)

      // Handle drag events
      if (draggable && onPositionChange) {
        userMarker.on("dragend", (e) => {
          const { lat, lng } = e.target.getLatLng()
          onPositionChange(lat, lng)
          
          // Update route line
          routeLine.setLatLngs([[lat, lng], vendorLocation])
        })
      }

      // Save references
      userMarkerRef.current = userMarker
      vendorMarkerRef.current = vendorMarker
      routeLineRef.current = routeLine
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // Update positions when locations change
  useEffect(() => {
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(userLocation)
    }
    if (vendorMarkerRef.current) {
      vendorMarkerRef.current.setLatLng(vendorLocation)
    }
    if (routeLineRef.current) {
      routeLineRef.current.setLatLngs([userLocation, vendorLocation])
    }
    if (mapRef.current) {
      const centerLat = (userLocation[0] + vendorLocation[0]) / 2
      const centerLng = (userLocation[1] + vendorLocation[1]) / 2
      mapRef.current.setView([centerLat, centerLng])
    }
  }, [userLocation, vendorLocation])

  return <div id="map-container" className="w-full h-full rounded-lg" />
}