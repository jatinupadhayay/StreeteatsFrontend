"use client"

import { CheckCircle, Star, MapPin, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const completedDeliveries = [
  {
    id: "SE123454",
    vendor: "Spice Street Corner",
    customer: "Rahul Kumar",
    address: "456 Business Park, Andheri",
    items: ["Pani Puri", "Masala Chai"],
    total: 80,
    earnings: 40,
    distance: "1.5 km",
    completedAt: "1:45 PM",
    date: "Today",
    rating: 5,
    tip: 10,
  },
  {
    id: "SE123453",
    vendor: "Taco Fiesta",
    customer: "Sneha Patel",
    address: "789 Residential Complex, Bandra",
    items: ["Fish Tacos", "Nachos"],
    total: 300,
    earnings: 50,
    distance: "2.3 km",
    completedAt: "12:30 PM",
    date: "Today",
    rating: 4,
    tip: 0,
  },
  {
    id: "SE123452",
    vendor: "Noodle Express",
    customer: "Amit Sharma",
    address: "321 Tech Hub, Powai",
    items: ["Veg Hakka Noodles"],
    total: 120,
    earnings: 35,
    distance: "1.8 km",
    completedAt: "6:20 PM",
    date: "Yesterday",
    rating: 5,
    tip: 15,
  },
]

export default function DeliveryHistory() {
  const todayEarnings = completedDeliveries
    .filter((delivery) => delivery.date === "Today")
    .reduce((sum, delivery) => sum + delivery.earnings + delivery.tip, 0)

  const todayDeliveries = completedDeliveries.filter((delivery) => delivery.date === "Today").length

  return (
    <div className="p-4 space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">₹{todayEarnings}</div>
            <div className="text-sm text-gray-600">Today's Earnings</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{todayDeliveries}</div>
            <div className="text-sm text-gray-600">Deliveries Today</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">4.8</div>
            <div className="text-sm text-gray-600">Avg Rating</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">₹25</div>
            <div className="text-sm text-gray-600">Tips Received</div>
          </CardContent>
        </Card>
      </div>

      {/* Delivery History */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Recent Deliveries</h2>

        {completedDeliveries.map((delivery) => (
          <Card key={delivery.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    Order #{delivery.id}
                  </CardTitle>
                  <CardDescription className="flex items-center space-x-4">
                    <span>{delivery.vendor}</span>
                    <span>•</span>
                    <span>{delivery.completedAt}</span>
                    <span>•</span>
                    <Badge className="bg-green-100 text-green-800">{delivery.date}</Badge>
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-green-600">₹{delivery.earnings + delivery.tip}</div>
                  <div className="text-sm text-gray-600">
                    ₹{delivery.earnings} + ₹{delivery.tip} tip
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Customer & Location */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{delivery.customer}</p>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-1" />
                    {delivery.address}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-1" />
                    {delivery.distance}
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="font-medium mb-1">Items Delivered</h4>
                <div className="space-y-1">
                  {delivery.items.map((item, index) => (
                    <div key={index} className="text-sm text-gray-600">
                      • {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Rating & Order Value */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                    <span className="text-sm font-medium">{delivery.rating}/5</span>
                  </div>
                  <span className="text-sm text-gray-600">Order Value: ₹{delivery.total}</span>
                </div>
                {delivery.tip > 0 && (
                  <Badge className="bg-purple-100 text-purple-800">₹{delivery.tip} Tip Received</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>This Week's Performance</CardTitle>
          <CardDescription>Your delivery statistics for the current week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">36</div>
              <div className="text-sm text-gray-600">Total Deliveries</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">₹1,840</div>
              <div className="text-sm text-gray-600">Total Earnings</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">4.7</div>
              <div className="text-sm text-gray-600">Average Rating</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
