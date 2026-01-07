"use client"

import { useState, useEffect } from "react"
import { Plus, Megaphone, Trash2, Loader2, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"

export default function Promotions() {
  const [promotions, setPromotions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "percentage",
    value: 0,
    minimumOrder: 0,
    validTill: "",
    usageLimit: 100,
  })

  useEffect(() => {
    fetchPromotions()
  }, [])

  const fetchPromotions = async () => {
    try {
      setLoading(true)
      const response = await api.vendors.getPromotions()
      if (response.success) {
        setPromotions(response.promotions)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch promotions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePromotion = async () => {
    if (!formData.title || !formData.value) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      const response = await api.vendors.createPromotion(formData)
      if (response.success) {
        toast({
          title: "Promotion Created",
          description: "Your new promotion is now live!",
        })
        setIsCreating(false)
        setFormData({
          title: "",
          description: "",
          type: "percentage",
          value: 0,
          minimumOrder: 0,
          validTill: "",
          usageLimit: 100,
        })
        fetchPromotions()
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create promotion",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeletePromotion = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this promotion?")) return

    try {
      const response = await api.vendors.deletePromotion(id)
      if (response.success) {
        toast({
          title: "Promotion Deleted",
          description: "Offer has been removed",
        })
        fetchPromotions()
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete promotion",
        variant: "destructive",
      })
    }
  }

  const getPromotionTypeColor = (type: string) => {
    switch (type) {
      case "percentage": return "bg-green-100 text-green-800"
      case "buy_one_get_one": return "bg-blue-100 text-blue-800"
      case "fixed": return "bg-purple-100 text-purple-800"
      case "free_delivery": return "bg-amber-100 text-amber-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getPromotionTypeText = (type: string) => {
    switch (type) {
      case "percentage": return "Percentage Off"
      case "buy_one_get_one": return "BOGO"
      case "fixed": return "Fixed Discount"
      case "free_delivery": return "Free Delivery"
      default: return type
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promotions & Offers</h1>
          <p className="text-gray-600">Create and manage special offers for your customers</p>
        </div>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)} className="bg-orange-500 hover:bg-orange-600">
            <Plus className="w-4 h-4 mr-2" />
            Create Offer
          </Button>
        )}
      </div>

      {isCreating && (
        <Card className="border-orange-200 bg-orange-50 shadow-md">
          <CardHeader>
            <CardTitle className="text-orange-800">Create New Promotion</CardTitle>
            <CardDescription>Set up a special offer for your customers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Offer Title *</label>
                <Input
                  placeholder="e.g., 20% Off Weekend Special"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Offer Type</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md bg-white h-10"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="percentage">Percentage Discount</option>
                  <option value="fixed">Fixed Amount Off</option>
                  <option value="buy_one_get_one">Buy One Get One</option>
                  <option value="free_delivery">Free Delivery</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Discount Value *</label>
                <Input
                  type="number"
                  placeholder="20"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Minimum Order (₹)</label>
                <Input
                  type="number"
                  placeholder="200"
                  value={formData.minimumOrder || ""}
                  onChange={(e) => setFormData({ ...formData, minimumOrder: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Valid Until</label>
                <Input
                  type="date"
                  value={formData.validTill}
                  onChange={(e) => setFormData({ ...formData, validTill: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Max Usage Limit</label>
                <Input
                  type="number"
                  placeholder="100"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                placeholder="Describe your offer to attract customers"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="flex space-x-2 pt-2">
              <Button
                onClick={handleCreatePromotion}
                className="bg-orange-500 hover:bg-orange-600"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create Promotion
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)} disabled={isSubmitting}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 border-b pb-2">Active Promotions</h2>

        {promotions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-dashed text-gray-500">
            No active promotions. Create one to attract more customers!
          </div>
        ) : (
          promotions.map((promotion) => (
            <Card key={promotion._id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold text-orange-950">{promotion.title}</CardTitle>
                    <CardDescription className="text-orange-800">{promotion.description}</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={`${getPromotionTypeColor(promotion.type)} border-none shadow-sm`}>
                      {getPromotionTypeText(promotion.type)}
                    </Badge>
                    <Badge variant={promotion.isActive ? "default" : "secondary"} className={promotion.isActive ? "bg-green-500 hover:bg-green-600" : ""}>
                      {promotion.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="bg-orange-50/50 p-2 rounded-lg">
                    <p className="text-gray-600 text-xs">Discount</p>
                    <p className="font-bold text-lg text-orange-700">
                      {promotion.type === "percentage" ? `${promotion.value}%` : `₹${promotion.value}`}
                    </p>
                  </div>
                  <div className="bg-blue-50/50 p-2 rounded-lg">
                    <p className="text-gray-600 text-xs">Min Order</p>
                    <p className="font-bold text-lg text-blue-700">₹{promotion.minimumOrder || 0}</p>
                  </div>
                  <div className="bg-purple-50/50 p-2 rounded-lg">
                    <p className="text-gray-600 text-xs">Valid Until</p>
                    <p className="font-bold text-lg text-purple-700">
                      {promotion.validTill ? new Date(promotion.validTill).toLocaleDateString() : "No Limit"}
                    </p>
                  </div>
                  <div className="bg-green-50/50 p-2 rounded-lg">
                    <p className="text-gray-600 text-xs">Redeemed</p>
                    <p className="font-bold text-lg text-green-700">
                      {promotion.usedCount || 0} / {promotion.usageLimit || "∞"}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeletePromotion(promotion._id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                    <Megaphone className="w-4 h-4 mr-2" />
                    Push to Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
