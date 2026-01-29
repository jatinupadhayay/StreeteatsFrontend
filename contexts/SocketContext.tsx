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
  leaveOrderRoom: (orderId: string) => void
  joinVendorRoom: (vendorId: string) => void
  joinDeliveryRoom: (deliveryId: string) => void
  joinCustomerRoom: (customerId: string) => void
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
    // Initialize audio for notifications
    const notificationAudio = new Audio("/sounds/order-alert.mp3")
    notificationAudio.preload = "auto"
    setAudio(notificationAudio)

    return () => {
      notificationAudio.pause()
      notificationAudio.remove()
    }
  }, [])

  useEffect(() => {
    if (!user) {
      console.log('No user found, skipping socket connection')
      return
    }

    console.log('Initializing socket connection...')

    // Improved Socket URL resolution for mobile/network access
    let socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL

    if (!socketUrl) {
      if (typeof window !== 'undefined') {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || ""
        if (apiBase.startsWith("http")) {
          // Extract origin from API URL (e.g., http://192.168.1.5:5000/api -> http://192.168.1.5:5000)
          try {
            const url = new URL(apiBase)
            socketUrl = url.origin
          } catch (e) {
            socketUrl = "https://streeteatsbackend.onrender.com"
          }
        } else {
          socketUrl = "https://streeteatsbackend.onrender.com"
        }
      } else {
        socketUrl = "https://streeteatsbackend.onrender.com"
      }
    }

    console.log(`Connecting to socket at: ${socketUrl}`)

    const socketInstance = io(socketUrl, {
      auth: {
        token: localStorage.getItem("streetEatsToken"),
        userId: user.id || user._id, // Handle both id formats
        userRole: userRole,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 20, // Increased for mobile stability
      reconnectionDelay: 2000,
      timeout: 20000,
    })

    // Connection events
    socketInstance.on("connect", () => {
      console.log("✅ Socket connected successfully")
      setIsConnected(true)

      // Join appropriate room based on user role - try multiple event names
      if (userRole === "vendor") {
        socketInstance.emit("join-vendor", `vendor-${user.id}`)
        socketInstance.emit("join_vendor_room", `vendor-${user.id}`)
        console.log(`Joined vendor room: vendor-${user.id}`)
      } else if (userRole === "delivery") {
        socketInstance.emit("join-delivery", `delivery-${user.id}`)
        socketInstance.emit("join_delivery_room", `delivery-${user.id}`)
        console.log(`Joined delivery room: delivery-${user.id}`)
      } else if (userRole === "customer") {
        socketInstance.emit("join-customer", `customer-${user.id}`)
        socketInstance.emit("join_customer_room", `customer-${user.id}`)
        console.log(`Joined customer room: customer-${user.id}`)
      }
    })

    socketInstance.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason)
      setIsConnected(false)
    })

    socketInstance.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error)
      setIsConnected(false)
    })

    socketInstance.on("reconnect", (attemptNumber) => {
      console.log(`🔗 Socket reconnected after ${attemptNumber} attempts`)
      setIsConnected(true)
    })

    socketInstance.on("reconnect_attempt", (attemptNumber) => {
      console.log(`🔄 Socket reconnection attempt: ${attemptNumber}`)
    })

    socketInstance.on("reconnect_error", (error) => {
      console.error("❌ Socket reconnection error:", error)
    })

    socketInstance.on("reconnect_failed", () => {
      console.error("❌ Socket reconnection failed")
      setIsConnected(false)
    })

    // Notification events - FIXED EVENT NAMES
    socketInstance.on("new_order", (orderData) => {
      console.log("📦 New order received:", orderData)
      if (userRole === "vendor") {
        const orderNumber = orderData.orderNumber || (orderData.orderId ? `#${orderData.orderId.slice(-6)}` : "N/A")
        showToast({
          title: "🔔 New Order!",
          description: `Order ${orderNumber} received`,
          sound: true,
        })
      }
    })

    // Also listen to new-order (with hyphen) for compatibility
    socketInstance.on("new-order", (orderData) => {
      console.log("📦 New order received (hyphen):", orderData)
      if (userRole === "vendor") {
        const orderNumber = orderData.orderNumber || (orderData.orderId ? `#${orderData.orderId.slice(-6)}` : "N/A")
        showToast({
          title: "🔔 New Order!",
          description: `Order ${orderNumber} received`,
          sound: true,
        })
      }
    })

    socketInstance.on("order_status_updated", (data) => {
      console.log("🔄 Order status updated:", data)
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
      if (userRole === "customer" && user?.id === order.customerId) {
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

      // Delivery person notifications
      if (userRole === "delivery") {
        if (status === "ready" && order.orderType === "delivery") {
          showToast({
            title: "📦 New Delivery Available",
            description: `Order #${order.orderNumber} is ready for delivery`,
            sound: true,
          })
        }
      }
    })

    // Delivery assignment notifications - FIXED EVENT NAME
    socketInstance.on("delivery_assigned", (data) => {
      console.log("🚗 Delivery assigned:", data)
      const { order, deliveryPerson } = data

      if (userRole === "customer" && user?.id === order.customerId) {
        showToast({
          title: "🚗 Delivery Partner Assigned",
          description: `${deliveryPerson.name} is delivering your order`,
          sound: true,
        })
      }

      if (userRole === "delivery" && user?.id === deliveryPerson.id) {
        showToast({
          title: "🎯 New Delivery Assignment",
          description: `You have been assigned to order #${order.orderNumber}`,
          sound: true,
        })
      }
    })

    // Order location updates
    socketInstance.on("order_location_updated", (data) => {
      console.log("📍 Order location updated:", data)
      // This can be used for real-time tracking
    })

    // Debug: Log all events
    socketInstance.onAny((eventName, ...args) => {
      console.log(`📡 Socket event received: ${eventName}`, args)
    })

    setSocket(socketInstance)

    return () => {
      console.log("🧹 Cleaning up socket connection")
      socketInstance.off("new_order")
      socketInstance.off("new-order")
      socketInstance.off("order_status_updated")
      socketInstance.off("order-status-updated")
      socketInstance.disconnect()
      setSocket(null)
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
    console.log(`Showing toast: ${title} - ${description}`)
    toast({
      title,
      description,
      variant,
    })

    if (sound && audio) {
      // Play notification sound with error handling
      audio.play().catch((error) => {
        console.error("🔇 Failed to play notification sound:", error)
      })
    }
  }

  const playNotificationSound = () => {
    if (audio) {
      audio.currentTime = 0
      audio.play().catch((error) => {
        console.error("🔇 Failed to play notification sound:", error)
      })
    }
  }

  const joinOrderRoom = (orderId: string) => {
    if (socket && isConnected) {
      socket.emit("join_order_room", orderId)
      console.log(`📋 Joined order room: ${orderId}`)
    } else {
      console.warn("⚠️ Socket not connected, cannot join order room")
    }
  }

  const leaveOrderRoom = (orderId: string) => {
    if (socket && isConnected) {
      socket.emit("leave_order_room", orderId)
      console.log(`📋 Left order room: ${orderId}`)
    }
  }

  const joinVendorRoom = (vendorId: string) => {
    if (socket && isConnected) {
      socket.emit("join_vendor_room", `vendor-${vendorId}`)
      console.log(`🏪 Joined vendor room: vendor-${vendorId}`)
    }
  }

  const joinDeliveryRoom = (deliveryId: string) => {
    if (socket && isConnected) {
      socket.emit("join_delivery_room", `delivery-${deliveryId}`)
      console.log(`🚚 Joined delivery room: delivery-${deliveryId}`)
    }
  }

  const joinCustomerRoom = (customerId: string) => {
    if (socket && isConnected) {
      socket.emit("join_customer_room", `customer-${customerId}`)
      console.log(`👤 Joined customer room: customer-${customerId}`)
    }
  }

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        joinOrderRoom,
        leaveOrderRoom,
        joinVendorRoom,
        joinDeliveryRoom,
        joinCustomerRoom,
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