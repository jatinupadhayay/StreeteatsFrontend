"use client"

import { useEffect, useState, useCallback } from "react"
import dynamic from "next/dynamic"
import { Edit, Save, X, MapPin, Clock, ShoppingBag, Info, Locate, Trash2 } from "lucide-react"
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
import QRCode from "qrcode"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Printer, Download, Share2 as ShareIcon, QrCode } from "lucide-react"

const MapWithNoSSR = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 rounded-md flex items-center justify-center">Loading map...</div>,
})

interface Vendor {
  id: string
  _id: {
    id: string
    email: string
    phone: string
    name: string
    fullAddress: string
  }
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
  operationalHours: Record<string, {
    isClosed: boolean
    open?: string
    close?: string
  }>
  deliveryRadius: number
  images: {
    shop?: string
    gallery?: string[]
    license?: string
    owner?: string
    menu?: string[]
  }
  isActive: boolean
  rating?: {
    average: number
    count: number
    breakdown: Record<number, number>
  }
  menu?: Array<{
    name: string
    description: string
    price: number
    category: string
    image: string
  }>
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
  const [galleryFiles, setGalleryFiles] = useState<File[]>([])
  const [existingGalleryImages, setExistingGalleryImages] = useState<string[]>([])
  const [isTogglingStatus, setIsTogglingStatus] = useState(false)
  const [isFetchingLocation, setIsFetchingLocation] = useState(false)
  const [mapCenter, setMapCenter] = useState<[number, number]>([0, 0])
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState("")

  useEffect(() => {
    const storedId = localStorage.getItem("vendorId")
    if (storedId) setVendorId(storedId)
  }, [])

