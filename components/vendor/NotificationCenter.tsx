"use client"

import { useState, useEffect } from "react"
import { Bell, Package, Gift, Star, Truck, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useSocket } from "@/contexts/SocketContext"
import { useAuth } from "@/contexts/AuthContext"

interface Notification {
  id: string
  type: "order" | "delivery" | "reward" | "promotion"
  title: string
  message: string
  time: string
  read: boolean
  icon: any
  orderId?: string
}

export default function NotificationCenter() {
  const { socket, playNotificationSound } = useSocket()
  const { user, userRole } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [notificationList, setNotificationList] = useState<Notification[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Format time as "X min ago"
  const formatTime = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
    return `${Math.floor(diffInMinutes / 1440)} days ago`
  }

  // Handle new order notifications for vendors
  useEffect(() => {
    if (!socket || userRole !== "vendor") return

    const handleNewOrder = (orderData: any) => {
      const newNotification: Notification = {
        id: `order-${orderData.id}-${Date.now()}`,
        type: "order",
        title: "New Order Received!",
        message: `Order #${orderData.orderNumber || orderData.id.slice(-6)} from ${orderData.customer.name}`,
        time: formatTime(new Date()),
        read: false,
        icon: Package,
        orderId: orderData.id
      }

      setNotificationList(prev => [newNotification, ...prev])
      playNotificationSound()
      setLastUpdate(new Date())
    }

    socket.on("new-order", handleNewOrder)

    return () => {
      socket.off("new-order", handleNewOrder)
    }
  }, [socket, userRole, playNotificationSound])

  // Handle order status updates for customers
  useEffect(() => {
    if (!socket || userRole !== "customer") return

    const handleOrderUpdate = (orderData: any) => {
      let title = ""
      let message = ""
      
      switch(orderData.status) {
        case "accepted":
          title = "Order Accepted"
          message = `Your order #${orderData.orderNumber} has been accepted by the restaurant`
          break
        case "preparing":
          title = "Order Being Prepared"
          message = `Your order #${orderData.orderNumber} is now being prepared`
          break
        case "ready":
          title = "Order Ready"
          message = `Your order #${orderData.orderNumber} is ready for ${orderData.orderType === "pickup" ? "pickup" : "delivery"}`
          break
        case "out_for_delivery":
          title = "Out for Delivery"
          message = `Your order #${orderData.orderNumber} is on its way!`
          break
        case "delivered":
          title = "Order Delivered"
          message = `Your order #${orderData.orderNumber} has been delivered`
          break
        default:
          return
      }

      const newNotification: Notification = {
        id: `order-update-${orderData.id}-${Date.now()}`,
        type: "order",
        title,
        message,
        time: formatTime(new Date()),
        read: false,
        icon: orderData.status === "delivered" ? Truck : Package,
        orderId: orderData.id
      }

      setNotificationList(prev => [newNotification, ...prev])
      playNotificationSound()
      setLastUpdate(new Date())
    }

    socket.on("order-updated", handleOrderUpdate)

    return () => {
      socket.off("order-updated", handleOrderUpdate)
    }
  }, [socket, userRole, playNotificationSound])

  // Handle delivery updates for delivery personnel
  useEffect(() => {
    if (!socket || userRole !== "delivery") return

    const handleDeliveryUpdate = (deliveryData: any) => {
      const newNotification: Notification = {
        id: `delivery-${deliveryData.id}-${Date.now()}`,
        type: "delivery",
        title: "New Delivery Assignment",
        message: `Order #${deliveryData.orderNumber} to ${deliveryData.customerAddress}`,
        time: formatTime(new Date()),
        read: false,
        icon: Truck,
        orderId: deliveryData.id
      }

      setNotificationList(prev => [newNotification, ...prev])
      playNotificationSound()
      setLastUpdate(new Date())
    }

    socket.on("delivery-task-updated", handleDeliveryUpdate)

    return () => {
      socket.off("delivery-task-updated", handleDeliveryUpdate)
    }
  }, [socket, userRole, playNotificationSound])

  const unreadCount = notificationList.filter((n) => !n.read).length

  const markAsRead = (id: string) => {
    setNotificationList(prev => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllAsRead = () => {
    setNotificationList(prev => prev.map((n) => ({ ...n, read: true })))
  }

  const toggleNotifications = () => {
    setIsOpen(!isOpen)
  }

  return (
    <>
      {/* Notification Button */}
      <Button size="sm" variant="ghost" className="relative" onClick={toggleNotifications}>
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-[1.2rem] h-5">
            {unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setIsOpen(false)}>
          <div
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform duration-300 ease-in-out"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Notifications</h2>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                    Mark all read
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto h-full pb-16">
              {notificationList.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <Bell className="w-12 h-12 mb-4" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {notificationList.map((notification) => {
                    const IconComponent = notification.icon
                    return (
                      <div
                        key={notification.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          notification.read ? "bg-gray-50" : "bg-blue-50 border-blue-200"
                        }`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start space-x-3">
                          <div
                            className={`p-2 rounded-full ${
                              notification.type === "order"
                                ? "bg-green-100 text-green-600"
                                : notification.type === "delivery"
                                  ? "bg-blue-100 text-blue-600"
                                  : notification.type === "reward"
                                    ? "bg-yellow-100 text-yellow-600"
                                    : "bg-purple-100 text-purple-600"
                            }`}
                          >
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{notification.title}</h4>
                            <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-400 mt-2">{notification.time}</p>
                          </div>
                          {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}