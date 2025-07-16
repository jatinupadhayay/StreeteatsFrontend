// app/delivery/[orderId]/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useSocket } from "@/contexts/SocketContext"
import { api } from "@/lib/api"
import {
  MapPin,
  Clock,
  Phone,
  Star,
  Navigation,
  CheckCircle,
  Loader2,
  Check,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/components/ui/use-toast"
import { RatingModal } from "@/components/Ratinmodel"

interface OrderStatus {
  _id: string
  orderNumber: string
  status: string
  orderType: 'delivery' | 'pickup'
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  pricing: {
    total: number
    subtotal: number
    deliveryFee: number
    taxes: { total: number }
  }
  deliveryAddress: string
  estimatedDeliveryTime?: number
  originalETA?: number
  progress?: number
  vendorName: string
  deliveryPerson?: {
    name: string
    photo?: string
    rating: number
    vehicle: string
    phone: string
  }
  steps: Array<{
    id: number
    title: string
    description: string
    completed: boolean
  }>
}

export default function DeliveryPage() {
  const params = useParams()
  const orderId = params?.id as string
  const { socket, isConnected } = useSocket()

  const [order, setOrder] = useState<OrderStatus | null>(null)
  const [estimatedArrival, setEstimatedArrival] = useState<number>(0)
  const [deliveryProgress, setDeliveryProgress] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showRatingModal, setShowRatingModal] = useState(false)

  // Format address helper function
  const formatAddress = (address: any): string => {
    if (!address) return "Address not specified"
    if (typeof address === "string") return address
    
    // Handle both object with street/city and coordinates format
    if (address.street && address.city) {
      return `${address.street}, ${address.city}, ${address.state} - ${address.pincode}`
    }
    
    // Fallback for other formats
    return JSON.stringify(address)
  }

  // Calculate minutes remaining from delivery time string
  const calculateMinutesRemaining = (deliveryTime: string): number => {
    try {
      const deliveryDate = new Date(deliveryTime)
      const now = new Date()
      return Math.max(Math.round((deliveryDate.getTime() - now.getTime()) / (1000 * 60)), 0)
    } catch (error) {
      console.error("Error calculating delivery time:", error)
      return 30 // Default fallback
    }
  }

  // Calculate progress based on order status
  const calculateProgress = (status: string): number => {
    const statusWeights: Record<string, number> = {
      placed: 10,
      confirmed: 20,
      accepted: 30,
      preparing: 50,
      ready: order?.orderType === 'delivery' ? 70 : 90,
      out_for_delivery: 90,
      delivered: 100,
      picked_up: 100,
      cancelled: 0
    }
    return statusWeights[status] || 0
  }

  // Format order data from API response
  const formatOrderData = (order: any, deliveryPerson?: any): OrderStatus => {
    try {
      if (!order) throw new Error("Order data is undefined")
      
      const steps = [
        {
          id: 1,
          title: "Order Placed",
          description: "Your order has been received",
          completed: true // Always completed
        },
        {
          id: 2,
          title: "Order Confirmed",
          description: "Vendor has accepted your order",
          completed: ["confirmed", "accepted", "preparing", "ready", "out_for_delivery", "delivered", "picked_up"].includes(order.status)
        },
        {
          id: 3,
          title: "Food Preparation",
          description: "Vendor is preparing your food",
          completed: ["preparing", "ready", "out_for_delivery", "delivered", "picked_up"].includes(order.status)
        },
        {
          id: 4,
          title: order.orderType === "delivery" ? "Out for Delivery" : "Ready for Pickup",
          description: order.orderType === "delivery" 
            ? "Delivery partner is on the way" 
            : "Your order is ready for pickup",
          completed: ["ready", "out_for_delivery", "delivered", "picked_up"].includes(order.status)
        },
        {
          id: 5,
          title: order.orderType === "delivery" ? "Delivered" : "Picked Up",
          description: order.orderType === "delivery" 
            ? "Your order has been delivered" 
            : "You have picked up your order",
          completed: ["delivered", "picked_up"].includes(order.status)
        }
      ]

      return {
        _id: order._id || order.id || "",
        orderNumber: order.orderNumber || `#${(order._id || order.id).slice(-6)}`,
        status: order.status || "unknown",
        orderType: order.orderType || "delivery", // Default to delivery if not specified
        items: order.items || [],
        pricing: order.pricing || {
          total: 0,
          subtotal: 0,
          deliveryFee: 0,
          taxes: { total: 0 }
        },
        deliveryAddress: formatAddress(order.deliveryAddress),
        estimatedDeliveryTime: order.estimatedDeliveryTime 
          ? calculateMinutesRemaining(order.estimatedDeliveryTime)
          : 30, // Default fallback
        originalETA: order.estimatedDeliveryTime 
          ? calculateMinutesRemaining(order.estimatedDeliveryTime)
          : 30, // Default fallback
        progress: calculateProgress(order.status),
        vendorName: order.vendor?.shopName || "Unknown Vendor",
        deliveryPerson: deliveryPerson ? {
          name: deliveryPerson.name || "Unknown",
          photo: deliveryPerson.photo,
          rating: deliveryPerson.rating || 0,
          vehicle: deliveryPerson.vehicle || "Unknown",
          phone: deliveryPerson.phone || ""
        } : undefined,
        steps
      }
    } catch (error) {
      console.error("Error formatting order data:", error)
      throw error
    }
  }

  // Fetch order data from backend
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setIsLoading(true)
        console.log('Fetching order data...')
        
        const response = await api.orders.getById(orderId)
        console.log('API Response:', response)
        
        if (!response.success) {
          throw new Error(response.message || "Failed to fetch order")
        }

        if (!response.order) {
          throw new Error("Order data is missing from response")
        }

        const formattedOrder = formatOrderData(response.order, response.deliveryPerson)
        console.log('Formatted Order:', formattedOrder)
        
        setOrder(formattedOrder)
        setEstimatedArrival(formattedOrder.estimatedDeliveryTime || 0)
        setDeliveryProgress(formattedOrder.progress || 0)
        setError(null)
      } catch (err) {
        console.error("Error fetching order:", err)
        setError(err instanceof Error ? err.message : "Failed to load order")
        toast({
          title: "Error",
          description: "Failed to load order details",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (orderId) {
      fetchOrder()
    } else {
      setIsLoading(false)
      setError("Order ID is missing")
    }
  }, [orderId])

  // Listen for live updates from backend
  useEffect(() => {
    if (!socket || !orderId) {
      console.log('Socket not ready or orderId missing')
      return
    }

    console.log('Setting up socket listeners...')

    const handleOrderUpdate = (updatedOrder: any) => {
      try {
        console.log('Received order update:', updatedOrder)
        const formattedOrder = formatOrderData(updatedOrder, updatedOrder.deliveryPerson)
        setOrder(formattedOrder)
        setEstimatedArrival(formattedOrder.estimatedDeliveryTime || 0)
        setDeliveryProgress(formattedOrder.progress || 0)
        
        toast({
          title: "Order Updated",
          description: `Status: ${formattedOrder.status.replace(/_/g, " ")}`,
        })
      } catch (error) {
        console.error("Error handling order update:", error)
      }
    }

    socket.emit("join_order_room", orderId)
    socket.on("order-status-updated", handleOrderUpdate)

    return () => {
      socket.emit("leave_order_room", orderId)
      socket.off("order_updated", handleOrderUpdate)
    }
  }, [socket, orderId])

  // Countdown ETA and simulate progress (optional)
  useEffect(() => {
    const interval = setInterval(() => {
      setEstimatedArrival((prev) => Math.max(prev - 1, 0))
      setDeliveryProgress((prev) => Math.min(prev + 2, 100))
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  const handleRateOrder = async (ratingData: {
    food?: number
    delivery?: number
    overall: number
    review?: string
  }) => {
    try {
      const response = await api.orders.rateOrder(orderId, ratingData)
      
      if (response.success) {
        toast({
          title: "Thank You!",
          description: "Your rating has been submitted successfully",
          action: <Check className="w-4 h-4" />,
        })
        setShowRatingModal(false)
      } else {
        throw new Error(response.message || "Failed to submit rating")
      }
    } catch (error) {
      console.error("Error rating order:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit rating",
        variant: "destructive",
        action: <X className="w-4 h-4" />,
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading order details...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center p-4 bg-red-50 rounded-lg">
          <h2 className="text-xl font-bold text-red-600">Error loading order</h2>
          <p className="text-red-500">{error}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold">Order not found</h2>
          <p>We couldn't find an order with ID: {orderId}</p>
        </div>
      </div>
    )
  }

  const steps = order?.steps || []
  const deliveryPerson = order?.deliveryPerson || {
    name: "Unknown",
    photo: "/placeholder.svg",
    rating: 0,
    vehicle: "Unknown",
    phone: "",
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Rating Modal */}
      {(order.status === "delivered" || order.status === "picked_up") && (
        <RatingModal
          open={showRatingModal}
          onOpenChange={setShowRatingModal}
          onSubmit={handleRateOrder}
        />
      )}

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">
          {order.orderType === 'delivery' ? 'Track Your Delivery' : 'Track Your Pickup'}
        </h1>
        <p className="text-gray-600">Order #{order.orderNumber}</p>
        <div className="mt-2">
          <Badge
            variant={
              order.status === "delivered" || order.status === "picked_up"
                ? "default"
                : order.status === "cancelled"
                ? "destructive"
                : "secondary"
            }
          >
            {order.status.replace(/_/g, " ")}
          </Badge>
        </div>
      </div>

      {/* Connection Status */}
      <div className="mb-4 flex items-center justify-end">
        <div className="flex items-center text-sm">
          <div
            className={`w-2 h-2 rounded-full mr-2 ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          {isConnected ? "Live updates connected" : "Live updates disconnected"}
        </div>
      </div>

      {/* Live Tracking */}
      <Card className="mb-8 bg-gradient-to-r from-green-50 to-green-100 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center text-green-800">
            <Navigation className="w-6 h-6 mr-2" />
            {order.orderType === 'delivery' ? 'Delivery Tracking' : 'Pickup Status'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-2xl font-bold text-green-800">
                {estimatedArrival} mins
              </p>
              <p className="text-green-600">
                {order.orderType === 'delivery' 
                  ? 'Estimated arrival' 
                  : 'Estimated ready time'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-green-800">
                {order.status.replace(/_/g, " ")}
              </p>
              <p className="text-green-600">
                {order.orderType === 'delivery'
                  ? 'Your order is being delivered'
                  : 'Your order is being prepared'}
              </p>
            </div>
          </div>
          <Progress value={deliveryProgress} className="h-3 mb-2" />
          <p className="text-sm text-green-600 text-center">
            {deliveryProgress}% complete
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Status */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {order.orderType === 'delivery' 
                  ? 'Delivery Status' 
                  : 'Pickup Status'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-start space-x-3">
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        step.completed
                          ? "bg-green-500 text-white"
                          : index === steps.findIndex(s => !s.completed)
                          ? "bg-orange-500 text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {step.completed ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <span className="text-sm font-bold">{step.id}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4
                        className={`font-medium ${
                          step.completed
                            ? "text-green-800"
                            : index === steps.findIndex(s => !s.completed)
                            ? "text-orange-800"
                            : "text-gray-500"
                        }`}
                      >
                        {step.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {step.description}
                      </p>
                      {index === steps.findIndex(s => !s.completed) && (
                        <Badge className="mt-1 bg-orange-100 text-orange-800">
                          Current Status
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Delivery Person (only shown for delivery orders) */}
          {order.orderType === 'delivery' && (
            <Card>
              <CardHeader>
                <CardTitle>Your Delivery Partner</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <img
                    src={deliveryPerson.photo || "/placeholder.svg"}
                    alt={deliveryPerson.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900">
                      {deliveryPerson.name}
                    </h4>
                    <div className="flex items-center mb-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="ml-1 text-sm font-medium">
                        {deliveryPerson.rating.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {deliveryPerson.vehicle}
                    </p>
                  </div>
                  {deliveryPerson.phone && (
                    <a href={`tel:${deliveryPerson.phone}`}>
                      <Button size="sm" variant="outline">
                        <Phone className="w-4 h-4 mr-2" />
                        Call
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
              <CardDescription>From {order.vendorName}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <span className="font-medium">{item.name}</span>
                      <span className="text-gray-500 ml-2">
                        × {item.quantity}
                      </span>
                    </div>
                    <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t pt-3 mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Subtotal</span>
                    <span>₹{order.pricing.subtotal.toFixed(2)}</span>
                  </div>
                  {order.orderType === 'delivery' && (
                    <div className="flex items-center justify-between">
                      <span>Delivery Fee</span>
                      <span>₹{order.pricing.deliveryFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span>Taxes</span>
                    <span>₹{order.pricing.taxes.total.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex items-center justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>₹{order.pricing.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Address (only shown for delivery orders) */}
          {order.orderType === 'delivery' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{order.deliveryAddress}</p>
              </CardContent>
            </Card>
          )}

          {/* Estimated Time */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                {order.orderType === 'delivery' ? 'Delivery Time' : 'Pickup Time'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-600 mb-2">
                  {estimatedArrival} mins
                </p>
                <p className="text-gray-600">
                  {order.orderType === 'delivery'
                    ? 'Estimated delivery time'
                    : 'Estimated ready time'}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Original estimate: {order.originalETA} mins
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Rate Order Button (only shown when delivered/picked up) */}
          {(order.status === "delivered" || order.status === "picked_up") && (
            <Card>
              <CardHeader>
                <CardTitle>Rate Your Experience</CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  onClick={() => setShowRatingModal(true)}
                >
                  Rate This Order
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}