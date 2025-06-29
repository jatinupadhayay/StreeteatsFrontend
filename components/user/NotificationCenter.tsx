"use client"

import { useState } from "react"
import { Bell, Package, Gift, Star, Truck, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const notifications = [
  {
    id: 1,
    type: "order",
    title: "Order Confirmed",
    message: "Your order from Spice Street Corner has been confirmed",
    time: "2 min ago",
    read: false,
    icon: Package,
  },
  {
    id: 2,
    type: "delivery",
    title: "Out for Delivery",
    message: "Your order is on the way! Expected delivery in 15 mins",
    time: "5 min ago",
    read: false,
    icon: Truck,
  },
  {
    id: 3,
    type: "reward",
    title: "Reward Points Earned",
    message: "You earned 50 points from your last order",
    time: "1 hour ago",
    read: true,
    icon: Star,
  },
  {
    id: 4,
    type: "promotion",
    title: "Special Offer",
    message: "Get 20% off on your next order from Delhi Chaat Corner",
    time: "2 hours ago",
    read: true,
    icon: Gift,
  },
]

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const [notificationList, setNotificationList] = useState(notifications)

  const unreadCount = notificationList.filter((n) => !n.read).length

  const markAsRead = (id: number) => {
    setNotificationList((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllAsRead = () => {
    setNotificationList((prev) => prev.map((n) => ({ ...n, read: true })))
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
            </div>
          </div>
        </div>
      )}
    </>
  )
}
