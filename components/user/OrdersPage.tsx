"use client"

import { useState } from "react"
import { Clock, CheckCircle, MapPin, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const activeOrders = [
  {
    id: "SE123456",
    vendor: "Spice Street Corner",
    items: [
      { name: "Pani Puri (8pc)", quantity: 1, price: 60 },
      { name: "Bhel Puri", quantity: 1, price: 50 },
    ],
    total: 110,
    status: "preparing",
    estimatedTime: 15,
    progress: 40,
    deliveryPerson: {
      name: "Rajesh Kumar",
      phone: "+91 98765 43210",
      rating: 4.8,
    },
  },
]

const pastOrders = [
  {
    id: "SE123455",
    vendor: "Taco Fiesta",
    items: [
      { name: "Fish Tacos (3pc)", quantity: 1, price: 200 },
      { name: "Nachos", quantity: 1, price: 150 },
    ],
    total: 350,
    status: "delivered",
    date: "2024-01-14",
    rating: 5,
  },
  {
    id: "SE123454",
    vendor: "Noodle Express",
    items: [{ name: "Veg Hakka Noodles", quantity: 2, price: 160 }],
    total: 160,
    status: "delivered",
    date: "2024-01-13",
    rating: 4,
  },
]

const orderSteps = [
  { id: 1, title: "Order Confirmed", completed: true },
  { id: 2, title: "Preparing", completed: true },
  { id: 3, title: "Ready for Pickup", completed: false },
  { id: 4, title: "Delivered", completed: false },
]

export default function OrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "preparing":
        return "bg-orange-100 text-orange-800"
      case "ready":
        return "bg-blue-100 text-blue-800"
      case "out_for_delivery":
        return "bg-purple-100 text-purple-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "preparing":
        return "Preparing"
      case "ready":
        return "Ready for Pickup"
      case "out_for_delivery":
        return "Out for Delivery"
      case "delivered":
        return "Delivered"
      default:
        return "Unknown"
    }
  }

  return (
    <div className="p-4 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Orders</h1>
        <p className="text-gray-600">Track your current and past orders</p>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">Active Orders ({activeOrders.length})</TabsTrigger>
          <TabsTrigger value="history">Order History</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeOrders.length > 0 ? (
            activeOrders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                      <CardDescription>{order.vendor}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(order.status)}>{getStatusText(order.status)}</Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-4">
                  {/* Order Items */}
                  <div>
                    <h4 className="font-medium mb-2">Items Ordered</h4>
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>
                          {item.name} × {item.quantity}
                        </span>
                        <span>₹{item.price}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                      <span>Total</span>
                      <span>₹{order.total}</span>
                    </div>
                  </div>

                  {/* Progress Tracking */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Order Progress</h4>
                      <span className="text-sm text-gray-600">{order.estimatedTime} mins remaining</span>
                    </div>
                    <Progress value={order.progress} className="h-2 mb-2" />

                    <div className="grid grid-cols-4 gap-2 text-xs">
                      {orderSteps.map((step) => (
                        <div key={step.id} className="text-center">
                          <div
                            className={`w-6 h-6 rounded-full mx-auto mb-1 flex items-center justify-center ${
                              step.completed ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
                            }`}
                          >
                            {step.completed ? <CheckCircle className="w-3 h-3" /> : step.id}
                          </div>
                          <span className={step.completed ? "text-green-600" : "text-gray-500"}>{step.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Person Info */}
                  {order.deliveryPerson && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="font-medium mb-2">Delivery Partner</h4>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-orange-600">
                              {order.deliveryPerson.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">{order.deliveryPerson.name}</p>
                            <p className="text-xs text-gray-600">Rating: {order.deliveryPerson.rating} ⭐</p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          <Phone className="w-4 h-4 mr-2" />
                          Call
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
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
          {pastOrders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium">Order #{order.id}</h4>
                    <p className="text-sm text-gray-600">{order.vendor}</p>
                    <p className="text-xs text-gray-500">{order.date}</p>
                  </div>
                  <Badge className={getStatusColor(order.status)}>{getStatusText(order.status)}</Badge>
                </div>

                <div className="space-y-1 mb-3">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>
                        {item.name} × {item.quantity}
                      </span>
                      <span>₹{item.price}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-bold">₹{order.total}</span>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                      <span className="text-sm mr-1">Rating:</span>
                      <span className="text-sm">{"⭐".repeat(order.rating)}</span>
                    </div>
                    <Button size="sm" variant="outline">
                      Reorder
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
