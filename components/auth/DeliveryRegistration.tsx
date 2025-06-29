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

export default function DeliveryRegistration({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    // Personal Details
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    dateOfBirth: "",

    // Vehicle Details
    vehicleType: "",
    vehicleNumber: "",
    vehicleBrand: "",

    // Bank Details
    bankAccount: "",
    ifscCode: "",

    // Working Details
    workingHours: "",
    preferredAreas: "",
  })

  const [files, setFiles] = useState({
    profilePhoto: null as File | null,
    licensePhoto: null as File | null,
    aadharCard: null as File | null,
    vehicleRC: null as File | null,
  })

  const { register, isLoading, error } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const formDataToSend = new FormData()

    // Add text fields
    Object.entries(formData).forEach(([key, value]) => {
      formDataToSend.append(key, value)
    })

    // Add files
    Object.entries(files).forEach(([key, file]) => {
      if (file) {
        formDataToSend.append(key, file)
      }
    })

    const success = await register(formDataToSend, "delivery")
    if (success) {
      alert("Delivery partner registration submitted successfully! Awaiting verification.")
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
              <div>
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

          {/* Vehicle Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Vehicle Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vehicleType">Vehicle Type</Label>
                <Select onValueChange={(value) => setFormData({ ...formData, vehicleType: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle type" />
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
            </div>
          </div>

          {/* Document Uploads */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Upload Documents</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="profilePhoto">Profile Photo (JPG, PNG, GIF)</Label>
                <Input
                  id="profilePhoto"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFiles({ ...files, profilePhoto: e.target.files?.[0] || null })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="licensePhoto">Driving License (Image or PDF)</Label>
                <Input
                  id="licensePhoto"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setFiles({ ...files, licensePhoto: e.target.files?.[0] || null })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="aadharCard">Aadhar Card (Image or PDF)</Label>
                <Input
                  id="aadharCard"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setFiles({ ...files, aadharCard: e.target.files?.[0] || null })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="vehicleRC">Vehicle RC (Image or PDF)</Label>
                <Input
                  id="vehicleRC"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setFiles({ ...files, vehicleRC: e.target.files?.[0] || null })}
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
