"use client"

import { useEffect, useState, useCallback } from "react"
import dynamic from "next/dynamic"
import { Edit, Save, X, MapPin, Clock, ShoppingBag, Info, Locate } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"

const MapWithNoSSR = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 rounded-md flex items-center justify-center">Loading map...</div>,
})

interface Vendor {
  id: string
  userId: string
  shopName: string
  shopDescription?: string
  cuisine?: string[]
  address: {
    street: string
    city: string
    state: string
    pincode: string
    coordinates?: [number, number]
  }
  contact: {
    phone: string
    email: string
    socialMedia?: Record<string, string>
  }
  operationalHours: Record<string, {
    isClosed: boolean
    open?: string
    close?: string
  }>
  deliveryRadius: number
  images: {
    shop?: string[]
    license?: string
    owner?: string
    menu?: string[]
    gallery?: string[]
  }
  isActive: boolean
  businessDetails?: {
    licenseImage?: string
  }
}

export default function VendorProfile() {
  const { toast } = useToast()
  const [vendorId, setVendorId] = useState<string | null>(null)
  const [vendorData, setVendorData] = useState<Vendor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<Vendor>>({})
  const [shopImageFile, setShopImageFile] = useState<File | null>(null)
  const [licenseImageFile, setLicenseImageFile] = useState<File | null>(null)
  const [isTogglingStatus, setIsTogglingStatus] = useState(false)
  const [isFetchingLocation, setIsFetchingLocation] = useState(false)
  const [mapCenter, setMapCenter] = useState<[number, number]>([0, 0])

  useEffect(() => {
    const storedId = localStorage.getItem("vendorId")
    if (storedId) setVendorId(storedId)
  }, [])

  const fetchVendor = useCallback(async () => {
    if (!vendorId) return
    setLoading(true)
    console.log(vendorId)
    try {
      const response = await api.vendors.getById(vendorId)
      if (response?.vendor) {
        setVendorData(response.vendor)
        setFormData({
          ...response.vendor,
          cuisine: response.vendor.cuisine?.join(", "),
          images: {
            ...response.vendor.images,
            shop: response.vendor.images?.shop?.[0] || "/placeholder.svg"
          }
        })
        if (response.vendor.address?.coordinates) {
          setMapCenter(response.vendor.address.coordinates)
        }
      } else {
        setError("Vendor data not found")
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [vendorId])

  useEffect(() => {
    fetchVendor()
  }, [fetchVendor])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

 // Address handler with proper null checks
const handleAddressChange = (field: keyof NonNullable<Vendor['address']>, value: string) => {
  setFormData(prev => {
    if (!prev.address) {
      return {
        ...prev,
        address: {
          street: '',
          city: '',
          state: '',
          pincode: '',
          coordinates: [0, 0],
          [field]: field === 'coordinates' ? value.split(',').map(Number) : value
        }
      }
    }

    return {
      ...prev,
      address: {
        ...prev.address,
        [field]: field === 'coordinates' 
          ? value.split(',').map(Number)
          : value
      }
    }
  })
}

// Contact handler with proper null checks
const handleContactChange = (field: keyof NonNullable<Vendor['contact']>, value: string) => {
  setFormData(prev => {
    if (!prev.contact) {
      return {
        ...prev,
        contact: {
          phone: '',
          email: '',
          [field]: value
        }
      }
    }

    return {
      ...prev,
      contact: {
        ...prev.contact,
        [field]: value
      }
    }
  })
}

// Operational hours handler with proper typing
const handleOperationalHoursChange = (
  day: keyof NonNullable<Vendor['operationalHours']>,
  field: "open" | "close", 
  value: string
) => {
  setFormData(prev => {
    if (!prev.operationalHours) {
      const defaultHours = {
        monday: { isClosed: false, open: '', close: '' },
        tuesday: { isClosed: false, open: '', close: '' },
        wednesday: { isClosed: false, open: '', close: '' },
        thursday: { isClosed: false, open: '', close: '' },
        friday: { isClosed: false, open: '', close: '' },
        saturday: { isClosed: false, open: '', close: '' },
        sunday: { isClosed: false, open: '', close: '' }
      }
      
      return {
        ...prev,
        operationalHours: {
          ...defaultHours,
          [day]: {
            isClosed: false,
            [field]: value
          }
        }
      }
    }

    return {
      ...prev,
      operationalHours: {
        ...prev.operationalHours,
        [day]: {
          ...prev.operationalHours[day],
          [field]: value,
          isClosed: false
        }
      }
    }
  })
}

// File upload handler with proper typing
const handleFileChange = (type: "shop" | "license", e: React.ChangeEvent<HTMLInputElement>) => {
  if (!e.target.files || e.target.files.length === 0) return;

  const file = e.target.files[0];
  const objectUrl = URL.createObjectURL(file);

  if (type === "shop") {
    setShopImageFile(file);
    setFormData(prev => {
      const currentImages = prev.images || {};
      return {
        ...prev,
        images: {
          ...currentImages,
          shop: [objectUrl], // Match the Vendor interface which expects string[]
          license: currentImages.license,
          owner: currentImages.owner,
          menu: currentImages.menu,
          gallery: currentImages.gallery
        }
      } as Partial<Vendor>; // Explicit type assertion
    });
  } else {
    setLicenseImageFile(file);
    setFormData(prev => {
      const currentBusinessDetails = prev.businessDetails || {};
      return {
        ...prev,
        businessDetails: {
          ...currentBusinessDetails,
          licenseImage: objectUrl
        }
      } as Partial<Vendor>; // Explicit type assertion
    });
  }
};

// Geolocation handler with proper error typing
const fetchCurrentLocation = useCallback(() => {
  setIsFetchingLocation(true)
  
  if (!navigator.geolocation) {
    toast({
      title: "Geolocation not supported",
      description: "Your browser doesn't support geolocation",
      variant: "destructive"
    })
    setIsFetchingLocation(false)
    return
  }

 const successHandler = (position: GeolocationPosition) => {
  const { latitude, longitude } = position.coords;
  
  setFormData(prev => {
    const currentAddress = prev.address || {
      street: '',
      city: '',
      state: '',
      pincode: '',
      coordinates: [0, 0]
    };

    return {
      ...prev,
      address: {
        ...currentAddress,
        coordinates: [latitude, longitude]
      }
    };
  });

  setMapCenter([latitude, longitude]);
  setIsFetchingLocation(false);
};

  const errorHandler = (error: GeolocationPositionError) => {
    toast({
      title: "Location error",
      description: error.message,
      variant: "destructive"
    })
    setIsFetchingLocation(false)
  }

  navigator.geolocation.getCurrentPosition(
    successHandler,
    errorHandler,
    { 
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  )
}, [toast])

  const handleSubmit = async () => {
    if (!formData.shopName || !formData.address?.street || !formData.address?.city || !formData.address?.pincode) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    const data = new FormData()
    data.append("shopName", formData.shopName || "")
    data.append("shopDescription", formData.shopDescription || "")
    data.append("cuisine", typeof formData.cuisine === 'string' ? formData.cuisine : formData.cuisine?.join(",") || "")
    
    // Address data
    data.append("address.street", formData.address.street || "")
    data.append("address.city", formData.address.city || "")
    data.append("address.state", formData.address.state || "")
    data.append("address.pincode", formData.address.pincode || "")
    if (formData.address.coordinates) {
      data.append("address.coordinates[0]", String(formData.address.coordinates[0]))
      data.append("address.coordinates[1]", String(formData.address.coordinates[1]))
    }

    // Contact data
    data.append("contact.phone", formData.contact?.phone || "")
    data.append("contact.email", formData.contact?.email || "")

    // Business data
    data.append("deliveryRadius", String(formData.deliveryRadius || 0))
    data.append("operationalHours", JSON.stringify(formData.operationalHours || {}))

    // Files
    if (shopImageFile) data.append("shopImage", shopImageFile)
    if (licenseImageFile) data.append("licenseImage", licenseImageFile)

    try {
      const response = await api.vendors.updateProfile(data)
      if (response.success) {
        toast({
          title: "Profile Updated",
          description: "Your changes have been saved successfully"
        })
        setIsEditing(false)
        fetchVendor()
      }
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err.message || "Failed to update profile",
        variant: "destructive"
      })
    }
  }

  const handleToggleStatus = async () => {
    setIsTogglingStatus(true)
    try {
      const response = await api.vendors.toggleStatus()
      if (response.success) {
        setFormData(prev => ({ ...prev, isActive: !prev.isActive }))
        toast({
          title: "Status Updated",
          description: `You are now ${!formData.isActive ? "online" : "offline"}`
        })
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to toggle status",
        variant: "destructive"
      })
    } finally {
      setIsTogglingStatus(false)
    }
  }

  if (!vendorId) return <div className="p-4">Please login as a vendor</div>
  if (loading) return <div className="p-4 space-y-4"><Skeleton className="h-64 w-full" /></div>
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>
  if (!vendorData) return <div className="p-4">No vendor data found</div>

  return (
    <div className="p-4 space-y-6">
      <Card>
        <CardHeader className="flex flex-row justify-between items-start">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img
                src={typeof formData.images?.shop === 'string' ? formData.images.shop : "/placeholder.svg"}
                className="w-24 h-24 rounded-lg object-cover border-2"
                alt="Shop image"
              />
              <Badge className={`absolute -top-2 -right-2 ${formData.isActive ? "bg-green-500" : "bg-red-500"}`}>
                {formData.isActive ? "Online" : "Offline"}
              </Badge>
            </div>
            <div>
              <CardTitle>{vendorData.shopName}</CardTitle>
              <CardDescription>{vendorData.shopDescription}</CardDescription>
              <div className="mt-2 flex flex-wrap gap-2">
                {vendorData.cuisine?.map((cuisine: string, index: number) => (
                  <Badge key={index} variant="secondary">{cuisine}</Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
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
            <div className="flex items-center">
              <Label className="mr-3">{formData.isActive ? "Online" : "Offline"}</Label>
              <Switch
                checked={formData.isActive}
                onCheckedChange={handleToggleStatus}
                disabled={isTogglingStatus}
              />
            </div>
          </div>
        </CardHeader>

        {isEditing ? (
          <CardContent className="space-y-6">
            {/* Editable form fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Shop Name *</Label>
                <Input
                  value={formData.shopName || ""}
                  onChange={(e) => handleInputChange(e)}
                  name="shopName"
                  required
                />
              </div>
              <div>
                <Label>Cuisine (comma separated)</Label>
                <Input
                  value={typeof formData.cuisine === 'string' ? formData.cuisine : formData.cuisine?.join(", ") || ""}
                  onChange={(e) => handleInputChange(e)}
                  name="cuisine"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Shop Description</Label>
                <Textarea
                  value={formData.shopDescription || ""}
                  onChange={(e) => handleInputChange(e)}
                  name="shopDescription"
                />
              </div>
            </div>

            {/* Location Section */}
            <div className="border-t pt-4">
              <h3 className="font-medium flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5" />
                Location Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Street Address *</Label>
                  <Input
                    value={formData.address?.street || ""}
                    onChange={(e) => handleAddressChange('street', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>City *</Label>
                  <Input
                    value={formData.address?.city || ""}
                    onChange={(e) => handleAddressChange('city', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>State</Label>
                  <Input
                    value={formData.address?.state || ""}
                    onChange={(e) => handleAddressChange('state', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Pincode *</Label>
                  <Input
                    value={formData.address?.pincode || ""}
                    onChange={(e) => handleAddressChange('pincode', e.target.value)}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Label>Coordinates</Label>
                      <Input
                        value={formData.address?.coordinates?.join(",") || ""}
                        onChange={(e) => handleAddressChange('coordinates', e.target.value)}
                        placeholder="latitude,longitude"
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={fetchCurrentLocation}
                      disabled={isFetchingLocation}
                    >
                      <Locate className="w-4 h-4 mr-2" />
                      {isFetchingLocation ? "Locating..." : "Auto-detect"}
                    </Button>
                  </div>
                </div>
                <div className="md:col-span-2 h-64 rounded-md overflow-hidden border">
                  <MapWithNoSSR
                    center={mapCenter}
                    onPositionChange={(lat, lng) => {
                      handleAddressChange('coordinates', `${lat},${lng}`)
                      setMapCenter([lat, lng])
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="border-t pt-4">
              <h3 className="font-medium flex items-center gap-2 mb-4">
                <Info className="h-5 w-5" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={formData.contact?.phone || ""}
                    onChange={(e) => handleContactChange('phone', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.contact?.email || ""}
                    onChange={(e) => handleContactChange('email', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Business Settings */}
            <div className="border-t pt-4">
              <h3 className="font-medium flex items-center gap-2 mb-4">
                <ShoppingBag className="h-5 w-5" />
                Business Settings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Delivery Radius (km)</Label>
                  <Input
                    type="number"
                    value={formData.deliveryRadius || 0}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      deliveryRadius: Number(e.target.value)
                    }))}
                  />
                </div>
              </div>
            </div>

            {/* Operational Hours */}
            <div className="border-t pt-4">
              <h3 className="font-medium flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5" />
                Operational Hours
              </h3>
              {Object.entries(formData.operationalHours || {}).map(([day, time]) => (
                <div key={day} className="flex items-center space-x-2 mb-3">
                  <Label className="w-24 capitalize">{day}</Label>
                  <Input
                    type="time"
                    value={time?.open || ""}
                    onChange={(e) => handleOperationalHoursChange(day, "open", e.target.value)}
                    className="flex-1"
                    disabled={time?.isClosed}
                  />
                  <span className="text-gray-500">to</span>
                  <Input
                    type="time"
                    value={time?.close || ""}
                    onChange={(e) => handleOperationalHoursChange(day, "close", e.target.value)}
                    className="flex-1"
                    disabled={time?.isClosed}
                  />
                  <div className="flex items-center ml-2">
                    <Label className="mr-2">Closed</Label>
                    <Switch
                      checked={time?.isClosed || false}
                      onCheckedChange={(checked) => {
                        setFormData(prev => ({
                          ...prev,
                          operationalHours: {
                            ...prev.operationalHours,
                            [day]: {
                              ...prev.operationalHours?.[day],
                              isClosed: checked
                            }
                          }
                        }))
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Image Uploads */}
            <div className="border-t pt-4">
              <h3 className="font-medium mb-4">Upload Images</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Shop Image</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange("shop", e)}
                  />
                  {typeof formData.images?.shop === 'string' && (
                    <img
                      src={formData.images.shop}
                      className="mt-2 h-32 w-32 object-cover rounded-md border"
                      alt="Shop preview"
                    />
                  )}
                </div>
                <div>
                  <Label>License Document</Label>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.png"
                    onChange={(e) => handleFileChange("license", e)}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </CardContent>
        ) : (
          <CardContent>
            {/* View Mode Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium flex items-center gap-2 mb-3">
                  <MapPin className="h-5 w-5 text-orange-500" />
                  Location
                </h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Address:</span> {vendorData.address.street}</p>
                  <p><span className="font-medium">City:</span> {vendorData.address.city}</p>
                  <p><span className="font-medium">State:</span> {vendorData.address.state}</p>
                  <p><span className="font-medium">Pincode:</span> {vendorData.address.pincode}</p>
                  {vendorData.address.coordinates && (
                    <p>
                      <span className="font-medium">Coordinates:</span>{" "}
                      {vendorData.address.coordinates[0]?.toFixed(4)}, {vendorData.address.coordinates[1]?.toFixed(4)}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-medium flex items-center gap-2 mb-3">
                  <Info className="h-5 w-5 text-blue-500" />
                  Contact
                </h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Phone:</span> {vendorData.contact.phone || "N/A"}</p>
                  <p><span className="font-medium">Email:</span> {vendorData.contact.email || "N/A"}</p>
                </div>
              </div>

              <div>
                <h3 className="font-medium flex items-center gap-2 mb-3">
                  <ShoppingBag className="h-5 w-5 text-green-500" />
                  Business Settings
                </h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Delivery Radius:</span> {vendorData.deliveryRadius} km</p>
                </div>
              </div>

              <div>
                <h3 className="font-medium flex items-center gap-2 mb-3">
                  <Clock className="h-5 w-5 text-purple-500" />
                  Operational Hours
                </h3>
                <div className="text-sm">
                  {Object.entries(vendorData.operationalHours || {}).map(([day, time]) => (
                    <p key={day}>
                      <span className="font-medium capitalize">{day}:</span>{" "}
                      {time?.isClosed ? "Closed" : `${time?.open || ''} - ${time?.close || ''}`}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}