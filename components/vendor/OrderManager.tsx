"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Clock, CheckCircle, AlertTriangle, Phone, MapPin, Loader2, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { Toaster } from "@/components/ui/toaster"
import { useSocket } from "@/contexts/SocketContext"

interface Order {
  id: string
  orderNumber?: string
  customer: {
    _id: string
    name: string
    phone: string
    fullAddress: string
  }
  items: Array<{
    name: string
    quantity: number
    price: number
    customizations?: Record<string, any>
  }>
  pricing: {
    total: number
    subtotal: number
    deliveryFee: number
    taxes: {
      total: number
    }
  }
  status: "placed" | "confirmed" | "accepted" | "preparing" | "ready_for_pickup" | "out_for_delivery" | "ready" | "picked_up" | "delivered" | "rejected" | "cancelled"
  deliveryAddress: {
    street: string
    city: string
    state: string
    pincode: string
    coordinates?: number[]
    type?: string
  }
  orderType: string
  createdAt: string
  specialInstructions?: {
    customer: string
  } | string
  estimatedDeliveryTime?: string
  estimatedPickupTime?: string
}

export default function OrderManager() {
  const { socket, isConnected, playNotificationSound } = useSocket()
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  const [newOrders, setNewOrders] = useState<Order[]>([])
  const [activeOrders, setActiveOrders] = useState<Order[]>([])
  const [completedOrders, setCompletedOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    newOrders: 0,
    activeOrders: 0,
    completedToday: 0,
    todaysRevenue: 0
  })
  const { toast } = useToast()
  const isMounted = useRef(false)

  // Memoized transformation function with safe property access
  const transformOrder = useCallback((order: any): Order => {
    const id = order.id || order._id
    return {
      ...order,
      id,
      orderNumber: order.orderNumber || (id ? id.slice(-6).toUpperCase() : "000000"),
      customer: order.customer || {
        _id: order.userId || "anon",
        name: "Anonymous Customer",
        phone: "N/A",
        fullAddress: order.deliveryAddress?.street || "No Address"
      },
      specialInstructions:
        order.specialInstructions &&
          typeof order.specialInstructions === 'object' &&
          'customer' in order.specialInstructions
          ? order.specialInstructions.customer
          : order.specialInstructions
    }
  }, [])

  // Fetch all orders data
  const fetchOrders = useCallback(async (showLoading: boolean = true) => {
    if (!isMounted.current) return;

    if (showLoading) {
      setIsLoading(true)
    }
    try {
      const [
        newOrdersResponse,
        acceptedOrders,
        preparingOrders,
        readyOrders,
        completedOrdersResponse,
        statsResponse
      ] = await Promise.all([
        api.orders.getVendorOrders({ status: ["confirmed", "placed"] }),
        api.orders.getVendorOrders({ status: "accepted" }),
        api.orders.getVendorOrders({ status: "preparing" }),
        api.orders.getVendorOrders({ status: "ready" }),
        api.orders.getVendorOrders({ status: ["picked_up", "delivered"], limit: 10 }),
        api.vendors.getDashboardStats()
      ])

      setNewOrders((newOrdersResponse.orders || []).map(transformOrder))
      setActiveOrders([
        ...(acceptedOrders.orders || []),
        ...(preparingOrders.orders || []),
        ...(readyOrders.orders || [])
      ].map(transformOrder))

      setCompletedOrders((completedOrdersResponse.orders || []).map(transformOrder))

      setStats({
        newOrders: newOrdersResponse.orders?.length || 0,
        activeOrders: (acceptedOrders.orders?.length || 0) +
          (preparingOrders.orders?.length || 0) +
          (readyOrders.orders?.length || 0),
        completedToday: statsResponse.todayStats?.orders || 0,
        todaysRevenue: statsResponse.todayStats?.revenue || 0
      })
    } catch (error) {
      console.error("Failed to fetch orders:", error)
      showToast("❌ Error", "Failed to fetch orders", "destructive")
    } finally {
      if (showLoading) {
        setIsLoading(false)
      }
    }
  }, [transformOrder])

  // Browser notifications permission
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default")

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission)
      if (Notification.permission === "default") {
        Notification.requestPermission().then(setNotificationPermission)
      }
    }
  }, [])

  const sendBrowserNotification = useCallback((title: string, body: string) => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "/logo.png" })
    }
  }, [])

  // Toast helper with debouncing
  const toastRef = useRef<{ [key: string]: number }>({})
  const showToast = useCallback((title: string, description: string, variant: "default" | "destructive" = "default") => {
    const toastKey = `${title}-${description}`
    const now = Date.now()

    // Debounce similar toasts within 3 seconds
    if (!toastRef.current[toastKey] || now - toastRef.current[toastKey] > 3000) {
      toastRef.current[toastKey] = now
      toast({
        title,
        description,
        variant,
        className: "bg-background text-foreground border",
      })
      playNotificationSound() // Play sound with every toast
      sendBrowserNotification(title, description) // Also send system notification
    }
  }, [toast, playNotificationSound, sendBrowserNotification])
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "placed": return "bg-yellow-100 text-yellow-800"
      case "accepted": return "bg-blue-100 text-blue-800"
      case "preparing": return "bg-orange-100 text-orange-800"
      case "ready": return "bg-green-100 text-green-800"
      case "picked_up": return "bg-gray-100 text-gray-800"
      case "delivered": return "bg-gray-100 text-gray-800"
      case "rejected":
      case "cancelled": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }, [])

  const getStatusText = useCallback((status: string, type?: string) => {
    switch (status) {
      case "placed": return "New Order"
      case "accepted": return "Accepted"
      case "preparing": return "Preparing"
      case "ready": return type === "pickup" ? "Ready for Pickup" : "Ready for Delivery"
      case "picked_up": return "Picked Up"
      case "delivered": return "Delivered"
      case "rejected": return "Rejected"
      case "cancelled": return "Cancelled"
      default: return status
    }
  }, [])

  // Handle socket events with optimistic updates
  useEffect(() => {
    if (!socket) {
      console.log("Socket not initialized")
      return
    }

    console.log("Setting up socket listeners...")

    const handleNewOrder = async (newOrderData: any) => {
      try {
        console.log("📦 Socket: New order received:", newOrderData)

        const orderId = newOrderData.orderId || newOrderData.id || newOrderData._id

        if (!orderId) {
          console.error("No order ID in new order data, fetching all orders")
          fetchOrders(false)
          return
        }

        // Fetch the complete order details
        try {
          const response = await api.orders.getById(orderId)
          if (response.success && response.order) {
            const newOrder = transformOrder(response.order)

            // Add to new orders if not already present
            setNewOrders(prev => {
              const exists = prev.some(o => o.id === orderId)
              if (exists) {
                console.log(`Order ${orderId} already in new orders`)
                return prev
              }
              console.log(`✅ Adding order ${orderId} to new orders immediately`)
              return [newOrder, ...prev]
            })

            // Update stats
            setStats(prev => ({
              ...prev,
              newOrders: prev.newOrders + 1
            }))

            showToast(
              "🆕 New Order",
              `Order #${newOrder.orderNumber} received!`
            )
          } else {
            // Fallback to full fetch if we can't get the order
            console.log("Could not fetch order details, doing full refresh")
            fetchOrders(false)
          }
        } catch (fetchError) {
          console.error("Failed to fetch new order details:", fetchError)
          // Fallback to full fetch
          fetchOrders(false)
        }
      } catch (error) {
        console.error("Error handling new order:", error)
        fetchOrders(false)
      }
    }

    const handleOrderUpdate = async (updateData: any) => {
      try {
        console.log("📡 Socket: Order update received:", updateData)

        const updatedOrder = updateData.order || updateData
        const orderId = updatedOrder.id || updatedOrder._id || updateData.orderId
        const newStatus = updateData.status || updatedOrder.status

        if (!orderId) {
          console.error("No order ID in update data")
          return
        }

        // Fetch full order if we only got partial data
        let fullOrder: Order
        if (!updatedOrder.items || !updatedOrder.pricing) {
          try {
            const response = await api.orders.getById(orderId)
            if (response.success && response.order) {
              fullOrder = transformOrder(response.order)
            } else {
              fullOrder = transformOrder(updatedOrder)
            }
          } catch (fetchError) {
            console.error("Failed to fetch updated order:", fetchError)
            fullOrder = transformOrder(updatedOrder)
          }
        } else {
          fullOrder = transformOrder(updatedOrder)
        }

        const transformed = transformOrder({ ...fullOrder, status: newStatus })

        // Determine which section the order should be in based on status
        const isNewStatus = ["placed", "confirmed"].includes(newStatus)
        const isActiveStatus = ["accepted", "preparing", "ready"].includes(newStatus)
        const isCompletedStatus = ["picked_up", "delivered"].includes(newStatus)
        const isRejectedStatus = ["cancelled", "rejected"].includes(newStatus)

        // Remove from all sections first
        setNewOrders(prev => {
          const filtered = prev.filter(o => o.id !== orderId)
          if (filtered.length !== prev.length) {
            console.log(`Removed order ${orderId} from new orders`)
          }
          return filtered
        })

        setActiveOrders(prev => {
          const filtered = prev.filter(o => o.id !== orderId)
          if (filtered.length !== prev.length) {
            console.log(`Removed order ${orderId} from active orders`)
          }
          return filtered
        })

        setCompletedOrders(prev => {
          const filtered = prev.filter(o => o.id !== orderId)
          if (filtered.length !== prev.length) {
            console.log(`Removed order ${orderId} from completed orders`)
          }
          return filtered
        })

        // Add to appropriate section based on new status
        if (isNewStatus) {
          setNewOrders(prev => {
            console.log(`✅ Adding order ${orderId} to new orders`)
            return [transformed, ...prev]
          })
        } else if (isActiveStatus) {
          setActiveOrders(prev => {
            console.log(`✅ Adding order ${orderId} to active orders`)
            return [transformed, ...prev]
          })
        } else if (isCompletedStatus) {
          setCompletedOrders(prev => {
            console.log(`✅ Adding order ${orderId} to completed orders`)
            return [transformed, ...prev.slice(0, 9)]
          })
        } else if (isRejectedStatus) {
          console.log(`Order ${orderId} was ${newStatus}, not adding to any section`)
        }

        // Update stats
        setStats(prev => {
          // Calculate current counts before modification
          const wasNew = newOrders.some(o => o.id === orderId);
          const wasActive = activeOrders.some(o => o.id === orderId);
          const wasCompleted = completedOrders.some(o => o.id === orderId);

          let newOrdersChange = 0;
          let activeOrdersChange = 0;
          let completedTodayChange = 0;
          let todaysRevenueChange = 0;

          // Adjust counts based on where the order was and where it's going
          if (wasNew && !isNewStatus) newOrdersChange--;
          if (wasActive && !isActiveStatus) activeOrdersChange--;
          if (wasCompleted && !isCompletedStatus) {
            completedTodayChange--;
            todaysRevenueChange -= transformed.pricing.total; // Subtract if it was completed and is no longer
          }

          if (isNewStatus && !wasNew) newOrdersChange++;
          if (isActiveStatus && !wasActive) activeOrdersChange++;
          if (isCompletedStatus && !wasCompleted) {
            completedTodayChange++;
            todaysRevenueChange += transformed.pricing.total; // Add if it's now completed
          }

          return {
            newOrders: Math.max(0, prev.newOrders + newOrdersChange),
            activeOrders: Math.max(0, prev.activeOrders + activeOrdersChange),
            completedToday: Math.max(0, prev.completedToday + completedTodayChange),
            todaysRevenue: Math.max(0, prev.todaysRevenue + todaysRevenueChange)
          };
        });

        // Show appropriate toast
        const statusText = getStatusText(newStatus, fullOrder.orderType)

        let icon = "🔄"
        switch (newStatus) {
          case "accepted": icon = "✅"; break
          case "preparing": icon = "👨‍🍳"; break
          case "ready": icon = "📦"; break
          case "picked_up": icon = "🚚"; break
          case "delivered": icon = "🎉"; break
          case "cancelled":
          case "rejected": icon = "❌"; break
        }

        showToast(
          `${icon} Order Status`,
          `Order #${transformed.orderNumber} is now ${statusText}`
        )
      } catch (error) {
        console.error("Error handling order update:", error)
      }
    }

    const handleOrderCompleted = (completedOrder: Order) => {
      try {
        console.log("Order completed:", completedOrder)
        const transformed = transformOrder(completedOrder)

        // Remove from active orders
        setActiveOrders(prev => prev.filter(o => o.id !== completedOrder.id))

        // Add to completed orders (limit to 10 most recent)
        setCompletedOrders(prev => [transformed, ...prev.slice(0, 9)])

        // Update stats
        setStats(prev => ({
          ...prev,
          completedToday: prev.completedToday + 1,
          todaysRevenue: prev.todaysRevenue + completedOrder.pricing.total,
          activeOrders: Math.max(0, prev.activeOrders - 1)
        }))

        showToast(
          "✅ Order Completed",
          `Order #${transformed.orderNumber} completed`
        )
      } catch (error) {
        console.error("Error handling completed order:", error)
      }
    }

    // Set up listeners with error handling - listen to multiple event names for compatibility
    try {
      socket.on('new-order', handleNewOrder)
      socket.on('new_order', handleNewOrder) // Alternative event name
      socket.on('order-updated', handleOrderUpdate)
      socket.on('order_updated', handleOrderUpdate) // Alternative event name
      socket.on('order_status_updated', handleOrderUpdate) // Another alternative
      socket.on('order-completed', handleOrderCompleted)
      socket.on('order_completed', handleOrderCompleted) // Alternative event name
      socket.on('reconnect', () => {
        console.log('Socket reconnected, refreshing data...')
        fetchOrders()
      })
      console.log("Socket listeners registered successfully")
    } catch (error) {
      console.error("Error setting up socket listeners:", error)
    }

    return () => {
      console.log("Cleaning up socket listeners")
      socket.off('new-order', handleNewOrder)
      socket.off('new_order', handleNewOrder)
      socket.off('order-updated', handleOrderUpdate)
      socket.off('order_updated', handleOrderUpdate)
      socket.off('order_status_updated', handleOrderUpdate)
      socket.off('order-completed', handleOrderCompleted)
      socket.off('order_completed', handleOrderCompleted)
      socket.off('reconnect')
    }
  }, [socket, transformOrder, showToast, fetchOrders, getStatusText])

  // Initial data load and setup
  useEffect(() => {
    isMounted.current = true
    // Initial fetch with loading indicator
    fetchOrders(true)

    // Aggressive polling to ensure updates - poll every 5 seconds silently
    const pollingInterval = setInterval(() => {
      if (isMounted.current) {
        // Fetch without showing loading indicator for smooth updates
        fetchOrders(false)
      }
    }, 5000) // Poll every 5 seconds to ensure real-time feel

    return () => {
      isMounted.current = false
      clearInterval(pollingInterval)
    }
  }, [fetchOrders])

  // Optimistic status updates with immediate UI refresh
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId)

    // IMMEDIATE optimistic update - happens before API call
    try {
      switch (newStatus) {
        case "accepted":
          const order = newOrders.find(o => o.id === orderId)
          if (order) {
            console.log("IMMEDIATELY moving order from new to active:", orderId)
            // Force immediate state update
            setNewOrders(prev => {
              const filtered = prev.filter(o => o.id !== orderId)
              console.log(`✅ Removed order ${orderId} from new orders immediately`)
              return filtered
            })
            setActiveOrders(prev => {
              const updated = [{ ...order, status: newStatus as Order['status'] }, ...prev]
              console.log(`✅ Added order ${orderId} to active orders immediately`)
              return updated
            })
            setStats(prev => ({
              ...prev,
              newOrders: Math.max(0, prev.newOrders - 1),
              activeOrders: prev.activeOrders + 1
            }))

            // Force a re-render by updating a timestamp
            console.log("Order moved successfully - UI should update now")
          } else {
            console.warn(`Order ${orderId} not found in new orders`)
          }
          break

        case "cancelled":
        case "rejected":
          setNewOrders(prev => prev.filter(o => o.id !== orderId))
          setStats(prev => ({
            ...prev,
            newOrders: newStatus === "rejected" ? prev.newOrders - 1 : prev.newOrders
          }))
          break

        case "picked_up":
        case "delivered":
          const completedOrder = activeOrders.find(o => o.id === orderId)
          if (completedOrder) {
            setActiveOrders(prev => prev.filter(o => o.id !== orderId))
            setCompletedOrders(prev => [completedOrder, ...prev.slice(0, 9)])
            setStats(prev => ({
              ...prev,
              completedToday: prev.completedToday + 1,
              todaysRevenue: prev.todaysRevenue + completedOrder.pricing.total,
              activeOrders: prev.activeOrders - 1
            }))
          }
          break

        default:
          setActiveOrders(prev =>
            prev.map(order =>
              order.id === orderId ? { ...order, status: newStatus as Order['status'] } : order
            )
          )
      }

      const response = await api.orders.updateStatus(orderId, newStatus)


      if (!response.success) {
        showToast("❌ Update Failed", response.message || "Failed to update order status", "destructive")
        // Revert optimistic update by refetching
        fetchOrders(false)
        return
      }

      // Don't refetch - trust the optimistic update and socket events
      // The backend will emit socket events that will update other connected clients
      console.log(`✅ Order ${orderId} status updated to ${newStatus} successfully`)


      // Show specific icon based on status
      let icon = "🔄";
      switch (newStatus) {
        case "accepted": icon = "✅"; break;
        case "preparing": icon = "👨‍🍳"; break;
        case "ready": icon = "📦"; break;
        case "picked_up": icon = "🚚"; break;
        case "delivered": icon = "🎉"; break;
        case "cancelled":
        case "rejected": icon = "❌"; break;
      }

      showToast(`${icon} Status Updated`, `Order status changed to ${getStatusText(newStatus)}`)
    } catch (error) {
      console.error("Update error:", error)
      showToast(
        "❌ Update Failed",
        error instanceof Error ? error.message : "Failed to update order status",
        "destructive"
      )
      fetchOrders() // Revert optimistic update
    } finally {
      setUpdatingOrderId(null)
    }
  }

  // Memoized helper functions

  const formatTime = useCallback((dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }, [])

  const getDeliveryType = useCallback((order: Order) => {
    return order.orderType === "pickup" ? "pickup" : "delivery"
  }, [])

  const getFullAddress = useCallback((order: Order) => {
    const addr = order.deliveryAddress
    return `${addr.street}, ${addr.city}, ${addr.state} - ${addr.pincode}`
  }, [])

  const renderSpecialInstructions = useCallback((instructions?: string | Record<string, any>) => {
    if (!instructions) return null

    if (typeof instructions === 'string') {
      return (
        <div className="bg-yellow-50 rounded-lg p-3">
          <h4 className="font-medium mb-1 text-yellow-800">Special Instructions</h4>
          <p className="text-sm text-yellow-700">{instructions}</p>
        </div>
      )
    }

    return (
      <div className="bg-yellow-50 rounded-lg p-3">
        <h4 className="font-medium mb-1 text-yellow-800">Special Instructions</h4>
        <div className="text-sm text-yellow-700">
          {Object.entries(instructions).map(([key, value]) => (
            <p key={key}>{key}: {String(value)}</p>
          ))}
        </div>
      </div>
    )
  }, [])

  // Memoized components for better performance
  const OrderCard = useMemo(() => ({
    New: ({ order }: { order: Order }) => (
      <Card key={order.id} className="border-l-4 border-l-orange-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Order #{order.orderNumber || order.id.slice(-6)}</CardTitle>
              <CardDescription className="flex items-center space-x-4">
                <span>{order.customer.name}</span>
                <span>•</span>
                <span>{formatTime(order.createdAt)}</span>
                <span>•</span>
                <Badge className={getDeliveryType(order) === "pickup"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-purple-100 text-purple-800"}>
                  {getDeliveryType(order) === "pickup" ? "Pickup" : "Delivery"}
                </Badge>
              </CardDescription>
              {order.estimatedPickupTime || order.estimatedDeliveryTime ? (
                <div className="flex items-center text-sm text-gray-600 mt-1">
                  <Clock className="w-4 h-4 mr-1" />
                  {getDeliveryType(order) === "pickup"
                    ? `Estimated pickup at ${order.estimatedPickupTime}`
                    : `Estimated delivery at ${order.estimatedDeliveryTime}`}
                </div>
              ) : null}
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-green-600">₹{order.pricing.total.toFixed(2)}</div>
              <Badge className={getStatusColor(order.status)}>
                {getStatusText(order.status, order.orderType)}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Items</h4>
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>
                  {item.name} × {item.quantity}
                  {item.customizations && Object.keys(item.customizations).length > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      {Object.entries(item.customizations).map(([key, value]) => (
                        <div key={key}>{key}: {String(value)}</div>
                      ))}
                    </div>
                  )}
                </span>
                <span>₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{order.customer.name}</p>
                <p className="text-sm text-gray-600 flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {getFullAddress(order)}
                </p>
              </div>
              <a href={`tel:${order.customer.phone}`}>
                <Button size="sm" variant="outline">
                  <Phone className="w-4 h-4 mr-2" />
                  Call
                </Button>
              </a>
            </div>
          </div>

          {renderSpecialInstructions(order.specialInstructions)}

          <div className="flex space-x-2">
            <Button
              onClick={() => updateOrderStatus(order.id, "accepted")}
              className="flex-1 bg-green-500 hover:bg-green-600"
              disabled={updatingOrderId === order.id}
            >
              {updatingOrderId === order.id ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Accept Order
            </Button>
            <Button
              onClick={() => updateOrderStatus(
                order.id,
                getDeliveryType(order) === "pickup" ? "cancelled" : "rejected"
              )}
              variant="outline"
              className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
              disabled={updatingOrderId === order.id}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Decline
            </Button>
          </div>
        </CardContent>
      </Card>
    ),
    Active: ({ order }: { order: Order }) => (
      <Card key={order.id} className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Order #{order.orderNumber || order.id.slice(-6)}</CardTitle>
              <CardDescription className="flex items-center space-x-4">
                <span>{order.customer.name}</span>
                <span>•</span>
                <span>{formatTime(order.createdAt)}</span>
                <span>•</span>
                <Badge className={getStatusColor(order.status)}>
                  {getStatusText(order.status, order.orderType)}
                </Badge>
              </CardDescription>
              {order.estimatedPickupTime || order.estimatedDeliveryTime ? (
                <div className="flex items-center text-sm text-gray-600 mt-1">
                  <Clock className="w-4 h-4 mr-1" />
                  {getDeliveryType(order) === "pickup"
                    ? `Estimated pickup at ${order.estimatedPickupTime}`
                    : `Estimated delivery at ${order.estimatedDeliveryTime}`}
                </div>
              ) : null}
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-green-600">₹{order.pricing.total.toFixed(2)}</div>
              <div className="text-sm text-gray-600">
                {getDeliveryType(order) === "pickup" ? "Pickup" : "Delivery"}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Items</h4>
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>
                  {item.name} × {item.quantity}
                  {item.customizations && Object.keys(item.customizations).length > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      {Object.entries(item.customizations).map(([key, value]) => (
                        <div key={key}>{key}: {String(value)}</div>
                      ))}
                    </div>
                  )}
                </span>
                <span>₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{order.customer.name}</p>
                <p className="text-sm text-gray-600 flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {getFullAddress(order)}
                </p>
              </div>
              <a href={`tel:${order.customer.phone}`}>
                <Button size="sm" variant="outline">
                  <Phone className="w-4 h-4 mr-2" />
                  Call
                </Button>
              </a>
            </div>
          </div>

          {renderSpecialInstructions(order.specialInstructions)}

          <div className="grid grid-cols-2 gap-2">
            {order.status === "accepted" && (
              <Button
                onClick={() => updateOrderStatus(order.id, "preparing")}
                className="bg-orange-500 hover:bg-orange-600"
                disabled={updatingOrderId === order.id}
              >
                {updatingOrderId === order.id ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Start Preparing
              </Button>
            )}
            {order.status === "preparing" && (
              <Button
                onClick={() => updateOrderStatus(order.id, "ready")}
                className="bg-green-500 hover:bg-green-600"
                disabled={updatingOrderId === order.id}
              >
                {updatingOrderId === order.id ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Mark Ready
              </Button>
            )}
            {order.status === "ready" && (
              <Button
                onClick={() =>
                  updateOrderStatus(
                    order.id,
                    order.orderType === "pickup" ? "picked_up" : "delivered"
                  )
                }
                className="bg-blue-500 hover:bg-blue-600"
                disabled={updatingOrderId === order.id}
              >
                {updatingOrderId === order.id ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                {getDeliveryType(order) === "pickup" ? "Mark Picked Up" : "Mark Delivered"}
              </Button>
            )}

            <a href={`tel:${order.customer.phone}`}>
              <Button size="sm" variant="outline" className="w-full">
                <Phone className="w-4 h-4 mr-2" />
                Call Customer
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    )
  }), [formatTime, getDeliveryType, getFullAddress, getStatusColor, getStatusText, renderSpecialInstructions, updatingOrderId])

  return (
    <div className="p-4 space-y-6">
      <Toaster />

      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.newOrders}</div>
            <div className="text-sm text-gray-600">New Orders</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.activeOrders}</div>
            <div className="text-sm text-gray-600">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completedToday}</div>
            <div className="text-sm text-gray-600">Completed Today</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">₹{stats.todaysRevenue.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Today's Revenue</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <Button
          onClick={() => fetchOrders(true)}
          variant="outline"
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Refresh Orders
        </Button>
        <div className="flex items-center text-sm text-gray-500">
          <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          {isConnected ? 'Connected to real-time updates' : 'Disconnected - using polling'}
        </div>
      </div>

      <Tabs defaultValue="new" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="new" className="text-xs sm:text-sm">New ({stats.newOrders})</TabsTrigger>
          <TabsTrigger value="active" className="text-xs sm:text-sm">Active ({stats.activeOrders})</TabsTrigger>
          <TabsTrigger value="completed" className="text-xs sm:text-sm">Completed ({completedOrders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">Loading orders...</div>
          ) : newOrders.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No New Orders</h3>
              <p className="text-gray-600">New orders will appear here when customers place them</p>
            </div>
          ) : (
            newOrders.map((order) => <OrderCard.New key={order.id} order={order} />)
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {isLoading && activeOrders.length === 0 ? (
            <div className="text-center py-8">Loading orders...</div>
          ) : activeOrders.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Orders</h3>
              <p className="text-gray-600">Orders you're currently preparing will appear here</p>
            </div>
          ) : (
            activeOrders.map((order) => <OrderCard.Active key={order.id} order={order} />)
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {isLoading && completedOrders.length === 0 ? (
            <div className="text-center py-8">Loading orders...</div>
          ) : completedOrders.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Completed Orders</h3>
              <p className="text-gray-600">Completed orders will appear here</p>
            </div>
          ) : (
            <Table>
              <TableCaption>Recent completed orders</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Grouping by date logic */}
                {(() => {
                  const today = new Date().toLocaleDateString();
                  const todayOrders = completedOrders.filter(o => new Date(o.createdAt).toLocaleDateString() === today);
                  const olderOrders = completedOrders.filter(o => new Date(o.createdAt).toLocaleDateString() !== today);

                  if (completedOrders.length === 0) return null;

                  return (
                    <>
                      {todayOrders.length > 0 && (
                        <>
                          <TableRow className="bg-orange-50/50">
                            <TableCell colSpan={6} className="font-bold text-orange-800">Today's Completed Orders</TableCell>
                          </TableRow>
                          {todayOrders.map((order) => (
                            <TableRow key={order.id}>
                              <TableCell>{order.orderNumber || order.id.slice(-6)}</TableCell>
                              <TableCell>{order.customer.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {getDeliveryType(order) === "pickup" ? "Pickup" : "Delivery"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(order.status)}>
                                  {getStatusText(order.status, order.orderType)}
                                </Badge>
                              </TableCell>
                              <TableCell>{formatTime(order.createdAt)}</TableCell>
                              <TableCell className="text-right">₹{order.pricing.total.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </>
                      )}

                      {olderOrders.length > 0 && (
                        <>
                          <TableRow className="bg-gray-50">
                            <TableCell colSpan={6} className="text-gray-500 font-medium italic">Previous Sessions (Older Orders)</TableCell>
                          </TableRow>
                          {/* We could hide these or show them differently. 
                              The user said "previous vanished", so maybe we only show 
                              today's by default? Let's show them for now but marked clearly, 
                              or allow a toggle. For now, I'll show them under a separator. 
                          */}
                          {olderOrders.map((order) => (
                            <TableRow key={order.id} className="opacity-60">
                              <TableCell>{order.orderNumber || order.id.slice(-6)}</TableCell>
                              <TableCell>{order.customer.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {getDeliveryType(order) === "pickup" ? "Pickup" : "Delivery"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(order.status)}>
                                  {getStatusText(order.status, order.orderType)}
                                </Badge>
                              </TableCell>
                              <TableCell>{new Date(order.createdAt).toLocaleDateString()} {formatTime(order.createdAt)}</TableCell>
                              <TableCell className="text-right">₹{order.pricing.total.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </>
                      )}
                    </>
                  );
                })()}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}