"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/AuthContext"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"

export default function DeliveryRegistration({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    // Personal Details
    name: "",
    email: "",
    password: "",
    phone: "",
    dateOfBirth: "",

    // Address Details (New)
    street: "",
    city: "",
    state: "",
    pincode: "",

    // Vehicle Details
    vehicleType: "",
    vehicleNumber: "",
    vehicleBrand: "",

    // Document Details
    licenseNumber: "", // New

    // Bank Details
    bankAccount: "",
    ifscCode: "",

    // Working Details
    workingHours: "",
    preferredAreas: "",
  })

  const [files, setFiles] = useState({
    profileImage: null as File | null, // Renamed from profilePhoto (backend: profileImage)
    licenseImage: null as File | null, // Renamed from licensePhoto (backend: licenseImage)
    vehicleImage: null as File | null, // Renamed from vehicleRC (backend: vehicleImage)
    // aadharCard: null as File | null, // Removed as backend doesn't explicitly process it in the snippet
  })

  const { register, isLoading, error } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const formDataToSend = new FormData()

    // Add text fields
    Object.entries(formData).forEach(([key, value]) => {
      // Handle nested address fields for backend: "address.street", etc.
      if (['street', 'city', 'state', 'pincode'].includes(key)) {
        formDataToSend.append(`address.${key}`, value)
      } else {
        formDataToSend.append(key, value)
      }
    })

    // Add files
    Object.entries(files).forEach(([key, file]) => {
      if (file) {
        formDataToSend.append(key, file)
      }
    })

    const success = await register(formDataToSend, "delivery")
    if (success) {
      toast({ title: "✅ Registration submitted!", description: "Awaiting verification." })
      onSuccess()
    }
  }

  return (
    <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
      <CardHeader>
        <CardTitle>Delivery Partner Registration</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Personal Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          {/* Address Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Address</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="street">Street Address</Label>
                <Input id="street" value={formData.street} onChange={(e) => setFormData({ ...formData, street: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input id="state" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="pincode">Pincode</Label>
                <Input id="pincode" value={formData.pincode} onChange={(e) => setFormData({ ...formData, pincode: e.target.value })} required />
              </div>
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Vehicle Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vehicleType">Vehicle Type</Label>
                <Select onValueChange={(value) => setFormData({ ...formData, vehicleType: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bike">Motorcycle</SelectItem>
                    <SelectItem value="scooter">Scooter</SelectItem>
                    <SelectItem value="bicycle">Bicycle</SelectItem>
                    <SelectItem value="car">Car</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="vehicleNumber">Vehicle Number</Label>
                <Input
                  id="vehicleNumber"
                  placeholder="e.g., MH12AB1234"
                  value={formData.vehicleNumber}
                  onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                  required
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="licenseNumber">Driving License Number</Label>
                <Input
                  id="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          {/* Document Uploads */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Upload Documents</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="profileImage">Profile Photo</Label>
                <Input
                  id="profileImage"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFiles({ ...files, profileImage: e.target.files?.[0] || null })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="licenseImage">Driving License Phpto</Label>
                <Input
                  id="licenseImage"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setFiles({ ...files, licenseImage: e.target.files?.[0] || null })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="vehicleImage">Vehicle Image / RC</Label>
                <Input
                  id="vehicleImage"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setFiles({ ...files, vehicleImage: e.target.files?.[0] || null })}
                  required
                />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Submitting..." : "Submit Application"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
