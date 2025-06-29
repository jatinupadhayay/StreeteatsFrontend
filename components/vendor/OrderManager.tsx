"use client"

import { useState } from "react"
import { Clock, CheckCircle, AlertTriangle, Phone, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

const pendingOrders = [
  {
    id: "SE123456",
    customer: "John Doe",
    phone: "+91 98765 43210",
    items: [
      { name: "Pani Puri (8pc)", quantity: 1, price: 60 },
      { name: "Bhel Puri", quantity: 1, price: 50 },
    ],
    total: 110,
    orderTime: "2:30 PM",
    type: "pickup",
    estimatedTime: 15,
    address: "Shop pickup",
  },
  {
    id: "SE123457",
    customer: "Priya Sharma",
    phone: "+91 87654 32109",
    items: [
      { name: "Vada Pav", quantity: 2, price: 50 },
      { name: "Masala Chai", quantity: 2, price: 40 },
    ],
    total: 90,
    orderTime: "2:45 PM",
    type: "delivery",
    estimatedTime: 25,
    address: "123 Park Street, Near City Mall",
  },
]

const activeOrders = [
  {
    id: "SE123455",
    customer: "Rahul Kumar",
    phone: "+91 76543 21098",
    items: [{ name: "Dahi Puri", quantity: 1, price: 70 }],
    total: 70,
    orderTime: "2:15 PM",
    type: "pickup",
    status: "preparing",
    estimatedTime: 5,
  },
]

export default function OrderManager() {
  const [orders, setOrders] = useState(pendingOrders)
  const [processing, setProcessing] = useState(activeOrders)
  const { toast } = useToast()

  const acceptOrder = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId)
    if (order) {
      setOrders(orders.filter((o) => o.id !== orderId))
      setProcessing([...processing, { ...order, status: "preparing" }])
      toast({
        title: "Order Accepted",
        description: `Order ${orderId} has been accepted and is now being prepared`,
      })
    }
  }

  const updateOrderStatus = (orderId: string, newStatus: string) => {
    setProcessing(processing.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)))
    toast({
      title: "Status Updated",
      description: `Order ${orderId} status updated to ${newStatus}`,
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "preparing":
        return "bg-orange-100 text-orange-800"
      case "ready":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{orders.length}</div>
            <div className="text-sm text-gray-600">New Orders</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{processing.length}</div>
            <div className="text-sm text-gray-600">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">12</div>
            <div className="text-sm text-gray-600">Completed Today</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">₹2,450</div>
            <div className="text-sm text-gray-600">Today's Revenue</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="new" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="new">New Orders ({orders.length})</TabsTrigger>
          <TabsTrigger value="active">Active Orders ({processing.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="space-y-4">
          {orders.length > 0 ? (
            orders.map((order) => (
              <Card key={order.id} className="border-l-4 border-l-orange-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                      <CardDescription className="flex items-center space-x-4">
                        <span>{order.customer}</span>
                        <span>•</span>
                        <span>{order.orderTime}</span>
                        <span>•</span>
                        <Badge
                          className={
                            order.type === "pickup" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                          }
                        >
                          {order.type === "pickup" ? "Pickup" : "Delivery"}
                        </Badge>
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-green-600">₹{order.total}</div>
                      <div className="text-sm text-gray-600">{order.estimatedTime} mins</div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Order Items */}
                  <div>
                    <h4 className="font-medium mb-2">Items</h4>
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>
                          {item.name} × {item.quantity}
                        </span>
                        <span>₹{item.price}</span>
                      </div>
                    ))}
                  </div>

                  {/* Customer Info */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{order.customer}</p>
                        <p className="text-sm text-gray-600 flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {order.address}
                        </p>
                      </div>
                      <Button size="sm" variant="outline">
                        <Phone className="w-4 h-4 mr-2" />
                        Call
                      </Button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Button onClick={() => acceptOrder(order.id)} className="flex-1 bg-green-500 hover:bg-green-600">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Accept Order
                    </Button>
                    <Button variant="outline" className="flex-1 text-red-600 border-red-200 hover:bg-red-50">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Decline
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No New Orders</h3>
              <p className="text-gray-600">New orders will appear here when customers place them</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {processing.length > 0 ? (
            processing.map((order) => (
              <Card key={order.id} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                      <CardDescription className="flex items-center space-x-4">
                        <span>{order.customer}</span>
                        <span>•</span>
                        <span>{order.orderTime}</span>
                        <span>•</span>
                        <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-green-600">₹{order.total}</div>
                      <div className="text-sm text-gray-600">{order.estimatedTime} mins left</div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Order Items */}
                  <div>
                    <h4 className="font-medium mb-2">Items</h4>
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>
                          {item.name} × {item.quantity}
                        </span>
                        <span>₹{item.price}</span>
                      </div>
                    ))}
                  </div>

                  {/* Status Update Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    {order.status === "preparing" && (
                      <Button
                        onClick={() => updateOrderStatus(order.id, "ready")}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        Mark Ready
                      </Button>
                    )}
                    {order.status === "ready" && (
                      <Button
                        onClick={() => updateOrderStatus(order.id, "completed")}
                        className="bg-blue-500 hover:bg-blue-600"
                      >
                        Mark Completed
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      <Phone className="w-4 h-4 mr-2" />
                      Call Customer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Orders</h3>
              <p className="text-gray-600">Orders you're currently preparing will appear here</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
