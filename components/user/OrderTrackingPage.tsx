"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"

import { useSocket } from "@/contexts/SocketContext"
import { api } from "@/lib/api"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/components/ui/use-toast"

import { Clock, Heart, Loader2, MapPin, Navigation, Phone, Star } from "lucide-react"

import { RatingModal } from "@/components/RatingModal"

interface OrderTrackingPageProps {
  orderId: string
}

interface TrackingStep {
  id: number
  title: string
  description: string
  completed: boolean
}

interface TrackingOrder {
  id: string
  orderNumber: string
  status: string
  orderType: "delivery" | "pickup" | "dine_in"
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
  vendor: {
    id?: string
    _id?: string
    shopName: string
    address?: any
  }
  deliveryAddress?: any
  estimatedDeliveryTime?: string
  actualDeliveryTime?: string
  deliveryPerson?: {
    name: string
    rating?: number
    phone?: string
    vehicle?: string
    photo?: string
  } | null
  steps: TrackingStep[]
}

const STATUS_PROGRESS: Record<string, number> = {
  placed: 10,
  confirmed: 20,
  accepted: 30,
  preparing: 50,
  ready: 70,
  ready_for_pickup: 75,
  out_for_delivery: 90,
  picked_up: 95,
  delivered: 100,
}

const formatAddress = (address: any): string => {
  if (!address) return "Address not specified"
  if (typeof address === "string") return address

  const parts = [address.street, address.landmark, address.city, address.state, address.pincode].filter(Boolean)
  if (parts.length > 0) return parts.join(", ")

  return "Address not specified"
}

const formatCurrency = (value: number) => value.toFixed(2)

const formatSteps = (order: any): TrackingStep[] => {
  const status = order.status || "placed"
  const orderType = order.orderType || "delivery"

  return [
    {
      id: 1,
      title: "Order Placed",
      description: "We have received your order",
      completed: true,
    },
    {
      id: 2,
      title: "Order Confirmed",
      description: "Vendor has confirmed your order",
      completed: ["confirmed", "accepted", "preparing", "ready", "ready_for_pickup", "out_for_delivery", "delivered", "picked_up"].includes(status),
    },
    {
      id: 3,
      title: "In Preparation",
      description: "Vendor is preparing your food",
      completed: ["preparing", "ready", "ready_for_pickup", "out_for_delivery", "delivered", "picked_up"].includes(status),
    },
    {
      id: 4,
      title: orderType === "pickup" ? "Ready for Pickup" : "Ready for Delivery",
      description:
        orderType === "pickup"
          ? "Your order is ready for pickup"
          : "Delivery partner is collecting your order",
      completed: ["ready", "ready_for_pickup", "out_for_delivery", "delivered", "picked_up"].includes(status),
    },
    {
      id: 5,
      title: orderType === "pickup" ? "Picked Up" : "Delivered",
      description:
        orderType === "pickup"
          ? "You have collected your order"
          : "Your order has been delivered",
      completed: ["picked_up", "delivered"].includes(status),
    },
  ]
}

const calculateProgress = (status: string) => STATUS_PROGRESS[status] ?? 0

const getMinutesRemaining = (timestamp?: string) => {
  if (!timestamp) return 0
  try {
    const eta = new Date(timestamp)
    const now = new Date()
    return Math.max(Math.round((eta.getTime() - now.getTime()) / (1000 * 60)), 0)
  } catch (error) {
    console.warn("Failed to calculate ETA", error)
    return 0
  }
}

