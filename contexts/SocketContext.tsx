"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { io, type Socket } from "socket.io-client"
import { useAuth } from "./AuthContext"
import { useToast } from "@/hooks/use-toast"

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  joinOrderRoom: (orderId: string) => void
  joinVendorRoom: (vendorId: string) => void
  joinDeliveryRoom: (deliveryId: string) => void
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { user, userRole } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      // Connect to socket server
      const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000", {
        auth: {
          token: localStorage.getItem("streetEatsToken"),
          userId: user.id,
          userRole: userRole,
        },
      })

      socketInstance.on("connect", () => {
        console.log("Connected to socket server")
        setIsConnected(true)

        // Auto-join user-specific rooms
        if (userRole === "vendor") {
          socketInstance.emit("join-vendor", user.id)
        } else if (userRole === "delivery") {
          socketInstance.emit("join-delivery", user.id)
        }
      })

      socketInstance.on("disconnect", () => {
        console.log("Disconnected from socket server")
        setIsConnected(false)
      })

      // Listen for new orders (Vendor side)
      socketInstance.on("new-order", (orderData) => {
        if (userRole === "vendor") {
          toast({
            title: "🔔 New Order Received!",
            description: `Order #${orderData.orderId} from ${orderData.customerName}`,
          })
          // You can also play a sound or show a modal
          playNotificationSound()
        }
      })

      // Listen for order updates (Customer side)
      socketInstance.on("order-updated", (orderData) => {
        if (userRole === "customer") {
          toast({
            title: "📦 Order Update",
            description: `Your order is now ${orderData.status}`,
          })
        }
      })

      // Listen for delivery updates (All sides)
      socketInstance.on("delivery-updated", (deliveryData) => {
        toast({
          title: "🚚 Delivery Update",
          description: `Delivery status: ${deliveryData.status}`,
        })
      })

      // Listen for delivery task updates (Delivery partner side)
      socketInstance.on("delivery-task-updated", (taskData) => {
        if (userRole === "delivery") {
          toast({
            title: "📋 New Delivery Task",
            description: `New delivery assigned: ${taskData.orderId}`,
          })
        }
      })

      setSocket(socketInstance)

      return () => {
        socketInstance.disconnect()
      }
    }
  }, [user, userRole])

  const joinOrderRoom = (orderId: string) => {
    if (socket) {
      socket.emit("join-order", orderId)
    }
  }

  const joinVendorRoom = (vendorId: string) => {
    if (socket) {
      socket.emit("join-vendor", vendorId)
    }
  }

  const joinDeliveryRoom = (deliveryId: string) => {
    if (socket) {
      socket.emit("join-delivery", deliveryId)
    }
  }

  const playNotificationSound = () => {
    // Play notification sound
    const audio = new Audio("/notification-sound.mp3")
    audio.play().catch(() => {
      // Handle audio play failure (browser restrictions)
    })
  }

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        joinOrderRoom,
        joinVendorRoom,
        joinDeliveryRoom,
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider")
  }
  return context
}
