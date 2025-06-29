"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api"

export default function VendorRegistration({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    ownerName: "",
    email: "",
    password: "",
    phone: "",
    shopName: "",
    shopDescription: "",
    cuisine: "",
    licenseNumber: "",
    gstNumber: "",
    bankAccount: "",
    ifscCode: "",
    openingTime: "",
    closingTime: "",
    deliveryRadius: "",
    // Address fields with default values
    "address.street": "",
    "address.city": "",
    "address.state": "",
    "address.pincode": "",
  })

  const [files, setFiles] = useState({
    shopImage: null as File | null,
    licenseDocument: null as File | null,
    ownerPhoto: null as File | null,
  })

  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const formDataToSend = new FormData()

    // Append all form fields (flattened)
    Object.entries(formData).forEach(([key, value]) => {
      formDataToSend.append(key, value)
    })

    // Add files
    Object.entries(files).forEach(([key, file]) => {
      if (file) {
        formDataToSend.append(key, file)
      }
    })

    try {
      console.log(formDataToSend)
      const response = await api.auth.registerVendor(formDataToSend)
      if (response) {
        alert("Vendor registration submitted successfully ✅! Awaiting admin approval.")
        onSuccess()
      }
    } catch (error: any) {
      console.error("Registration failed:", error)
      alert(error.message || "Registration failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Helper to update form data
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  // Special handler for address fields
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [`address.${id}`]: value }))
  }

  return (
    <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
      <CardHeader>
        <CardTitle>Vendor Registration</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Owner Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Owner Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ownerName">Owner Name *</Label>
                <Input
                  id="ownerName"
                  value={formData.ownerName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* Shop Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Shop Details</h3>
            <div>
              <Label htmlFor="shopName">Shop Name *</Label>
              <Input
                id="shopName"
                value={formData.shopName}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="shopDescription">Shop Description *</Label>
              <Textarea
                id="shopDescription"
                value={formData.shopDescription}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="cuisine">Cuisine Types * (comma separated)</Label>
              <Input
                id="cuisine"
                placeholder="e.g., Indian, Chinese, Fast Food"
                value={formData.cuisine}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Address Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Address Details *</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="street">Street</Label>
                <Input
                  id="street"
                  value={formData["address.street"]}
                  onChange={handleAddressChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData["address.city"]}
                  onChange={handleAddressChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData["address.state"]}
                  onChange={handleAddressChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  value={formData["address.pincode"]}
                  onChange={handleAddressChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* Business Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Business Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="licenseNumber">Business License Number *</Label>
                <Input
                  id="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="gstNumber">GST Number (Optional)</Label>
                <Input
                  id="gstNumber"
                  value={formData.gstNumber}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label htmlFor="bankAccount">Bank Account Number *</Label>
                <Input
                  id="bankAccount"
                  value={formData.bankAccount}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="ifscCode">IFSC Code *</Label>
                <Input
                  id="ifscCode"
                  value={formData.ifscCode}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* Operational Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Operational Details *</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="openingTime">Opening Time</Label>
                <Input
                  id="openingTime"
                  type="time"
                  value={formData.openingTime}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="closingTime">Closing Time</Label>
                <Input
                  id="closingTime"
                  type="time"
                  value={formData.closingTime}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="deliveryRadius">Delivery Radius (in km) *</Label>
                <Input
                  id="deliveryRadius"
                  type="number"
                  min="1"
                  value={formData.deliveryRadius}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* File Uploads */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Upload Documents *</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="shopImage">Shop Image (JPG, PNG, GIF)</Label>
                <Input
                  id="shopImage"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFiles({ ...files, shopImage: e.target.files?.[0] || null })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="licenseDocument">Business License (Image or PDF)</Label>
                <Input
                  id="licenseDocument"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setFiles({ ...files, licenseDocument: e.target.files?.[0] || null })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="ownerPhoto">Owner Photo (JPG, PNG, GIF)</Label>
                <Input
                  id="ownerPhoto"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFiles({ ...files, ownerPhoto: e.target.files?.[0] || null })}
                  required
                />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Submitting..." : "Submit Vendor Application"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}