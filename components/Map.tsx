"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

interface MapProps {
  center: [number, number]
  onPositionChange?: (lat: number, lng: number) => void
  zoom?: number
  draggable?: boolean
}

export default function Map({
  center,
  onPositionChange,
  zoom = 15,
  draggable = true
}: MapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map("map-container").setView(center, zoom)
      
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current)

      // Create marker
      const marker = L.marker(center, {
        draggable,
        icon: L.icon({
          iconUrl: '/marker-icon.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowUrl: '/marker-shadow.png',
          shadowSize: [41, 41]
        })
      }).addTo(mapRef.current)

      if (draggable && onPositionChange) {
        marker.on("dragend", (e) => {
          const { lat, lng } = e.target.getLatLng()
          onPositionChange(lat, lng)
        })
      }

      markerRef.current = marker
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // Update marker position when center changes
  useEffect(() => {
    if (markerRef.current && mapRef.current) {
      markerRef.current.setLatLng(center)
      if (!draggable) {
        mapRef.current.setView(center, zoom)
      }
    }
  }, [center, zoom, draggable])

  return <div id="map-container" className="w-full h-full" />
}