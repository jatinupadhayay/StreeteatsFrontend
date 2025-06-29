"use client"

import type React from "react"


import { useState, useEffect } from "react"
import { Edit, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useVendorDashboard, useUpdateVendorProfile } from "@/hooks/useApi"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

// Helper to format operational hours for display
const formatOperationalHours = (hours: any) => {
  if (!hours) return "N/A"
  return Object.entries(hours)
    .map(([day, time]: [string, any]) => {
      if (time && time.open && time.close) {
        return `${day.charAt(0).toUpperCase() + day.slice(1)}: ${time.open} - ${time.close}`
      }
      return null
    })
    .filter(Boolean)
    .join(", ")
}

export default function VendorProfile() {
  const { data: dashboardData, loading, error, refetch } = useVendorDashboard()
  const { execute: updateProfile, loading: isUpdating } = useUpdateVendorProfile()
  const { toast } = useToast()

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<any>({})
  const [shopImageFile, setShopImageFile] = useState<File | null>(null)

  useEffect(() => {
    if (dashboardData?.vendor) {
      // Initialize form data with fetched vendor data
      setFormData({
        shopName: dashboardData.vendor.shopName || "",
        shopDescription: dashboardData.vendor.shopDescription || "",
        cuisine: dashboardData.vendor.cuisine?.join(", ") || "",
        "address.street": dashboardData.vendor.address?.street || "",
        "address.city": dashboardData.vendor.address?.city || "",
        "address.state": dashboardData.vendor.address?.state || "",
        "address.pincode": dashboardData.vendor.address?.pincode || "",
        "contact.website": dashboardData.vendor.contact?.website || "",
        "contact.socialMedia": dashboardData.vendor.contact?.socialMedia || "",
        operationalHours: dashboardData.vendor.operationalHours || {},
        deliveryRadius: dashboardData.vendor.deliveryRadius || 0,
        minimumOrderValue: dashboardData.vendor.minimumOrderValue || 0,
        averagePreparationTime: dashboardData.vendor.averagePreparationTime || 0,
        shopImageUrl: dashboardData.vendor.images?.shop || "/placeholder.svg", // Current image URL
      })
    }
  }, [dashboardData])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev: any) => ({ ...prev, [name]: value }))
  }

  const handleOperationalHoursChange = (day: string, field: "open" | "close", value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      operationalHours: {
        ...prev.operationalHours,
        [day]: {
          ...prev.operationalHours[day],
          [field]: value,
        },
      },
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setShopImageFile(e.target.files[0])
      setFormData((prev: any) => ({
        ...prev,
        shopImageUrl: URL.createObjectURL(e.target.files![0]), // Show preview
      }))
    }
  }

  const handleSubmit = async () => {
    const dataToSend = new FormData()
    for (const key in formData) {
      if (key === "operationalHours") {
        dataToSend.append(key, JSON.stringify(formData[key])) // Stringify nested objects
      } else if (key !== "shopImageUrl") {
        // Don't send the preview URL
        dataToSend.append(key, formData[key])
      }
    }
    if (shopImageFile) {
      dataToSend.append("shopImage", shopImageFile)
    }

    try {
      await updateProfile(dataToSend)
      toast({
        title: "✅ Profile Updated",
        description: "Your vendor profile has been successfully updated.",
      })
      setIsEditing(false)
      refetch() // Re-fetch data to ensure UI is in sync
    } catch (err: any) {
      toast({
        title: "❌ Update Failed",
        description: err.message || "There was an error updating your profile.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="p-4 space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error) {
    return <div className="p-4 text-red-500">Error loading vendor profile: {error}</div>
  }

  const vendor = dashboardData?.vendor

  return (
    <div className="p-4 space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img
                src={formData.shopImageUrl || "/placeholder.svg"}
                alt={`${vendor?.shopName} shop image`}
                className="w-24 h-24 rounded-lg object-cover"
              />
              <div>
                <CardTitle className="text-2xl">{vendor?.shopName}</CardTitle>
                <CardDescription>{vendor?.shopDescription}</CardDescription>
                <p className="text-sm text-gray-600">Cuisine: {vendor?.cuisine?.join(", ")}</p>
                <Badge className={vendor?.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                  {vendor?.isActive ? "Online" : "Offline"}
                </Badge>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        {isEditing && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shopName">Shop Name</Label>
                <Input id="shopName" name="shopName" value={formData.shopName} onChange={handleInputChange} />
              </div>
              <div>
                <Label htmlFor="cuisine">Cuisine (comma-separated)</Label>
                <Input id="cuisine" name="cuisine" value={formData.cuisine} onChange={handleInputChange} />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="shopDescription">Shop Description</Label>
                <Textarea
                  id="shopDescription"
                  name="shopDescription"
                  value={formData.shopDescription}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="address.street">Street Address</Label>
                <Input
                  id="address.street"
                  name="address.street"
                  value={formData["address.street"]}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="address.city">City</Label>
                <Input
                  id="address.city"
                  name="address.city"
                  value={formData["address.city"]}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="address.state">State</Label>
                <Input
                  id="address.state"
                  name="address.state"
                  value={formData["address.state"]}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="address.pincode">Pincode</Label>
                <Input
                  id="address.pincode"
                  name="address.pincode"
                  value={formData["address.pincode"]}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="contact.website">Website</Label>
                <Input
                  id="contact.website"
                  name="contact.website"
                  value={formData["contact.website"]}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="contact.socialMedia">Social Media Link</Label>
                <Input
                  id="contact.socialMedia"
                  name="contact.socialMedia"
                  value={formData["contact.socialMedia"]}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="deliveryRadius">Delivery Radius (km)</Label>
                <Input
                  id="deliveryRadius"
                  name="deliveryRadius"
                  type="number"
                  value={formData.deliveryRadius}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="minimumOrderValue">Minimum Order Value (₹)</Label>
                <Input
                  id="minimumOrderValue"
                  name="minimumOrderValue"
                  type="number"
                  value={formData.minimumOrderValue}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="averagePreparationTime">Avg. Prep Time (mins)</Label>
                <Input
                  id="averagePreparationTime"
                  name="averagePreparationTime"
                  type="number"
                  value={formData.averagePreparationTime}
                  onChange={handleInputChange}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Operational Hours</Label>
                {Object.keys(formData.operationalHours || {}).map((day) => (
                  <div key={day} className="flex items-center space-x-2 mb-2">
                    <Label className="w-24 capitalize">{day}</Label>
                    <Input
                      type="time"
                      value={formData.operationalHours[day]?.open || ""}
                      onChange={(e) => handleOperationalHoursChange(day, "open", e.target.value)}
                    />
                    <span>-</span>
                    <Input
                      type="time"
                      value={formData.operationalHours[day]?.close || ""}
                      onChange={(e) => handleOperationalHoursChange(day, "close", e.target.value)}
                    />
                  </div>
                ))}
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="shopImage">Shop Image</Label>
                <Input id="shopImage" name="shopImage" type="file" accept="image/*" onChange={handleFileChange} />
                {formData.shopImageUrl && (
                  <img
                    src={formData.shopImageUrl || "/placeholder.svg"}
                    alt="Shop Preview"
                    className="mt-2 h-24 w-24 object-cover rounded-md"
                  />
                )}
              </div>
            </div>
            <div className="flex space-x-2 mt-4">
              <Button onClick={handleSubmit} disabled={isUpdating} className="bg-orange-500 hover:bg-orange-600">
                {isUpdating ? "Saving..." : "Save Changes"}
                <Save className="w-4 h-4 ml-2" />
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Display Current Profile Details (when not editing) */}
      {!isEditing && (
        <Card>
          <CardHeader>
            <CardTitle>Current Profile Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-gray-700">
            <p>
              <strong>Shop Name:</strong> {vendor?.shopName}
            </p>
            <p>
              <strong>Description:</strong> {vendor?.shopDescription || "N/A"}
            </p>
            <p>
              <strong>Cuisine:</strong> {vendor?.cuisine?.join(", ") || "N/A"}
            </p>
            <p>
              <strong>Address:</strong> {vendor?.address?.street}, {vendor?.address?.city}, {vendor?.address?.state} -{" "}
              {vendor?.address?.pincode}
            </p>
            <p>
              <strong>Website:</strong> {vendor?.contact?.website || "N/A"}
            </p>
            <p>
              <strong>Social Media:</strong> {vendor?.contact?.socialMedia || "N/A"}
            </p>
            <p>
              <strong>Operational Hours:</strong> {formatOperationalHours(vendor?.operationalHours)}
            </p>
            <p>
              <strong>Delivery Radius:</strong> {vendor?.deliveryRadius} km
            </p>
            <p>
              <strong>Minimum Order Value:</strong> ₹{vendor?.minimumOrderValue}
            </p>
            <p>
              <strong>Average Preparation Time:</strong> {vendor?.averagePreparationTime} mins
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
