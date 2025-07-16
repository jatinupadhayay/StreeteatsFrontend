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
  playNotificationSound: () => void
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { user, userRole } = useAuth()
  const { toast } = useToast()
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)

  useEffect(() => {
    const notificationAudio = new Audio("/sounds/order-alert.mp3")
    notificationAudio.preload = "auto"
    setAudio(notificationAudio)

    return () => {
      notificationAudio.pause()
      notificationAudio.remove()
    }
  }, [])

  useEffect(() => {
    if (!user) return

    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000", {
      auth: {
        token: localStorage.getItem("streetEatsToken"),
        userId: user.id,
        userRole: userRole,
      },
      transports: ["websocket"],
      reconnection: true,
    })

    // Connection events
    socketInstance.on("connect", () => {
      setIsConnected(true)
      if (userRole === "vendor") {
        socketInstance.emit("join-vendor-room", `vendor-${user.id}`)
      } else if (userRole === "delivery") {
        socketInstance.emit("join-delivery-room", `delivery-${user.id}`)
      }
    })

    socketInstance.on("disconnect", () => setIsConnected(false))

    // Notification events
    socketInstance.on("new-order", (orderData) => {
      if (userRole === "vendor") {
        showToast({
          title: "🔔 New Order!",
          description: `Order #${orderData.orderNumber} received`,
          sound: true,
        })
      }
    })

    socketInstance.on("order-status-updated", (data) => {
      const { order, status, previousStatus } = data
      
      // Vendor notifications
      if (userRole === "vendor") {
        if (status === "confirmed") {
          showToast({
            title: "✅ Order Confirmed",
            description: `Order #${order.orderNumber} confirmed`,
            sound: true,
          })
        }
        else if (status === "preparing") {
          showToast({
            title: "👨‍🍳 Preparing Order",
            description: `Started preparing order #${order.orderNumber}`,
            sound: true,
          })
        }
        else if (status === "ready") {
          showToast({
            title: "✅ Order Ready",
            description: `Order #${order.orderNumber} is ready`,
            sound: true,
          })
        }
      }
      
      // Customer notifications
      if (user?.id === order.customerId) {
        if (status === "accepted") {
          showToast({
            title: "👍 Order Accepted",
            description: `Vendor has accepted your order #${order.orderNumber}`,
            sound: true,
          })
        }
        else if (status === "preparing") {
          showToast({
            title: "👨‍🍳 Preparation Started",
            description: `Vendor is preparing your order #${order.orderNumber}`,
            sound: true,
          })
        }
        else if (status === "ready") {
          if (order.orderType === "pickup") {
            showToast({
              title: "✅ Ready for Pickup",
              description: `Your order #${order.orderNumber} is ready`,
              sound: true,
            })
          } else {
            showToast({
              title: "🛵 Ready for Delivery",
              description: `Your order #${order.orderNumber} is ready`,
              sound: true,
            })
          }
        }
        else if (status === "out_for_delivery") {
          showToast({
            title: "🚚 On the Way",
            description: `Delivery partner is coming with order #${order.orderNumber}`,
            sound: true,
          })
        }
        else if (status === "delivered" || status === "picked_up") {
          showToast({
            title: "🎉 Order Completed",
            description: `Order #${order.orderNumber} has been ${status === "delivered" ? "delivered" : "picked up"}`,
            sound: true,
          })
        }
        else if (status === "cancelled") {
          showToast({
            title: "❌ Order Cancelled",
            description: `Order #${order.orderNumber} was cancelled`,
            variant: "destructive",
            sound: true,
          })
        }
      }
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [user, userRole])

  const showToast = ({
    title,
    description,
    variant = "default",
    sound = false
  }: {
    title: string
    description: string
    variant?: "default" | "destructive"
    sound?: boolean
  }) => {
    toast({
      title,
      description,
      variant,
    })
    if (sound && audio) {
      audio.currentTime = 0
      audio.play().catch(console.error)
    }
  }

  const playNotificationSound = () => {
    if (audio) {
      audio.currentTime = 0
      audio.play().catch(console.error)
    }
  }

  const joinOrderRoom = (orderId: string) => {
    socket?.emit("join-order-room", `order-${orderId}`)
  }

  const joinVendorRoom = (vendorId: string) => {
    socket?.emit("join-vendor-room", `vendor-${vendorId}`)
  }

  const joinDeliveryRoom = (deliveryId: string) => {
    socket?.emit("join-delivery-room", `delivery-${deliveryId}`)
  }

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        joinOrderRoom,
        joinVendorRoom,
        joinDeliveryRoom,
        playNotificationSound,
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