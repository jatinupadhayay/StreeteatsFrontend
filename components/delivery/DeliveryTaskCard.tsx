"use client"

import { useState } from "react"
import { Phone, MapPin, Navigation, CheckCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface DeliveryTask {
  id: string
  vendor: string
  customer: string
  phone: string
  address: string
  items: string[]
  total: number
  distance: string
  estimatedTime: string
  status: "assigned" | "picked" | "on_way" | "delivered"
  orderTime: string
}

interface DeliveryTaskCardProps {
  task: DeliveryTask
}

export default function DeliveryTaskCard({ task }: DeliveryTaskCardProps) {
  const [currentStatus, setCurrentStatus] = useState(task.status)
  const { toast } = useToast()

  const updateStatus = (newStatus: "assigned" | "picked" | "on_way" | "delivered") => {
    setCurrentStatus(newStatus)
    toast({
      title: "Status Updated",
      description: `Order ${task.id} marked as ${newStatus.replace("_", " ")}`,
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "assigned":
        return "bg-orange-100 text-orange-800"
      case "picked":
        return "bg-blue-100 text-blue-800"
      case "on_way":
        return "bg-purple-100 text-purple-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "assigned":
        return "Assigned"
      case "picked":
        return "Picked Up"
      case "on_way":
        return "On the Way"
      case "delivered":
        return "Delivered"
      default:
        return "Unknown"
    }
  }

  const getNextAction = () => {
    switch (currentStatus) {
      case "assigned":
        return { text: "Mark as Picked", action: () => updateStatus("picked"), color: "bg-blue-500 hover:bg-blue-600" }
      case "picked":
        return { text: "On the Way", action: () => updateStatus("on_way"), color: "bg-purple-500 hover:bg-purple-600" }
      case "on_way":
        return {
          text: "Mark Delivered",
          action: () => updateStatus("delivered"),
          color: "bg-green-500 hover:bg-green-600",
        }
      default:
        return null
    }
  }

  const nextAction = getNextAction()

  return (
    <Card className="overflow-hidden border-l-4 border-l-orange-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Order #{task.id}</CardTitle>
            <CardDescription className="flex items-center space-x-4">
              <span>{task.vendor}</span>
              <span>•</span>
              <span>{task.orderTime}</span>
              <span>•</span>
              <Badge className={getStatusColor(currentStatus)}>{getStatusText(currentStatus)}</Badge>
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-green-600">₹{task.total}</div>
            <div className="text-sm text-gray-600">
              {task.distance} • {task.estimatedTime}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Customer Info */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="font-medium mb-2">Customer Details</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">{task.customer}</span>
              <Button size="sm" variant="outline">
                <Phone className="w-4 h-4 mr-2" />
                Call
              </Button>
            </div>
            <div className="flex items-start space-x-2">
              <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
              <span className="text-sm text-gray-600">{task.address}</span>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div>
          <h4 className="font-medium mb-2">Items ({task.items.length})</h4>
          <div className="space-y-1">
            {task.items.map((item, index) => (
              <div key={index} className="text-sm text-gray-600">
                • {item}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          {nextAction && (
            <Button onClick={nextAction.action} className={nextAction.color}>
              <CheckCircle className="w-4 h-4 mr-2" />
              {nextAction.text}
            </Button>
          )}
          <Button variant="outline" className="flex items-center justify-center">
            <Navigation className="w-4 h-4 mr-2" />
            Navigate
          </Button>
        </div>

        {/* Delivery Instructions */}
        {currentStatus === "on_way" && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">En Route to Customer</span>
            </div>
            <p className="text-xs text-blue-600 mt-1">Call customer when you're 2-3 minutes away for smooth delivery</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