  const fetchVendor = useCallback(async () => {
    if (!vendorId) return
    setLoading(true)
    try {
      const response = await api.vendors.getById(vendorId)
      if (response?.vendor) {
        setVendorData(response.vendor)
        setFormData({
          ...response.vendor,
          cuisine: response.vendor.cuisine?.join(", "),
          images: {
            ...response.vendor.images,
            shop: response.vendor.images?.shop || null
          }
        })
        setExistingGalleryImages(response.vendor.images?.gallery || [])
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
            [field]: field === 'coordinates' ? value.split(',').map(Number) as [number, number] : value
          }
        }
      }
      return {
        ...prev,
        address: {
          ...prev.address,
          [field]: field === 'coordinates'
            ? value.split(',').map(Number) as [number, number]
            : value
        }
      }
    })
  }

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

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);
    const objectUrls = files.map(file => URL.createObjectURL(file));

    setGalleryFiles(prev => [...prev, ...files]);
    setExistingGalleryImages(prev => [...prev, ...objectUrls]);
  };

  const removeGalleryImage = (index: number) => {
    setExistingGalleryImages(prev => {
      const newImages = [...prev];
      const removedImage = newImages.splice(index, 1)[0];

      if (removedImage.startsWith('blob:')) {
        URL.revokeObjectURL(removedImage);
      }

      return newImages;
    });

    setGalleryFiles(prev => {
      const fileStartIndex = existingGalleryImages.length - prev.length;
      const fileIndex = index - fileStartIndex;
      if (fileIndex >= 0 && fileIndex < prev.length) {
        const updatedFiles = [...prev];
        updatedFiles.splice(fileIndex, 1);
        return updatedFiles;
      }
      return prev;
    });
  };

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

      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          coordinates: [latitude, longitude]
        }
      }));

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

    // Business data
    data.append("deliveryRadius", String(formData.deliveryRadius || 0))
    data.append("operationalHours", JSON.stringify(formData.operationalHours || {}))

    // Append shop image
    if (shopImageFile) {
      data.append("shopImage", shopImageFile)
    }

    // Append gallery images
    galleryFiles.forEach(file => {
      data.append("gallery", file)
    })

    try {
      const response = await api.vendors.updateProfile(data)
      if (response.success) {
        toast({
          title: "Profile Updated",
          description: "Your changes have been saved successfully"
        })
        setIsEditing(false)
        fetchVendor()
        setShopImageFile(null)
        setGalleryFiles([])
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
    let coordinates = formData.address?.coordinates

    // Get current location if switching to online
    if (!formData.isActive) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000
          })
        })
        coordinates = [position.coords.latitude, position.coords.longitude]

        // Update local state
        setFormData(prev => ({
          ...prev,
          address: {
            ...prev.address,
            coordinates
          }
        }))
        setMapCenter(coordinates)
      } catch (error) {
        toast({
          title: "Location Required",
          description: "Could not get current location. Please set coordinates manually.",
          variant: "destructive"
        })
        setIsTogglingStatus(false)
        return
      }
    }

    try {
      const response = await api.vendors.toggleStatus(coordinates)
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

  const handleGenerateQR = async () => {
    if (!vendorId) return
    try {
      // Use production domain for QR codes, fallback to current origin for local dev
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://streeteats-frontend-kw1c.vercel.app"
      const shopUrl = `${baseUrl}/vendor/${vendorId}`
      const url = await QRCode.toDataURL(shopUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: "#ea580c", // orange-600
          light: "#ffffff",
        },
      })
      setQrDataUrl(url)
      setIsGeneratorOpen(true)
    } catch (err) {
      console.error("QR generation failed:", err)
      toast({
        title: "QR Generation Failed",
        description: "Could not generate QR code for your shop",
        variant: "destructive"
      })
    }
  }

  const handlePrint = () => {
    const printContent = document.getElementById("marketing-poster")
    if (!printContent) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Marketing Poster - ${vendorData?.shopName}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              body { padding: 0; margin: 0; }
              #poster-container { box-shadow: none !important; border: none !important; }
            }
          </style>
        </head>
        <body class="bg-white">
          <div id="poster-container" class="max-w-[800px] mx-auto p-10 mt-10 border-8 border-orange-500 rounded-[40px] shadow-2xl bg-white text-center">
            ${printContent.innerHTML}
          </div>
          <script>
            window.onload = () => {
              window.print();
              // window.close();
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
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
                src={formData.images?.shop || "/placeholder.svg"}
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
          </div>
        </CardHeader>


        {isEditing ? (
          <CardContent className="space-y-6">
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

            <div className="border-t pt-4">
              <h3 className="font-medium flex items-center gap-2 mb-4">
                <Info className="h-5 w-5" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={vendorData._id?.name || ""}
                    disabled
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    value={vendorData._id?.email || ""}
                    disabled
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={vendorData._id?.phone || ""}
                    disabled
                  />
                </div>
              </div>
            </div>

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
                    onChange={(e) => handleOperationalHoursChange(day as keyof NonNullable<Vendor['operationalHours']>, "open", e.target.value)}
                    className="flex-1"
                    disabled={time?.isClosed}
                  />
                  <span className="text-gray-500">to</span>
                  <Input
                    type="time"
                    value={time?.close || ""}
                    onChange={(e) => handleOperationalHoursChange(day as keyof NonNullable<Vendor['operationalHours']>, "close", e.target.value)}
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
                              ...prev.operationalHours?.[day as keyof NonNullable<Vendor['operationalHours']>],
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

            {/* Shop Logo Section */}
            <div className="border-t pt-4">
              <h3 className="font-medium mb-4">Shop Logo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Upload New Logo</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setShopImageFile(e.target.files[0])
                        setFormData(prev => ({
                          ...prev,
                          images: {
                            ...prev.images,
                            shop: URL.createObjectURL(e.target.files[0])
                          }
                        }))
                      }
                    }}
                  />
                </div>
                <div>
                  <Label>Current Logo</Label>
                  <div className="mt-2">
                    <img
                      src={formData.images?.shop || "/placeholder.svg"}
                      className="w-24 h-24 object-cover rounded-md border"
                      alt="Shop logo"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Gallery Section */}
            <div className="border-t pt-4">
              <h3 className="font-medium mb-4">Shop Gallery</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Upload Gallery Images</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryChange}
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Upload images that showcase your shop (max 10 images)
                  </p>
                </div>
                <div>
                  <Label>Current Gallery</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {existingGalleryImages.map((img, index) => (
                      <div key={index} className="relative">
                        <img
                          src={img}
                          className="w-24 h-24 object-cover rounded-md border"
                          alt={`Gallery image ${index + 1}`}
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full"
                          onClick={() => removeGalleryImage(index)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
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
                  <p><span className="font-medium">Name:</span> {vendorData._id?.name || "N/A"}</p>
                  <p><span className="font-medium">Email:</span> {vendorData._id?.email || "N/A"}</p>
                  <p><span className="font-medium">Phone:</span> {vendorData._id?.phone || "N/A"}</p>
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

              <div className="md:col-span-2">
                <h3 className="font-medium flex items-center gap-2 mb-3">
                  <ShoppingBag className="h-5 w-5 text-green-500" />
                  Shop Images
                </h3>
                <div className="flex flex-wrap gap-2">
                  {vendorData.images?.shop && (
                    <div className="relative">
                      <img
                        src={vendorData.images.shop}
                        className="w-24 h-24 object-cover rounded-md border"
                        alt="Shop logo"
                      />
                    </div>
                  )}
                  {vendorData.images?.gallery?.map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      className="w-24 h-24 object-cover rounded-md border"
                      alt={`Gallery image ${index + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Marketing QR Section */}
              <div className="border-t pt-6 bg-orange-50/50 -mx-6 px-6 pb-6 rounded-b-lg">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-lg flex items-center gap-2 text-orange-900">
                      <QrCode className="h-5 w-5" />
                      Boost Your Sales!
                    </h3>
                    <p className="text-sm text-orange-700">
                      Generate a custom QR code poster for your shop. Customers can scan to view your menu instantly!
                    </p>
                  </div>
                  <Button
                    onClick={handleGenerateQR}
                    className="bg-orange-600 hover:bg-orange-700 text-white shadow-md transition-all hover:scale-105"
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    Generate Marketing QR
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <Dialog open={isGeneratorOpen} onOpenChange={setIsGeneratorOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden bg-white">
          <DialogHeader className="p-6 bg-orange-600 text-white">
            <DialogTitle className="text-2xl font-bold">Marketing Poster</DialogTitle>
            <DialogDescription className="text-orange-100">
              Print this poster and place it at your shop or nearby locations.
            </DialogDescription>
          </DialogHeader>

          <div className="p-10 flex flex-col items-center">
            <div
              id="marketing-poster"
              className="bg-white w-full max-w-[400px] flex flex-col items-center space-y-8"
            >
              {/* Branding */}
              <div className="flex flex-col items-center space-y-2">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-2xl">SE</span>
                </div>
                <h2 className="text-xl font-black text-gray-900 tracking-tighter italic">StreetEats</h2>
              </div>

              {/* Message */}
              <div className="text-center space-y-2">
                <h3 className="text-3xl font-black text-gray-900 uppercase">Order Now!</h3>
                <p className="text-orange-600 font-bold text-lg">Try out some near street food</p>
              </div>

              {/* QR Code */}
              <div className="p-6 bg-white border-[10px] border-orange-500 rounded-[30px] shadow-xl">
                <img src={qrDataUrl} alt="Shop QR Code" className="w-64 h-64" />
              </div>

              {/* Vendor Info */}
              <div className="text-center">
                <h4 className="text-2xl font-black text-gray-900">{vendorData?.shopName}</h4>
                <div className="flex items-center justify-center text-gray-500 mt-1">
                  <MapPin className="w-4 h-4 mr-1 text-orange-500" />
                  <span className="text-sm font-medium">{vendorData?.address.street}, {vendorData?.address.city}</span>
                </div>
              </div>

              {/* App Store Icons */}
              <div className="flex items-center justify-center gap-4 pt-4 border-t w-full">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg"
                  alt="App Store"
                  className="h-10 w-auto"
                />
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                  alt="Google Play"
                  className="h-10 w-auto"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-10 w-full sm:w-auto">
              <Button onClick={handlePrint} className="flex-1 sm:flex-none bg-orange-600 hover:bg-orange-700">
                <Printer className="w-4 h-4 mr-2" />
                Print Poster
              </Button>
              <a
                href={qrDataUrl}
                download={`${vendorData?.shopName}-QR.png`}
                className="flex-1 sm:flex-none"
              >
                <Button variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Save QR Only
                </Button>
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}