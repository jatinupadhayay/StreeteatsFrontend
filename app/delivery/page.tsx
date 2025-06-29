"use client"

import { useState, useEffect } from "react"
import { MapPin, Clock, Phone, Star, Navigation, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

const deliverySteps = [
  { id: 1, title: "Order Confirmed", description: "Your order has been confirmed", completed: true },
  { id: 2, title: "Preparing Food", description: "The vendor is preparing your order", completed: true },
  { id: 3, title: "Out for Delivery", description: "Your order is on the way", completed: true },
  { id: 4, title: "Delivered", description: "Order delivered successfully", completed: false },
]

const deliveryPerson = {
  name: "Rajesh Kumar",
  rating: 4.8,
  phone: "+91 98765 43210",
  vehicle: "Bike - MH 12 AB 1234",
  photo: "/placeholder.svg?height=80&width=80",
}

const orderDetails = {
  orderId: "SE123456",
  vendor: "Spice Street Corner",
  items: [
    { name: "Pani Puri (8pc)", quantity: 1, price: 60 },
    { name: "Bhel Puri", quantity: 1, price: 50 },
    { name: "Masala Chai", quantity: 2, price: 40 },
  ],
  total: 150,
  estimatedTime: "15-20 mins",
  deliveryAddress: "123, Park Street, Near City Mall, Mumbai - 400001",
}

export default function DeliveryPage() {
  const [currentStep, setCurrentStep] = useState(3)
  const [estimatedArrival, setEstimatedArrival] = useState(12) // minutes
  const [deliveryProgress, setDeliveryProgress] = useState(75)

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      if (estimatedArrival > 0) {
        setEstimatedArrival((prev) => prev - 1)
        setDeliveryProgress((prev) => Math.min(prev + 2, 100))
      }
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [estimatedArrival])

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Your Order</h1>
        <p className="text-gray-600">Order #{orderDetails.orderId}</p>
      </div>

      {/* Live Tracking */}
      <Card className="mb-8 bg-gradient-to-r from-green-50 to-green-100 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center text-green-800">
            <Navigation className="w-6 h-6 mr-2" />
            Live Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-2xl font-bold text-green-800">{estimatedArrival} mins</p>
              <p className="text-green-600">Estimated arrival</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-green-800">On the way!</p>
              <p className="text-green-600">Your order is being delivered</p>
            </div>
          </div>
          <Progress value={deliveryProgress} className="h-3 mb-2" />
          <p className="text-sm text-green-600 text-center">{deliveryProgress}% of the way to you</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Delivery Status */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deliverySteps.map((step, index) => (
                  <div key={step.id} className="flex items-start space-x-3">
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        step.completed
                          ? "bg-green-500 text-white"
                          : index === currentStep - 1
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
                            : index === currentStep - 1
                              ? "text-orange-800"
                              : "text-gray-500"
                        }`}
                      >
                        {step.title}
                      </h4>
                      <p className="text-sm text-gray-600">{step.description}</p>
                      {index === currentStep - 1 && (
                        <Badge className="mt-1 bg-orange-100 text-orange-800">Current Status</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Delivery Person */}
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
                  <h4 className="font-bold text-gray-900">{deliveryPerson.name}</h4>
                  <div className="flex items-center mb-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="ml-1 text-sm font-medium">{deliveryPerson.rating}</span>
                  </div>
                  <p className="text-sm text-gray-600">{deliveryPerson.vehicle}</p>
                </div>
                <Button size="sm" variant="outline">
                  <Phone className="w-4 h-4 mr-2" />
                  Call
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
              <CardDescription>From {orderDetails.vendor}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {orderDetails.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{item.name}</span>
                      <span className="text-gray-500 ml-2">× {item.quantity}</span>
                    </div>
                    <span className="font-medium">₹{item.price}</span>
                  </div>
                ))}
                <div className="border-t pt-3 mt-3">
                  <div className="flex items-center justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₹{orderDetails.total}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Delivery Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{orderDetails.deliveryAddress}</p>
            </CardContent>
          </Card>

          {/* Estimated Time */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Delivery Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-600 mb-2">{estimatedArrival} mins</p>
                <p className="text-gray-600">Estimated delivery time</p>
                <p className="text-sm text-gray-500 mt-2">Original estimate: {orderDetails.estimatedTime}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Help Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center">
              <Phone className="w-6 h-6 mb-2" />
              <span className="font-medium">Call Support</span>
              <span className="text-sm text-gray-500">1800-123-4567</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center">
              <MapPin className="w-6 h-6 mb-2" />
              <span className="font-medium">Track on Map</span>
              <span className="text-sm text-gray-500">Real-time location</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center">
              <Clock className="w-6 h-6 mb-2" />
              <span className="font-medium">Report Issue</span>
              <span className="text-sm text-gray-500">Order problems</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
