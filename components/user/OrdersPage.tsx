"use client"

import { useEffect, useState } from "react"
import { Clock, CheckCircle, MapPin, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/lib/api"

import { Socket } from "socket.io-client"
interface OrderItem {
  name: string
  quantity: number
  price: number
}

interface DeliveryPerson {
  name: string
  rating: number
}

interface Vendor {
  shopName: string
  address: {
    street: string
    city: string
    state: string
    pincode: string
  }
}

interface Order {
  id: string
  vendor: Vendor
  status: string
  items: OrderItem[]
  pricing: {
    total: number
    subtotal: number
    deliveryFee: number
  }
  createdAt: string
  rating?: {
    overall?: {
      rating?: number
    }
  }
  deliveryPerson?: DeliveryPerson
}

const orderSteps = [
  { id: 1, title: "Order Confirmed", completed: true },
  { id: 2, title: "Preparing", completed: true },
  { id: 3, title: "Ready for Pickup", completed: false },
  { id: 4, title: "Delivered", completed: false },
]

export default function OrdersPage() {
  const [activeOrders, setActiveOrders] = useState<Order[]>([])
  const [pastOrders, setPastOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.orders.getCustomerOrders({ status: "placed" })
        console.log("API Response:", response)
        
        // Transform API response to match our interface
        const orders = response.orders.map((order: any) => ({
          id: order.id,
          vendor: {
            shopName: order.vendor.shopName,
            address: order.vendor.address
          },
          status: order.status,
          items: order.items.map((item: any) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          pricing: {
            total: order.pricing.total,
            subtotal: order.pricing.subtotal,
            deliveryFee: order.pricing.deliveryFee
          },
          createdAt: order.createdAt,
          rating: order.rating
        }))

        // For demo purposes, we'll split into active and past based on status
        setActiveOrders(orders.filter((order: Order) => order.status !== "delivered"))
        setPastOrders(orders.filter((order: Order) => order.status === "delivered"))
      } catch (error) {
        console.error("Failed to fetch orders:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "preparing":
        return "bg-orange-100 text-orange-800"
      case "ready":
        return "bg-blue-100 text-blue-800"
      case "out_for_delivery":
        return "bg-purple-100 text-purple-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "placed":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case "preparing":
        return "Preparing"
      case "ready":
        return "Ready for Pickup"
      case "out_for_delivery":
        return "Out for Delivery"
      case "delivered":
        return "Delivered"
      case "placed":
        return "Order Placed"
      default:
        return status
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Loading orders...</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Orders</h1>
        <p className="text-gray-600">Track your current and past orders</p>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">Active Orders ({activeOrders.length})</TabsTrigger>
          <TabsTrigger value="history">Order History ({pastOrders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeOrders.length > 0 ? (
            activeOrders.map((order) => (
              <Card key={order.id}>
                <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Order #{order.id.slice(-6)}</CardTitle>
                      <CardDescription>{order.vendor.shopName}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusText(order.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Items Ordered</h4>
                    {order.items.map((item, index) => (
                      <div key={`${item.name}-${index}`} className="flex justify-between text-sm">
                        <span>{item.name} × {item.quantity}</span>
                        <span>₹{item.price.toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                      <span>Total</span>
                      <span>₹{order.pricing.total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Order Progress</h4>
                      <span className="text-sm text-gray-600">
                        Placed on {formatDate(order.createdAt)}
                      </span>
                    </div>
                    <Progress value={
                      order.status === "placed" ? 25 : 
                      order.status === "preparing" ? 50 : 
                      order.status === "ready" ? 75 : 
                      order.status === "out_for_delivery" ? 90 : 
                      100
                    } className="h-2 mb-2" />
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      {orderSteps.map((step) => {
                        const isCurrentStep = 
                          (order.status === "preparing" && step.id === 2) ||
                          (order.status === "ready" && step.id === 3) ||
                          (order.status === "out_for_delivery" && step.id === 4) ||
                          (order.status === "delivered" && step.id === 4);
                        
                        const isCompleted = 
                          (order.status === "delivered" && step.id <= 4) || 
                          (order.status === "out_for_delivery" && step.id <= 3) ||
                          (order.status === "ready" && step.id <= 2) ||
                          (order.status === "preparing" && step.id <= 1) ||
                          (order.status === "placed" && step.id <= 1);

                        return (
                          <div key={step.id} className="text-center">
                            <div className={`w-6 h-6 rounded-full mx-auto mb-1 flex items-center justify-center ${
                              isCompleted ? "bg-green-500 text-white" : 
                              isCurrentStep ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-500"
                            }`}>
                              {isCompleted ? <CheckCircle className="w-3 h-3" /> : step.id}
                            </div>
                            <span className={
                              isCompleted ? "text-green-600" : 
                              isCurrentStep ? "text-orange-600" : "text-gray-500"
                            }>
                              {step.title}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {order.deliveryPerson && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="font-medium mb-2">Delivery Partner</h4>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-orange-600">
                              {order.deliveryPerson.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">{order.deliveryPerson.name}</p>
                            <p className="text-xs text-gray-600">
                              Rating: {order.deliveryPerson.rating.toFixed(1)} ⭐
                            </p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          <Phone className="w-4 h-4 mr-2" />
                          Call
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Button className="flex-1 bg-orange-500 hover:bg-orange-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      Track Live
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Phone className="w-4 h-4 mr-2" />
                      Contact Vendor
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Orders</h3>
              <p className="text-gray-600 mb-4">You don't have any active orders right now</p>
              <Button className="bg-orange-500 hover:bg-orange-600">Browse Vendors</Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {pastOrders.length > 0 ? (
            pastOrders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium">Order #{order.id.slice(-6)}</h4>
                      <p className="text-sm text-gray-600">{order.vendor.shopName}</p>
                      <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusText(order.status)}
                    </Badge>
                  </div>

                  <div className="space-y-1 mb-3">
                    {order.items.map((item, index) => (
                      <div key={`${item.name}-${index}`} className="flex justify-between text-sm">
                        <span>{item.name} × {item.quantity}</span>
                        <span>₹{item.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-bold">₹{order.pricing.total.toFixed(2)}</span>
                    <div className="flex items-center space-x-2">
                      {order.rating?.overall?.rating !== undefined && (
                        <span className="text-sm">
                          Rating: {"⭐".repeat(Math.round(order.rating.overall.rating))}
                        </span>
                      )}
                      <Button size="sm" variant="outline">Reorder</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Past Orders</h3>
              <p className="text-gray-600 mb-4">Your order history will appear here</p>
              <Button className="bg-orange-500 hover:bg-orange-600">Browse Vendors</Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}