export default function CustomerOrderTracking({ orderId }: OrderTrackingPageProps) {
  const { socket, isConnected, joinOrderRoom, leaveOrderRoom } = useSocket()
  const [order, setOrder] = useState<TrackingOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [isRatingSubmitted, setIsRatingSubmitted] = useState(false)

  const currentProgress = useMemo(() => calculateProgress(order?.status || "placed"), [order?.status])
  const etaMinutes = useMemo(() => getMinutesRemaining(order?.estimatedDeliveryTime), [order?.estimatedDeliveryTime])

  const formatOrderResponse = useCallback((response: any): TrackingOrder => {
    const orderPayload = response?.order || response

    if (!orderPayload) {
      throw new Error("Order details unavailable")
    }

    return {
      id: orderPayload._id || orderPayload.id,
      orderNumber: orderPayload.orderNumber || `#${(orderPayload._id || orderPayload.id || "").slice(-6)}`,
      status: orderPayload.status,
      orderType: orderPayload.orderType || "delivery",
      items: orderPayload.items || [],
      pricing: {
        total: orderPayload.pricing?.total || 0,
        subtotal: orderPayload.pricing?.subtotal || 0,
        deliveryFee: orderPayload.pricing?.deliveryFee || 0,
        taxes: { total: orderPayload.pricing?.taxes?.total || 0 },
      },
      vendor: {
        shopName: orderPayload.vendor?.shopName || "Vendor",
        address: orderPayload.vendor?.address,
      },
      deliveryAddress: orderPayload.deliveryAddress,
      estimatedDeliveryTime: orderPayload.estimatedDeliveryTime,
      actualDeliveryTime: orderPayload.actualDeliveryTime,
      deliveryPerson: response?.deliveryPerson || orderPayload.deliveryPerson || null,
      steps: formatSteps(orderPayload),
    }
  }, [])

  const fetchTracking = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true)
      }
      setError(null)

      const response = await api.orders.getById(orderId)
      if (!response?.success) {
        throw new Error(response?.message || "Failed to load order")
      }

      const formatted = formatOrderResponse(response)
      setOrder(formatted)

      if (["delivered", "picked_up"].includes(formatted.status)) {
        setShowRatingModal(true)
      }
    } catch (err) {
      console.error("Order tracking error", err)
      setError(err instanceof Error ? err.message : "Failed to load order details")
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }, [formatOrderResponse, orderId])

  useEffect(() => {
    // Only show loading on initial load
    fetchTracking(true)
  }, [fetchTracking])

  useEffect(() => {
    if (!socket || !orderId) return

    joinOrderRoom(orderId)

    const handleStatusUpdate = async (payload: any) => {
      if (!payload) return

      try {
        console.log("🔔 Live update received in tracking page:", payload)

        // Backend might send { order, status } or just order
        const orderData = payload.order || payload
        const updateOrderId = orderData.id || orderData._id || payload.orderId

        // Check if this update is for our order
        if (updateOrderId && updateOrderId !== orderId) {
          console.log(`Update is for different order: ${updateOrderId} vs ${orderId}`)
          return
        }

        // If we only got status update, fetch full order
        let fullOrderData = orderData
        if (!orderData.items || !orderData.pricing) {
          console.log("Fetching full order data...")
          try {
            const response = await api.orders.getById(orderId)
            if (response.success && response.order) {
              fullOrderData = response.order
            }
          } catch (fetchError) {
            console.error("Failed to fetch updated order:", fetchError)
            // Still try to update with partial data
          }
        }

        const formatted = formatOrderResponse(fullOrderData)
        const newStatus = payload.status || formatted.status || orderData.status

        console.log(`✅ Updating order status to: ${newStatus}`)

        // Update immediately without waiting
        setOrder({ ...formatted, status: newStatus })

        if (["delivered", "picked_up"].includes(newStatus)) {
          setShowRatingModal(true)
        }

        // toast() removed here as it's handled globally in SocketContext
      } catch (error) {
        console.error("Failed to apply live update", error)
      }
    }

    // Listen to multiple event names for compatibility
    socket.on("order-status-updated", handleStatusUpdate)
    socket.on("order_updated", handleStatusUpdate)
    socket.on("order-updated", handleStatusUpdate)
    socket.on("order_status_updated", handleStatusUpdate)

    // Also listen to the event from SocketContext
    socket.on("order_status_updated", (data: any) => {
      console.log("📡 Received order_status_updated from context:", data)
      if (data.order && (data.order.id === orderId || data.order._id === orderId)) {
        handleStatusUpdate(data)
      }
    })

    // Aggressive polling to ensure updates - poll every 2 seconds without showing loading
    const pollingInterval = setInterval(() => {
      // Silently fetch updates without showing loading indicator
      fetchTracking(false)
    }, 2000) // Poll every 2 seconds to ensure real-time updates

    return () => {
      leaveOrderRoom(orderId)
      socket.off("order-status-updated", handleStatusUpdate)
      socket.off("order_updated", handleStatusUpdate)
      socket.off("order-updated", handleStatusUpdate)
      socket.off("order_status_updated", handleStatusUpdate)
      clearInterval(pollingInterval)
    }
  }, [formatOrderResponse, joinOrderRoom, leaveOrderRoom, orderId, socket, fetchTracking])

  const handleRatingSubmit = async (ratingData: any) => {
    if (!order) return
    try {
      // Use the dedicated rateOrder API which handles both vendor and dish reviews in one call
      const response = await api.orders.rateOrder(orderId, ratingData)

      if (!response.success) {
        throw new Error(response.message || "Unable to submit rating")
      }

      toast({
        title: "Thank you!",
        description: "Your rating has been recorded.",
      })
      setShowRatingModal(false)
      setIsRatingSubmitted(true)
    } catch (error) {
      console.error("Rating error", error)
      toast({
        title: "Rating failed",
        description: error instanceof Error ? error.message : "Could not submit your rating.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2 text-sm text-gray-600">Loading order details…</span>
      </div>
    )
  }

  if (isRatingSubmitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <Card className="overflow-hidden border-orange-100 shadow-xl">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-8 text-white">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <Heart className="h-10 w-10 fill-current text-white animate-pulse" />
            </div>
            <h2 className="text-3xl font-bold">Thank You!</h2>
            <p className="mt-2 text-orange-100 italic">We're glad you enjoyed your meal</p>
          </div>
          <CardContent className="p-8 space-y-6">
            <div className="space-y-2">
              <img src="/image.png" alt="Aahar Logo" className="mx-auto h-16 w-16 object-contain" />
              <h3 className="text-xl font-semibold text-gray-800">Aahar</h3>
            </div>

            <div className="py-6 border-y border-gray-100">
              <p className="text-lg text-gray-600">
                Thanks for ordering from <span className="font-bold text-orange-600">{order?.vendor.shopName}</span>
              </p>
              <p className="mt-4 text-sm text-gray-500">
                Your feedback helps our community of local vendors grow and improve.
              </p>
            </div>

            <div className="pt-4 space-y-3">
              <h4 className="text-sm font-medium text-gray-400 uppercase tracking-widest">Welcome back anytime!</h4>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild className="bg-orange-600 hover:bg-orange-700">
                  <Link href="/customer">Order Something New</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/customer/orders">View Order History</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
        <h2 className="text-lg font-semibold">Unable to load order</h2>
        <p className="mt-1 text-sm">{error || "Please try again in a moment."}</p>
        <Button className="mt-4" onClick={() => fetchTracking(true)}>
          Retry
        </Button>
      </div>
    )
  }

  const activeStepIndex = order.steps.findIndex((step) => !step.completed)
  const deliveryPerson = order.deliveryPerson

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      {(["delivered", "picked_up"].includes(order.status)) && (
        <RatingModal
          open={showRatingModal}
          onOpenChange={setShowRatingModal}
          onSubmit={handleRatingSubmit}
          items={order.items as any}
        />
      )}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Track your order</h1>
        <p className="text-sm text-gray-600">Order {order.orderNumber}</p>
        <div className="mt-2 inline-flex items-center gap-2">
          <Badge
            variant={order.status === "delivered" ? "default" : order.status === "cancelled" ? "destructive" : "secondary"}
          >
            {order.status.replace(/_/g, " ")}
          </Badge>
          <Badge variant="outline">{order.orderType === "pickup" ? "Pickup" : "Delivery"}</Badge>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className={`inline-block h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
            {isConnected ? "Live updates" : "Offline"}
          </div>
        </div>
      </div>

      {order.status === "placed" && (
        <Card className="border-orange-200 bg-orange-50 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-orange-200">
            <div className="h-full bg-orange-500 animate-pulse w-full" />
          </div>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <div className="relative mb-4">
              <Clock className="h-12 w-12 text-orange-500 animate-pulse" />
              <div className="absolute -top-1 -right-1">
                <span className="flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                </span>
              </div>
            </div>
            <h3 className="text-xl font-bold text-orange-800">Waiting for Acceptance</h3>
            <p className="text-sm text-orange-600 max-w-sm mt-2">
              The vendor has received your order. Please stay on this page, we'll notify you as soon as they accept it!
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="bg-gradient-to-r from-orange-50 to-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <Navigation className="h-5 w-5" />
            Live status
          </CardTitle>
          <CardDescription>
            {order.orderType === "pickup" ? "Collect your order when it is ready" : "We will keep you updated until delivery"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="text-3xl font-bold text-orange-700">{etaMinutes} mins</p>
              <p className="text-sm text-orange-600">Estimated {order.orderType === "pickup" ? "ready" : "arrival"} time</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-orange-800">{order.status.replace(/_/g, " ")}</p>
              <p className="text-sm text-orange-600">We will notify you once there is an update</p>
            </div>
          </div>
          <Progress value={currentProgress} className="mt-4 h-3" />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.steps.map((step, index) => {
                const isActive = index === (activeStepIndex === -1 ? order.steps.length - 1 : activeStepIndex)
                return (
                  <div key={step.id} className="flex items-start gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${step.completed ? "bg-green-500 text-white" : isActive ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-500"
                        }`}
                    >
                      {step.completed ? <CheckCircleIcon /> : step.id}
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold ${step.completed ? "text-green-700" : isActive ? "text-orange-700" : "text-gray-600"}`}>
                        {step.title}
                      </p>
                      <p className="text-sm text-gray-500">{step.description}</p>
                      {isActive && !step.completed && (
                        <Badge className="mt-1 bg-orange-100 text-orange-700">In progress</Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order summary</CardTitle>
              <CardDescription>{order.vendor.shopName}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.items.map((item, index) => (
                <div key={`${item.name}-${index}`} className="flex items-center justify-between text-sm">
                  <span>
                    {item.name} <span className="text-gray-500">× {item.quantity}</span>
                  </span>
                  <span className="font-medium">₹{formatCurrency(item.quantity * item.price)}</span>
                </div>
              ))}
              <div className="border-t pt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span>₹{formatCurrency(order.pricing.subtotal)}</span>
                </div>
                {order.orderType !== "pickup" && (
                  <div className="flex items-center justify-between">
                    <span>Delivery fee</span>
                    <span>₹{formatCurrency(order.pricing.deliveryFee)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span>Taxes</span>
                  <span>₹{formatCurrency(order.pricing.taxes.total)}</span>
                </div>
                <div className="border-t pt-2 text-base font-semibold">
                  <div className="flex items-center justify-between">
                    <span>Total paid</span>
                    <span>₹{formatCurrency(order.pricing.total)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {order.orderType !== "pickup" && order.deliveryAddress && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Delivery address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">{formatAddress(order.deliveryAddress)}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {order.orderType !== "pickup" && deliveryPerson && (
            <Card>
              <CardHeader>
                <CardTitle>Delivery partner</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <img
                    src={deliveryPerson.photo || "/placeholder.svg"}
                    alt={deliveryPerson.name}
                    className="h-14 w-14 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">{deliveryPerson.name}</p>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Star className="h-4 w-4 text-yellow-400" />
                      {(deliveryPerson.rating ?? 0).toFixed(1)}
                    </div>
                    {deliveryPerson.vehicle && <p className="text-xs text-gray-500">{deliveryPerson.vehicle}</p>}
                  </div>
                </div>
                {deliveryPerson.phone && (
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <a href={`tel:${deliveryPerson.phone}`}>
                      <Phone className="mr-2 h-4 w-4" /> Call delivery partner
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Timing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <span>Estimated {order.orderType === "pickup" ? "ready" : "arrival"} time</span>
                <span>{etaMinutes} mins</span>
              </div>
              {order.actualDeliveryTime && (
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Delivered at</span>
                  <span>{new Date(order.actualDeliveryTime).toLocaleTimeString()}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {(["delivered", "picked_up"].includes(order.status)) && (
            <Card>
              <CardHeader>
                <CardTitle>Enjoyed your meal?</CardTitle>
                <CardDescription>Share your feedback to help vendors improve</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={() => setShowRatingModal(true)}>
                  Rate this order
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div >
  )
}

function CheckCircleIcon() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" /></svg>
}

