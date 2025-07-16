"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api" // Import the API service

export default function VendorRegistration({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    // Owner Details
    ownerName: "",
    email: "",
    password: "",
    phone: "",

    // Shop Details
    shopName: "",
    shopDescription: "",
    cuisine: "",
    address: {
      street: "",
      city: "",
      state: "",
      pincode: "",
    },

    // Business Details
    licenseNumber: "",
    gstNumber: "",
    bankAccount: "",
    ifscCode: "",

    // Operational Details
    openingTime: "",
    closingTime: "",
    deliveryRadius: "",
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

    // Helper function to flatten objects for FormData
    const appendFlattened = (obj: any, parentKey = "") => {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = obj[key]
          const formKey = parentKey ? `${parentKey}.${key}` : key

          if (typeof value === "object" && value !== null && !Array.isArray(value) && !(value instanceof File)) {
            // Recursively flatten nested objects
            appendFlattened(value, formKey)
          } else if (Array.isArray(value)) {
            // Handle arrays (e.g., cuisine, if it were an array of objects)
            // For simple string arrays like cuisine, join them or append individually
            if (formKey === "cuisine") {
              formDataToSend.append(formKey, value.join(",")) // Send as comma-separated string
            } else {
              value.forEach((item, index) => {
                formDataToSend.append(`${formKey}[${index}]`, item)
              })
            }
          } else {
            // Append primitive values
            formDataToSend.append(formKey, value)
          }
        }
      }
    }

    appendFlattened(formData) // Flatten the formData state

    // Add files
    Object.entries(files).forEach(([key, file]) => {
      if (file) {
        formDataToSend.append(key, file)
      }
    })

    try {
      // Use the API service to register the vendor
      const response = await api.auth.registerVendor(formDataToSend)

      if (response) {
        // apiRequest throws error for !response.ok, so if we get here, it's successful
        alert("Vendor registration submitted successfully! Awaiting admin approval.")
        onSuccess()
      }
    } catch (error: any) {
      console.error("Registration failed:", error)
      alert(error.message || "Registration failed. Please try again.")
    } finally {
      setLoading(false)
    }
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
                <Label htmlFor="ownerName">Owner Name</Label>
                <Input
                  id="ownerName"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          {/* Shop Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Shop Details</h3>
            <div>
              <Label htmlFor="shopName">Shop Name</Label>
              <Input
                id="shopName"
                value={formData.shopName}
                onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="shopDescription">Shop Description</Label>
              <Textarea
                id="shopDescription"
                value={formData.shopDescription}
                onChange={(e) => setFormData({ ...formData, shopDescription: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="cuisine">Cuisine Types (comma separated)</Label>
              <Input
                id="cuisine"
                placeholder="e.g., Indian, Chinese, Fast Food"
                value={formData.cuisine}
                onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Address Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Address Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="street">Street</Label>
                <Input
                  id="street"
                  value={formData.address.street}
                  onChange={(e) =>
                    setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.address.city}
                  onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.address.state}
                  onChange={(e) =>
                    setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  value={formData.address.pincode}
                  onChange={(e) =>
                    setFormData({ ...formData, address: { ...formData.address, pincode: e.target.value } })
                  }
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
                <Label htmlFor="licenseNumber">Business License Number</Label>
                <Input
                  id="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="gstNumber">GST Number (Optional)</Label>
                <Input
                  id="gstNumber"
                  value={formData.gstNumber}
                  onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="bankAccount">Bank Account Number</Label>
                <Input
                  id="bankAccount"
                  value={formData.bankAccount}
                  onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="ifscCode">IFSC Code</Label>
                <Input
                  id="ifscCode"
                  value={formData.ifscCode}
                  onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          {/* Operational Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Operational Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="openingTime">Opening Time</Label>
                <Input
                  id="openingTime"
                  type="time"
                  value={formData.openingTime}
                  onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="closingTime">Closing Time</Label>
                <Input
                  id="closingTime"
                  type="time"
                  value={formData.closingTime}
                  onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="deliveryRadius">Delivery Radius (in km)</Label>
                <Input
                  id="deliveryRadius"
                  type="number"
                  min="1" // Added min attribute
                  value={formData.deliveryRadius}
                  onChange={(e) => setFormData({ ...formData, deliveryRadius: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          {/* File Uploads */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Upload Documents</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="shopImage">Shop Image (JPG, PNG, GIF)</Label>
                <Input
                  id="shopImage"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFiles({ ...files, shopImage: e.target.files?.[0] || null })}
                />
              </div>
              <div>
                <Label htmlFor="licenseDocument">Business License (Image or PDF)</Label>
                <Input
                  id="licenseDocument"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setFiles({ ...files, licenseDocument: e.target.files?.[0] || null })}
                />
              </div>
              <div>
                <Label htmlFor="ownerPhoto">Owner Photo (JPG, PNG, GIF)</Label>
                <Input
                  id="ownerPhoto"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFiles({ ...files, ownerPhoto: e.target.files?.[0] || null })}
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
