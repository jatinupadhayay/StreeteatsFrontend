"use client"

import { useState } from "react"
import { Plus, Megaphone, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

const activePromotions = [
  {
    id: 1,
    title: "20% Off on Orders Above ₹200",
    description: "Get 20% discount on all orders above ₹200",
    type: "percentage",
    value: 20,
    minOrder: 200,
    validUntil: "2024-01-20",
    isActive: true,
    usageCount: 15,
    maxUsage: 100,
  },
  {
    id: 2,
    title: "Buy 2 Get 1 Free Pani Puri",
    description: "Special offer on our signature pani puri",
    type: "bogo",
    value: 1,
    minOrder: 0,
    validUntil: "2024-01-18",
    isActive: true,
    usageCount: 8,
    maxUsage: 50,
  },
]

export default function Promotions() {
  const [promotions, setPromotions] = useState(activePromotions)
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()

  const createPromotion = () => {
    toast({
      title: "Promotion Created",
      description: "Your new promotion is now live and visible to customers",
    })
    setIsCreating(false)
  }

  const togglePromotion = (id: number) => {
    setPromotions((promos) =>
      promos.map((promo) => (promo.id === id ? { ...promo, isActive: !promo.isActive } : promo)),
    )
  }

  const getPromotionTypeColor = (type: string) => {
    switch (type) {
      case "percentage":
        return "bg-green-100 text-green-800"
      case "bogo":
        return "bg-blue-100 text-blue-800"
      case "fixed":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPromotionTypeText = (type: string) => {
    switch (type) {
      case "percentage":
        return "Percentage Off"
      case "bogo":
        return "Buy One Get One"
      case "fixed":
        return "Fixed Discount"
      default:
        return "Unknown"
    }
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promotions & Offers</h1>
          <p className="text-gray-600">Create and manage special offers for your customers</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="w-4 h-4 mr-2" />
          Create Offer
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{promotions.length}</div>
            <div className="text-sm text-gray-600">Active Offers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">23</div>
            <div className="text-sm text-gray-600">Total Redemptions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">₹1,250</div>
            <div className="text-sm text-gray-600">Revenue from Offers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">15%</div>
            <div className="text-sm text-gray-600">Conversion Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Create New Promotion */}
      {isCreating && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">Create New Promotion</CardTitle>
            <CardDescription>Set up a special offer for your customers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Offer Title</label>
                <Input placeholder="e.g., 20% Off Weekend Special" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Offer Type</label>
                <select className="w-full p-2 border border-gray-300 rounded-md">
                  <option value="percentage">Percentage Discount</option>
                  <option value="fixed">Fixed Amount Off</option>
                  <option value="bogo">Buy One Get One</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Discount Value</label>
                <Input type="number" placeholder="20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Order (₹)</label>
                <Input type="number" placeholder="200" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Valid Until</label>
                <Input type="date" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Usage</label>
                <Input type="number" placeholder="100" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <Input placeholder="Describe your offer to attract customers" />
            </div>
            <div className="flex space-x-2">
              <Button onClick={createPromotion} className="bg-orange-500 hover:bg-orange-600">
                Create Promotion
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Promotions */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Active Promotions</h2>

        {promotions.map((promotion) => (
          <Card key={promotion.id} className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{promotion.title}</CardTitle>
                  <CardDescription>{promotion.description}</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getPromotionTypeColor(promotion.type)}>
                    {getPromotionTypeText(promotion.type)}
                  </Badge>
                  <Badge className={promotion.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                    {promotion.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              {/* Promotion Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Discount</p>
                  <p className="font-medium">
                    {promotion.type === "percentage"
                      ? `${promotion.value}%`
                      : promotion.type === "fixed"
                        ? `₹${promotion.value}`
                        : `${promotion.value} Free`}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Min Order</p>
                  <p className="font-medium">₹{promotion.minOrder}</p>
                </div>
                <div>
                  <p className="text-gray-600">Valid Until</p>
                  <p className="font-medium">{promotion.validUntil}</p>
                </div>
                <div>
                  <p className="text-gray-600">Usage</p>
                  <p className="font-medium">
                    {promotion.usageCount}/{promotion.maxUsage}
                  </p>
                </div>
              </div>

              {/* Usage Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Usage Progress</span>
                  <span className="text-sm text-gray-600">
                    {Math.round((promotion.usageCount / promotion.maxUsage) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full"
                    style={{ width: `${(promotion.usageCount / promotion.maxUsage) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant={promotion.isActive ? "outline" : "default"}
                  onClick={() => togglePromotion(promotion.id)}
                  className={
                    promotion.isActive
                      ? "text-red-600 border-red-200 hover:bg-red-50"
                      : "bg-green-500 hover:bg-green-600"
                  }
                >
                  {promotion.isActive ? "Deactivate" : "Activate"}
                </Button>
                <Button size="sm" variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
                <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                  <Megaphone className="w-4 h-4 mr-2" />
                  Push to Customers
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Promotion Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Templates</CardTitle>
          <CardDescription>Start with these popular promotion templates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
              <h4 className="font-medium mb-2">Weekend Special</h4>
              <p className="text-sm text-gray-600 mb-3">20% off on weekend orders</p>
              <Badge className="bg-green-100 text-green-800">Popular</Badge>
            </div>
            <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
              <h4 className="font-medium mb-2">First Order Discount</h4>
              <p className="text-sm text-gray-600 mb-3">₹50 off for new customers</p>
              <Badge className="bg-blue-100 text-blue-800">New Customer</Badge>
            </div>
            <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
              <h4 className="font-medium mb-2">Bulk Order Deal</h4>
              <p className="text-sm text-gray-600 mb-3">15% off on orders above ₹500</p>
              <Badge className="bg-purple-100 text-purple-800">High Value</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
