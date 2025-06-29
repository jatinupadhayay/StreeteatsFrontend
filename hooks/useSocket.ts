"use client"

import { useEffect, useRef } from "react"
import { io, type Socket } from "socket.io-client"
import { useAuth } from "@/contexts/AuthContext"

export function useSocket() {
  const socketRef = useRef<Socket | null>(null)
  const { user, userRole } = useAuth()

  useEffect(() => {
    if (user) {
      // Connect to socket server
      const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000"
      socketRef.current = io(SOCKET_URL, {
        auth: {
          token: localStorage.getItem("streetEatsToken"),
          userId: user.id,
          role: userRole,
        },
      })

      // Join role-specific room
      socketRef.current.emit("join-room", `${userRole}-${user.id}`)

      return () => {
        socketRef.current?.disconnect()
      }
    }
  }, [user, userRole])

  return socketRef.current
}

// Hook for real-time order updates
export function useOrderUpdates(onOrderUpdate: (data: any) => void) {
  const socket = useSocket()

  useEffect(() => {
    if (socket) {
      socket.on("order-status-updated", onOrderUpdate)
      socket.on("new-order", onOrderUpdate)
      socket.on("order-cancelled", onOrderUpdate)

      return () => {
        socket.off("order-status-updated", onOrderUpdate)
        socket.off("new-order", onOrderUpdate)
        socket.off("order-cancelled", onOrderUpdate)
      }
    }
  }, [socket, onOrderUpdate])
}

// Hook for real-time delivery tracking
export function useDeliveryTracking(orderId: string, onLocationUpdate: (data: any) => void) {
  const socket = useSocket()

  useEffect(() => {
    if (socket && orderId) {
      socket.emit("track-order", orderId)
      socket.on("delivery-location-update", onLocationUpdate)

      return () => {
        socket.off("delivery-location-update", onLocationUpdate)
      }
    }
  }, [socket, orderId, onLocationUpdate])
}
