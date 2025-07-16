"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Star, MapPin, Clock, Heart, Share2, Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCart, VendorInfo, CartItem } from "@/components/user/CartProvider"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import Image from "next/image"
import Navbar from "@/components/ui/Navbar"
import BottomTab from "@/components/ui/BottomTab"

interface MenuItem {
  _id: string
  name: string
  description?: string
  quantity: number
  price: number
  originalPrice?: number
  image?: string
  isVeg?: boolean
  isSpicy?: boolean
  category?: string
}

interface Vendor {
  _id: string
  shopName: string
  speciality: string
  cuisine?: string[]
  rating?: {
    average: number
    count: number
  }
  address: {
    street: string
    city: string
    state: string
    pincode: string
    coordinates: [number, number] // [latitude, longitude]
  }
  contact?: {
    email?: string
    phone?: string
  }
  images?: {
    shop?: string[]
    license?: string
    owner?: string
    menu?: string[]
    gallery?: string[]
  }
  isActive: boolean
  menu?: MenuItem[]
}

interface DistanceInfo {
  distance: string
  duration: string
}

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
   console.error('Invalid coordinates received:', { lat1, lon1, lat2, lon2 });
  const R = 6371 // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) 
  return R * c // Distance in km
}

export default function VendorPage() {
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [distanceInfo, setDistanceInfo] = useState<DistanceInfo | null>(null)
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [cart, setCart] = useState<Record<string, number>>({})
  const [selectedTime, setSelectedTime] = useState<"now" | "later">("now")
  const [loading, setLoading] = useState(true)
  const [showDirections, setShowDirections] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  const { addItem } = useCart()

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("User location obtained:", {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
          setLocationError(null)
        },
        (error) => {
          console.error("Geolocation error:", error)
          let errorMessage = "Please enable location services for accurate distance calculation"
          if (error.code === error.PERMISSION_DENIED) {
            errorMessage = "Location permission denied. Please enable location access."
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMessage = "Location information unavailable."
          } else if (error.code === error.TIMEOUT) {
            errorMessage = "Location request timed out."
          }
          
          setLocationError(errorMessage)
          toast({
            title: "Location Access Needed",
            description: errorMessage,
            variant: "destructive"
          })
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    } else {
      const errorMessage = "Your browser doesn't support location services"
      console.warn(errorMessage)
      setLocationError(errorMessage)
      toast({
        title: "Geolocation Not Supported",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }, [toast])

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        setLoading(true)
        const res = await fetch(`https://streeteatsbackend.onrender.com/api/vendors/${id}`)
        if (!res.ok) throw new Error("Failed to fetch vendor")
        const data = await res.json()
        
        console.log("Vendor data received:", data.vendor)

        if (!data.vendor.address?.coordinates) {
          console.warn("Vendor has no coordinates in address")
          toast({
            title: "Warning",
            description: "Vendor location data incomplete",
            variant: "default"
          })
        }

        setVendor(data.vendor)
        setMenuItems(data.vendor.menu || [])
      } catch (err) {
        console.error("Vendor fetch error:", err)
        toast({ 
          title: "Error", 
          description: "Unable to load vendor data", 
          variant: "destructive" 
        })
      } finally {
        setLoading(false)
      }
    }
    
    if (id) fetchVendor()
  }, [id, toast])

  useEffect(() => {
    if (userLocation && vendor?.address?.coordinates) {
      const [vendorLat, vendorLng] = vendor.address.coordinates
      
      if (isNaN(vendorLat)) {
        console.error("Invalid vendor latitude:", vendorLat)
        return
      }
      if (isNaN(vendorLng)) {
        console.error("Invalid vendor longitude:", vendorLng)
        return
      }

      const distanceKm = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        vendorLat,
        vendorLng
      )
      
      const walkingSpeed = 5 // km/h
      const walkingTimeMinutes = Math.round((distanceKm / walkingSpeed) * 60) + 10
      
      setDistanceInfo({
        distance: `${distanceKm.toFixed(1)} km`,
        duration: `${walkingTimeMinutes} min`
      })
    }
  }, [userLocation, vendor])

  const addToCart = (itemId: string) => {
    const item = menuItems.find((i) => i._id === itemId)
    if (!item || !vendor) return

    if (!vendor.isActive) {
      toast({
        title: "Vendor is not accepting orders",
        description: "This vendor is currently unavailable for orders.",
        variant: "destructive"
      })
      return
    }

    const vendorInfo: VendorInfo = {
      _id: id,
      shopName: vendor.shopName,
      isActive: vendor.isActive,
      address: {
        street: vendor.address.street,
        city: vendor.address.city,
        state: vendor.address.state,
        pincode: vendor.address.pincode,
        coordinates: vendor.address.coordinates
      },
      duration: distanceInfo?.duration||"",
    }

    const cartItem: Omit<CartItem, "quantity"> = {
      id: item._id,
      name: item.name,
      price: item.price,
      vendor: vendorInfo,
      image: item.image || '/placeholder.png',
      category: item.category || 'General',
      description: item.description || ""
    }

    addItem(cartItem)

    setCart(prev => ({
      ...prev,
      [item._id]: (prev[item._id] || 0) + 1
    }))

    toast({
      title: "✅ Added to cart",
      description: `${item.name} added to cart`,
      duration: 2000
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const newCart = { ...prev }
      if (newCart[itemId] > 1) {
        newCart[itemId]--
      } else {
        delete newCart[itemId]
      }
      return newCart
    })
  }

  const getTotalItems = (): number => {
    return Object.values(cart).reduce((acc, val) => acc + val, 0)
  }

  const getTotalPrice = (): number => {
    return Object.entries(cart).reduce((total, [id, qty]) => {
      const item = menuItems.find((i) => i._id === id)
      return total + (item?.price || 0) * qty
    }, 0)
  }

  const openOSMDirections = () => {
    if (!userLocation || !vendor?.address?.coordinates) return
    
    const [vendorLat, vendorLng] = vendor.address.coordinates
    const url = `https://www.openstreetmap.org/directions?engine=graphhopper_foot&route=${userLocation.lat}%2C${userLocation.lng}%3B${vendorLat}%2C${vendorLng}`
    window.open(url, '_blank')
  }

  if (loading || !vendor) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-orange-500 rounded-full"></div>
      </div>
    )
  }

  return (
    <>
    <Navbar title="Street Eats"/>
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
        <div className="relative">
          <Image
            src={vendor.images?.shop?.[0] || "/placeholder.svg"}
            alt={vendor.shopName}
            className="w-full h-64 object-cover"
            width={800}
            height={400}
          />
          <div className="absolute top-4 right-4 flex gap-2">
            <Button size="sm" variant="secondary" className="bg-white/90">
              <Heart className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="secondary" className="bg-white/90">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{vendor.shopName}</h1>
              <p className="text-orange-600 font-medium text-lg mb-2">{vendor.speciality}</p>
              <p className="text-gray-600 mb-4">{vendor.cuisine?.join(", ")}</p>

              <div className="flex items-center space-x-6 mb-4">
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="ml-1 font-medium">{vendor.rating?.average || "0"}</span>
                  <span className="ml-1 text-gray-500">
                    ({vendor.rating?.count ? `${vendor.rating.count}+ reviews` : "No reviews"})
                  </span>
                </div>
                
                <div className="flex items-center text-gray-500">
                  <MapPin className="w-5 h-5" />
                  <span className="ml-1">{vendor.address.street}</span>
                </div>
                
                {distanceInfo && (
                  <div className="flex items-center text-gray-500">
                    <Clock className="w-5 h-5" />
                    <span className="ml-1">{distanceInfo.duration} ({distanceInfo.distance})</span>
                  </div>
                )}
              </div>

              <div className="mt-4 p-4 bg-orange-50 rounded-lg">
                {locationError ? (
                  <p className="text-orange-600">{locationError}</p>
                ) : userLocation && vendor.address?.coordinates ? (
                  <>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">
                          {distanceInfo ? `Distance: ${distanceInfo.distance}` : "Calculating distance..."}
                        </p>
                        <p className="text-sm text-gray-600">
                          {distanceInfo ? `Estimated time: ${distanceInfo.duration}` : "Calculating time..."}
                        </p>
                      </div>
                      <Button 
                        onClick={openOSMDirections}
                        variant="outline"
                        className="flex items-center"
                        disabled={!distanceInfo}
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        Get Directions
                      </Button>
                    </div>
                    {showDirections && distanceInfo && (
                      <div className="mt-4">
                        <div className="bg-gray-100 rounded-lg p-4">
                          <h4 className="font-bold mb-2">Walking Directions:</h4>
                          <ol className="list-decimal pl-5 space-y-2">
                            <li>Head toward the vendor location</li>
                            <li>Follow pedestrian paths and sidewalks</li>
                            <li>Estimated walking time: {distanceInfo.duration}</li>
                            <li>Total distance: {distanceInfo.distance}</li>
                          </ol>
                        </div>
                        <Button 
                          onClick={() => setShowDirections(false)}
                          className="mt-2 w-full bg-gray-500 hover:bg-gray-600"
                        >
                          Hide Directions
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-orange-600">
                    {!userLocation ? "Waiting for your location..." : "Vendor location not available"}
                  </p>
                )}
              </div>
            </div>

            <div className="text-center lg:text-right">
              <div
                className={`inline-block px-4 py-2 rounded-full text-sm font-medium mb-4 ${
                  vendor.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}
              >
                {vendor.isActive ? "🟢 Open Now" : "🔴 Closed"}
              </div>

              <div className="space-y-2">
                <Button
                  variant={selectedTime === "now" ? "default" : "outline"}
                  onClick={() => setSelectedTime("now")}
                  className="w-full lg:w-auto"
                >
                  Order Now
                </Button>
                <Button
                  variant={selectedTime === "later" ? "default" : "outline"}
                  onClick={() => setSelectedTime("later")}
                  className="w-full lg:w-auto ml-0 lg:ml-2"
                >
                  Schedule Later
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Tabs defaultValue="menu" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="menu">Menu</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="info">Info</TabsTrigger>
            </TabsList>

            <TabsContent value="menu" className="space-y-6">
              {!vendor.isActive ? (
                <div className="text-center py-12 text-gray-500 text-lg font-medium">
                  This vendor is not accepting orders currently.
                  <br />
                  <span className="text-orange-600">Coming Soon!</span>
                </div>
              ) : menuItems.length > 0 ? (
                <div className="space-y-4">
                  {menuItems.map((item) => (
                    <div key={item._id} className="bg-white rounded-lg shadow-md p-4 flex items-center space-x-4">
                      <Image 
                        src={item.image || "/placeholder.svg"} 
                        className="w-20 h-20 object-cover rounded-lg" 
                        alt={item.name}
                        width={80}
                        height={80}
                      />
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge className={item.isVeg ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            {item.isVeg ? "🟢 VEG" : "🔴 NON-VEG"}
                          </Badge>
                          {item.isSpicy && <Badge className="bg-orange-100 text-orange-800">🌶️ SPICY</Badge>}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold">₹{item.price}</span>
                          {item.originalPrice && (
                            <span className="text-sm text-gray-500 line-through">₹{item.originalPrice}</span>
                          )}
                        </div>
                      </div>
                      <div>
                        {cart[item._id] ? (
                          <div className="flex items-center space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => removeFromCart(item._id)}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span>{cart[item._id]}</span>
                            <Button 
                              size="sm" 
                              onClick={() => addToCart(item._id)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            onClick={() => addToCart(item._id)} 
                            className="bg-orange-500 hover:bg-orange-600"
                          >
                            <Plus className="w-4 h-4 mr-2" /> Add
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 text-lg font-medium">
                  No menu items available yet.
                </div>
              )}
            </TabsContent>

            <TabsContent value="reviews">
              <div className="text-center py-8 text-gray-500">Reviews coming soon!</div>
            </TabsContent>

            <TabsContent value="info">
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Address</h3>
                  <p className="text-gray-600">
                    {`${vendor.address.street}, ${vendor.address.city}, ${vendor.address.state} - ${vendor.address.pincode}`}
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Contact</h3>
                  <p className="text-gray-600">{vendor.contact?.phone || "Not provided"}</p>
                  <p className="text-gray-600">{vendor.contact?.email || "Not provided"}</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {vendor.isActive && getTotalItems() > 0 && (
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Your Order</h3>
              <div className="space-y-3 mb-4">
                {Object.entries(cart).map(([itemId, count]) => {
                  const item = menuItems.find((item) => item._id === itemId)
                  if (!item) return null
                  return (
                    <div key={itemId} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">₹{item.price} × {count}</p>
                      </div>
                      <p className="font-bold">₹{item.price * count}</p>
                    </div>
                  )
                })}
              </div>

              <div className="border-t pt-4 mb-4">
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>₹{getTotalPrice()}</span>
                </div>
              </div>

              <Link href="/checkout">
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                  Proceed to Checkout
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
     <BottomTab />
  </>

  )
}