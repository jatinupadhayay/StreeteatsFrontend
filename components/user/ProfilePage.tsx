"use client"

import { useState } from "react"
import { User, MapPin, CreditCard, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/AuthContext"

export default function ProfilePage() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)

  const savedAddresses = [
    { id: 1, label: "Home", address: "123 Park Street, Near City Mall, Mumbai - 400001", isDefault: true },
    { id: 2, label: "Office", address: "456 Business District, Andheri East, Mumbai - 400069", isDefault: false },
  ]

  const paymentMethods = [
    { id: 1, type: "UPI", details: "john.doe@paytm", isDefault: true },
    { id: 2, type: "Card", details: "**** **** **** 1234", isDefault: false },
  ]

  const orderHistory = [
    {
      id: "SE123456",
      vendor: "Spice Street Corner",
      items: ["Pani Puri", "Bhel Puri"],
      total: 110,
      date: "2024-01-15",
      status: "Delivered",
    },
    {
      id: "SE123455",
      vendor: "Taco Fiesta",
      items: ["Fish Tacos", "Nachos"],
      total: 250,
      date: "2024-01-14",
      status: "Delivered",
    },
  ]

  return (
    <div className="p-4 space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-xl">{user?.name}</CardTitle>
                <CardDescription>{user?.email}</CardDescription>
                <p className="text-sm text-gray-600">{user?.phone}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
        </CardHeader>
        {isEditing && (
          <CardContent className="space-y-4">
            <Input placeholder="Full Name" defaultValue={user?.name} />
            <Input placeholder="Email" defaultValue={user?.email} />
            <Input placeholder="Phone" defaultValue={user?.phone} />
            <div className="flex space-x-2">
              <Button className="bg-orange-500 hover:bg-orange-600">Save Changes</Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Profile Tabs */}
      <Tabs defaultValue="addresses" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="history">Order History</TabsTrigger>
        </TabsList>

        <TabsContent value="addresses" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Saved Addresses</h3>
            <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
              <MapPin className="w-4 h-4 mr-2" />
              Add Address
            </Button>
          </div>

          {savedAddresses.map((address) => (
            <Card key={address.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium">{address.label}</h4>
                      {address.isDefault && <Badge className="bg-green-100 text-green-800 text-xs">Default</Badge>}
                    </div>
                    <p className="text-sm text-gray-600">{address.address}</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Payment Methods</h3>
            <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
              <CreditCard className="w-4 h-4 mr-2" />
              Add Payment
            </Button>
          </div>

          {paymentMethods.map((method) => (
            <Card key={method.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">{method.type}</h4>
                      <p className="text-sm text-gray-600">{method.details}</p>
                    </div>
                    {method.isDefault && <Badge className="bg-green-100 text-green-800 text-xs">Default</Badge>}
                  </div>
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <h3 className="text-lg font-semibold">Recent Orders</h3>

          {orderHistory.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium">Order #{order.id}</h4>
                    <p className="text-sm text-gray-600">{order.vendor}</p>
                    <p className="text-xs text-gray-500">{order.date}</p>
                  </div>
                  <Badge
                    className={
                      order.status === "Delivered" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"
                    }
                  >
                    {order.status}
                  </Badge>
                </div>

                <div className="space-y-1 mb-3">
                  {order.items.map((item, index) => (
                    <p key={index} className="text-sm text-gray-600">
                      • {item}
                    </p>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-bold">₹{order.total}</span>
                  <div className="space-x-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
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
