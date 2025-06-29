"use client"

import { useState, useEffect } from "react"
import { Package, Clock, CheckCircle, X } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Navbar from "@/components/common/Navbar"
import { useSocket } from "@/contexts/SocketContext"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import MenuManager from "./MenuManager"
import Analytics from "./Analytics"
import VendorPage from "./VendorProfile"

interface Order {
  id: string
  orderNumber: string
 customer: { name: string; phone: string };
  items: Array<{ name: string; quantity: number; price: number }>
  totalAmount: number
  status: "pending" | "accepted" | "preparing" | "ready" | "completed"
  createdAt: string
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    coordinates?: any;
    type?: string;
  };
  
}

export default function VendorDashboard() {
  const [activeTab, setActiveTab] = useState("orders")
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { socket, isConnected } = useSocket()
  const { user } = useAuth()
  const { toast } = useToast()

  // Fetch initial orders
  useEffect(() => {
    fetchOrders()
  }, [])

  // Listen for real-time order updates
  useEffect(() => {
    if (socket) {
      socket.on("new-order", (orderData) => {
        setOrders((prev) => [orderData, ...prev])
        toast({
          title: "🔔 New Order!",
          description: `Order #${orderData.orderNumber} received`,
        })
      })

      return () => {
        socket.off("new-order")
      }
    }
  }, [socket])

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/vendor`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("streetEatsToken")}`,
        },
      })
      const data = await response.json()
      setOrders(data.orders || [])
    } catch (error) {
      console.error("Failed to fetch orders:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateOrderStatus = async (orderNumber: string, status: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${orderNumber}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("streetEatsToken")}`,
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        // Update local state
        setOrders((prev) => prev.map((order) => (order.id === orderNumber ? { ...order, status: status as any } : order)))

        toast({
          title: "✅ Order Updated",
          description: `Order status changed to ${status}`,
        })
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Failed to update order status",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "accepted":
        return "bg-blue-100 text-blue-800"
      case "preparing":
        return "bg-orange-100 text-orange-800"
      case "ready":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-orange-50">
      <Navbar title="Vendor Dashboard" showNotifications={true} />

      {/* Connection Status */}
      <div className="bg-white border-b px-4 py-2">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
            <span className="text-sm text-gray-600">
              {isConnected ? "Connected - Real-time updates active" : "Disconnected - Reconnecting..."}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            {orders.filter((o) => o.status === "pending").length} pending orders
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="menu">Menu</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {orders.filter((o) => o.status === "pending").length}
                  </div>
                  <div className="text-sm text-gray-600">Pending Orders</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {orders.filter((o) => o.status === "preparing").length}
                  </div>
                  <div className="text-sm text-gray-600">Preparing</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {orders.filter((o) => o.status === "ready").length}
                  </div>
                  <div className="text-sm text-gray-600">Ready</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {orders.filter((o) => o.status === "completed").length}
                  </div>
                  <div className="text-sm text-gray-600">Completed</div>
                </CardContent>
              </Card>
            </div>

            {/* Orders List */}
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">Loading orders...</div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Yet</h3>
                  <p className="text-gray-600">New orders will appear here in real-time</p>
                </div>
              ) : (
                orders.map((order) => (
                  <Card key={order.id} className="border-l-4 border-l-orange-500">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-lg">Order #{order.orderNumber}</h3>
                          <p className="text-gray-600">{order.customer.name}</p>
                          <p className="text-sm text-gray-500">{order.customer.phone}</p>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(order.status)}>{order.status.toUpperCase()}</Badge>
                          <p className="text-lg font-bold mt-2">₹{order.totalAmount}</p>
                          <p className="text-sm text-gray-500">{order.createdAt}</p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Items:</h4>
                        <div className="space-y-1">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>
                                {item.name} x {item.quantity}
                              </span>
                              <span>₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                     <div className="mb-4">
  <h4 className="font-medium mb-1">Delivery Address:</h4>
  <div className="text-sm text-gray-600 space-y-1">
    <p>{order.deliveryAddress.street}</p>
    <p>{`${order.deliveryAddress.city}, ${order.deliveryAddress.state}`}</p>
    <p>{order.deliveryAddress.pincode}</p>
  </div>
</div>

                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        {order.status === "pending" && (
                          <>
                            <Button
                              onClick={() => updateOrderStatus(order.id, "accepted")}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Accept
                            </Button>
                            <Button onClick={() => updateOrderStatus(order.id, "rejected")} variant="destructive">
                              <X className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                          </>
                        )}
                        {order.status === "accepted" && (
                          <Button onClick={() => updateOrderStatus(order.id, "preparing")}>
                            <Clock className="w-4 h-4 mr-2" />
                            Start Preparing
                          </Button>
                        )}
                        {order.status === "preparing" && (
                          <Button onClick={() => updateOrderStatus(order.id, "ready")}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Mark Ready
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
            </TabsContent>

          {/* Menu Tab */}
          <TabsContent value="menu">
            <MenuManager />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <Analytics />
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <VendorPage/>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
