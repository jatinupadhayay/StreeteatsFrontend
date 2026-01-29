"use client"

import { useEffect, useState, useRef, useCallback, Suspense } from "react"
import { api } from "@/lib/api"
import SharedCustomerLayout from "@/components/layout/SharedCustomerLayout"
import { useParams, useSearchParams } from "next/navigation"
import { Star, MapPin, Clock, Heart, Share2, Plus, Minus, Flame, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ImageIcon } from "lucide-react"
import { useCart, VendorInfo, CartItem } from "@/components/user/CartProvider"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import Image from "next/image"
import Navbar from "@/components/ui/Navbar"
import BottomTab from "@/components/ui/BottomTab"
import * as Collapsible from '@radix-ui/react-collapsible'
import { DishDetailModal } from "@/components/user/DishDetailModal"
import { RatingModal } from "@/components/Ratinmodel"

interface MenuItem {
  _id: string
  name: string
  description?: string
  price: number
  image?: string
  category: string
  isAvailable: boolean
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
  likedBy?: string[]
  activeOffers?: Array<{
    _id: string
    title: string
    description: string
    type: string
    value: number
    isActive: boolean
  }>
  analytics?: {
    likes: number
    shares: number
  }
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
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c // Distance in km
}


export default function VendorPage() {
  return (
    <Suspense fallback={<div>Loading shop profile...</div>}>
      <VendorPageContent />
    </Suspense>
  )
}

function VendorPageContent() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const dishId = searchParams.get('dishId')
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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedDish, setSelectedDish] = useState<MenuItem | null>(null)
  const [showDishDetail, setShowDishDetail] = useState(false)
  const [vendorGallery, setVendorGallery] = useState<string[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showGallery, setShowGallery] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const menuItemsRef = useRef<HTMLDivElement[]>([])

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

  const fetchReviews = useCallback(async () => {
    if (!id) return
    try {
      setReviewsLoading(true)
      const response = await api.reviews.getVendorReviews(id, 1, 20)
      if (response.success && response.reviews) {
        setReviews(response.reviews)
      } else if (response.reviews) {
        setReviews(response.reviews)
      } else if (Array.isArray(response)) {
        setReviews(response)
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error)
      // Don't show error toast for reviews as it's not critical
    } finally {
      setReviewsLoading(false)
    }
  }, [id])

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        setLoading(true)
        const data = await api.vendors.getById(id)

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

        // Check if liked by current user
        const token = localStorage.getItem("streetEatsToken")
        if (token) {
          try {
            const userRes = await api.users.getProfile()
            if (userRes.success && data.vendor.likedBy?.includes(userRes.user?._id)) {
              setIsLiked(true)
            }
          } catch (e) {
            console.error("Failed to check like status")
          }
        }

        // Load vendor gallery images
        const galleryImages = [
          ...(data.vendor.images?.shop || []),
          ...(data.vendor.images?.gallery || []),
        ]
        setVendorGallery(galleryImages.length > 0 ? galleryImages : [data.vendor.images?.shop?.[0] || "/placeholder.svg"])
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

    if (id) {
      fetchVendor()
      fetchReviews()
    }
  }, [id, toast, fetchReviews])

  // Carousel logic
  useEffect(() => {
    if (vendorGallery.length <= 1) return

    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % vendorGallery.length)
    }, 30000) // 30 seconds as requested

    return () => clearInterval(timer)
  }, [vendorGallery])

  useEffect(() => {
    if (dishId && menuItems.length > 0) {
      const dishIndex = menuItems.findIndex((item) => item._id === dishId);
      if (dishIndex !== -1) {
        // Delay scrolling until after the menu is rendered
        setTimeout(() => {
          if (menuItemsRef.current[dishIndex]) {
            menuItemsRef.current[dishIndex].scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            });
          }
        }, 500); // Adjust the delay as needed
      }
    }
  }, [dishId, menuItems]);

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
      duration: distanceInfo?.duration || "",
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

  const handleLike = async () => {
    try {
      const res = await api.vendors.toggleLike(id)
      if (res.success) {
        setIsLiked(res.isLiked)
        setVendor(prev => prev ? {
          ...prev,
          analytics: {
            ...(prev.analytics || { likes: 0, shares: 0, views: 0 }),
            likes: res.likes
          }
        } : null)
        toast({
          title: res.isLiked ? "❤️ Added to Favorites" : "💔 Removed from Favorites",
          duration: 2000
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Please login to like this vendor",
        variant: "destructive"
      })
    }
  }

  const handleShare = async () => {
    try {
      await api.vendors.recordShare(id)
      const publicUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      const url = `${publicUrl}/vendor/${id}`
      await navigator.clipboard.writeText(url)
      toast({
        title: "🔗 Link copied to clipboard!",
        description: "You can now share this shop with others.",
        duration: 2000
      })
      setVendor(prev => prev ? {
        ...prev,
        analytics: {
          ...prev.analytics!,
          shares: (prev.analytics?.shares || 0) + 1
        }
      } : null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to share shop",
      })
    }
  }

  const handleGroupOrder = () => {
    const publicUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    const groupId = `group-${id}-${Date.now()}`
    let url = `${publicUrl}/group-order?groupId=${groupId}&vendorId=${id}&join=true`

    // Add owner's location to URL so participants see the same vendors
    if (userLocation) {
      url += `&lat=${userLocation.lat}&lng=${userLocation.lng}`
    }

    // Copy the link and redirect the current user to the group order page
    navigator.clipboard.writeText(url)
    toast({
      title: "👥 Group Order Started!",
      description: "Invitation link copied to clipboard. Redirecting...",
      duration: 3000
    })

    setTimeout(() => {
      window.location.href = url
    }, 1500)
  }

  // Group menu items by category
  const groupedMenuItems = () => {
    const grouped: { [category: string]: MenuItem[] } = {}
    menuItems.forEach((item) => {
      if (item.category) {
        if (!grouped[item.category]) {
          grouped[item.category] = []
        }
        grouped[item.category].push(item)
      } else {
        if (!grouped['Uncategorized']) {
          grouped['Uncategorized'] = []
        }
        grouped['Uncategorized'].push(item)
      }
    })
    return grouped
  }

  if (loading || !vendor) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-orange-500 rounded-full"></div>
      </div>
    )
  }

  return (
    <SharedCustomerLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="relative group overflow-hidden">
            <div
              className="flex transition-transform duration-1000 ease-in-out"
              style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
            >
              {vendorGallery.map((img, idx) => (
                <div key={idx} className="min-w-full h-64 lg:h-96 relative">
                  <Image
                    src={img || "/placeholder.svg"}
                    alt={`${vendor.shopName} ${idx + 1}`}
                    className="w-full h-full object-cover"
                    width={1200}
                    height={600}
                    priority={idx === 0}
                  />
                  {/* Subtle overlay for better text contrast */}
                  <div className="absolute inset-0 bg-black/10"></div>
                </div>
              ))}
            </div>

            {/* Carousel Indicators */}
            {vendorGallery.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
                {vendorGallery.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${currentImageIndex === idx ? "bg-white w-4" : "bg-white/50"
                      }`}
                  />
                ))}
              </div>
            )}

            <div className="absolute top-4 right-4 flex gap-2 z-10">
              <Button
                size="sm"
                variant="secondary"
                className={`bg-white/90 shadow-sm ${isLiked ? "text-red-500" : "text-gray-600"}`}
                onClick={handleLike}
              >
                <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
                <span className="ml-1 text-xs font-bold">{vendor.analytics?.likes || 0}</span>
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="bg-white/90 shadow-sm text-green-600 font-bold border-green-100"
                onClick={handleGroupOrder}
              >
                <Clock className="w-4 h-4 md:mr-1" />
                <span className="hidden md:inline text-xs">Group Order</span>
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="bg-white/90 shadow-sm text-gray-600"
                onClick={handleShare}
              >
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
                  className={`inline-block px-4 py-2 rounded-full text-sm font-medium mb-4 ${vendor.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}
                >
                  {vendor.isActive ? "🟢 Open Now" : "🔴 Closed"}
                </div>

                {/* Vendor Gallery Button */}
                {vendorGallery.length > 1 && (
                  <Button
                    variant="outline"
                    onClick={() => setShowGallery(true)}
                    className="w-full lg:w-auto mb-2"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    View Gallery ({vendorGallery.length} photos)
                  </Button>
                )}

                {/* Events/Offers Section */}
                <div className="bg-gradient-to-r from-orange-100 to-amber-100 rounded-lg p-4 mt-4 text-left">
                  <h3 className="font-bold text-orange-800 mb-2 flex items-center">
                    <Flame className="w-4 h-4 mr-2" /> Special Offers
                  </h3>
                  {vendor.activeOffers && vendor.activeOffers.length > 0 ? (
                    <div className="space-y-3">
                      {vendor.activeOffers.map((offer) => (
                        <div key={offer._id} className="bg-white/60 p-2 rounded border border-orange-200">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-sm text-orange-900">{offer.title}</span>
                            <Badge variant="secondary" className="bg-orange-200 text-orange-800 text-[10px] uppercase">
                              {offer.type === 'percentage' ? `${offer.value}% OFF` :
                                offer.type === 'fixed' ? `₹${offer.value} OFF` :
                                  offer.type === 'free_delivery' ? 'Free Delivery' : 'Deal'}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-orange-700 leading-tight">{offer.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-orange-700 italic">
                      {vendor.speciality || "Check out our trending items and special offers!"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {vendor.isActive && (
              <div className="mb-6">
                <Button
                  onClick={handleGroupOrder}
                  className="w-full h-16 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-md flex items-center justify-center space-x-3 text-lg font-bold transition-all hover:scale-[1.01]"
                >
                  <Clock className="w-6 h-6" />
                  <span>Order Together with Friends</span>
                  <Badge className="bg-green-500 text-white border-none ml-2">SAVE ON DELIVERY</Badge>
                </Button>
              </div>
            )}
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
                  <div className="space-y-6">
                    {/* Horizontal Category Tabs */}
                    <div className="overflow-x-auto">
                      <div className="flex space-x-2 pb-2 border-b">
                        <button
                          onClick={() => setSelectedCategory(null)}
                          className={`px-4 py-2 rounded-t-lg font-medium whitespace-nowrap transition-colors ${selectedCategory === null
                            ? "bg-orange-500 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                        >
                          All Items
                        </button>
                        {Object.keys(groupedMenuItems()).map((category) => (
                          <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-4 py-2 rounded-t-lg font-medium whitespace-nowrap transition-colors ${selectedCategory === category
                              ? "bg-orange-500 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Menu Items Display */}
                    <div className="space-y-4">
                      {(selectedCategory === null
                        ? Object.entries(groupedMenuItems())
                        : [[selectedCategory, groupedMenuItems()[selectedCategory]]]
                      ).map(([category, items]) => (
                        <div key={category} className="space-y-4">
                          {selectedCategory === null && (
                            <h4 className="text-xl font-bold text-gray-900 mb-3">{category}</h4>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(items as any[]).map((item: MenuItem, index: number) => (
                              <div key={item._id} className="bg-white rounded-lg shadow-md p-4 flex flex-col md:flex-row items-start md:items-center space-y-3 md:space-y-0 md:space-x-4 cursor-pointer hover:shadow-lg transition-shadow" ref={(el) => (menuItemsRef.current[index] = el!)}>
                                <div
                                  onClick={() => {
                                    setSelectedDish(item)
                                    setShowDishDetail(true)
                                  }}
                                  className="flex-1 w-full"
                                >
                                  <Image
                                    src={item.image || "/placeholder.svg"}
                                    className="w-full md:w-20 h-40 md:h-20 object-cover rounded-lg"
                                    alt={item.name}
                                    width={80}
                                    height={80}
                                  />
                                  <div className="flex-1 w-full mt-3 md:mt-0">
                                    <h3 className="font-bold text-gray-900">{item.name}</h3>
                                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.description || "Delicious dish"}</p>
                                    <div className="flex items-center space-x-2 mb-2 flex-wrap">
                                      <Badge className={item.isVeg ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                                        {item.isVeg ? "🟢 VEG" : "🔴 NON-VEG"}
                                      </Badge>
                                      {item.isSpicy && <Badge className="bg-orange-100 text-orange-800">🌶️ SPICY</Badge>}
                                      <Badge variant="outline" className="text-xs">
                                        <Star className="w-3 h-3 mr-1 text-yellow-400 fill-current" />
                                        4.5 (12)
                                      </Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-2">
                                        <span className="font-bold">₹{item.price}</span>
                                        {item.originalPrice && (
                                          <span className="text-sm text-gray-500 line-through">₹{item.originalPrice}</span>
                                        )}
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setSelectedDish(item)
                                          setShowDishDetail(true)
                                        }}
                                      >
                                        View Details
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                                <div onClick={(e) => e.stopPropagation()}>
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
                                      onClick={() => {
                                        setSelectedDish(item)
                                        setShowDishDetail(true)
                                      }}
                                      className="bg-orange-500 hover:bg-orange-600"
                                      size="sm"
                                    >
                                      <Plus className="w-4 h-4 mr-2" /> Add
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 text-lg font-medium">
                    No menu items available yet.
                  </div>
                )}
              </TabsContent>

              <TabsContent value="reviews" className="space-y-6">
                <div className="space-y-6">
                  {/* Vendor Reviews Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold">Shop Reviews</h3>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-orange-600 border-orange-600 hover:bg-orange-50"
                        onClick={() => setShowReviewModal(true)}
                      >
                        <Star className="w-4 h-4 mr-2" />
                        Write Review
                      </Button>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="flex items-center space-x-2">
                            <Star className="w-6 h-6 text-yellow-400 fill-current" />
                            <span className="text-2xl font-bold">
                              {vendor.rating?.average ? vendor.rating.average.toFixed(1) : reviews.length > 0
                                ? (reviews.reduce((sum, r) => sum + (r.ratings?.food?.overall || r.overall || 0), 0) / reviews.length).toFixed(1)
                                : "0.0"}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</p>
                        </div>
                      </div>
                      {reviewsLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500 mx-auto"></div>
                          <p className="text-gray-500 mt-2">Loading reviews...</p>
                        </div>
                      ) : reviews.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>No reviews yet. Be the first to review!</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {reviews.map((review) => (
                            <div key={review._id || review.id} className="border-b pb-4 last:border-b-0">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                                    <span className="text-orange-600 font-semibold">
                                      {(review.customerId?.name || review.customerName || "Anonymous").charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-semibold">{review.customerId?.name || review.customerName || "Anonymous"}</p>
                                    <p className="text-xs text-gray-500">
                                      {new Date(review.createdAt || review.created_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${i < (review.ratings?.food?.overall || review.overall || 0)
                                        ? "text-yellow-400 fill-current"
                                        : "text-gray-300"
                                        }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              {review.comments?.overall || review.comment || review.review ? (
                                <p className="text-gray-700 mt-2">
                                  {review.comments?.overall || review.comment || review.review}
                                </p>
                              ) : null}
                              {review.media?.images && review.media.images.length > 0 && (
                                <div className="flex space-x-2 mt-3">
                                  {review.media.images.map((img: string, idx: number) => (
                                    <Image
                                      key={idx}
                                      src={img}
                                      alt={`Review image ${idx + 1}`}
                                      width={80}
                                      height={80}
                                      className="w-20 h-20 object-cover rounded-lg"
                                    />
                                  ))}
                                </div>
                              )}
                              {review.reply && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                  <p className="text-sm font-semibold text-gray-700 mb-1">Vendor Reply:</p>
                                  <p className="text-sm text-gray-600">{review.reply}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dish Reviews Section */}
                  <div>
                    <h3 className="text-xl font-bold mb-4">Popular Dishes</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {menuItems.slice(0, 6).map((item) => {
                        const dishReviews = reviews.filter((r) =>
                          r.items?.some((ri: any) => ri.menuItemId === item._id || ri.name === item.name)
                        )
                        const avgRating = dishReviews.length > 0
                          ? dishReviews.reduce((sum, r) => sum + (r.ratings?.food?.overall || r.overall || 0), 0) / dishReviews.length
                          : 0

                        return (
                          <div key={item._id} className="bg-white rounded-lg shadow-md p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h4 className="font-bold text-gray-900">{item.name}</h4>
                                <p className="text-sm text-gray-600">{item.description}</p>
                              </div>
                              <Image
                                src={item.image || "/placeholder.svg"}
                                className="w-16 h-16 object-cover rounded-lg ml-2"
                                alt={item.name}
                                width={64}
                                height={64}
                              />
                            </div>
                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center space-x-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                <span className="text-sm font-medium">{avgRating > 0 ? avgRating.toFixed(1) : "N/A"}</span>
                                <span className="text-xs text-gray-500">({dishReviews.length})</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
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
                    const item = menuItems.find((item: MenuItem) => item._id === itemId)
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

      {/* Dish Detail Modal */}
      {selectedDish && (
        <DishDetailModal
          open={showDishDetail}
          onOpenChange={setShowDishDetail}
          dish={selectedDish}
          onAddToCart={(item, customizations, qty) => {
            for (let i = 0; i < qty; i++) {
              addToCart(item._id)
            }
          }}
        />
      )}

      {/* Vendor Gallery Modal */}
      <Dialog open={showGallery} onOpenChange={setShowGallery}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vendor Gallery</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {vendorGallery.map((img, idx) => (
              <div key={idx} className="relative w-full h-48 rounded-lg overflow-hidden">
                <Image
                  src={img}
                  alt={`Gallery ${idx + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      <RatingModal
        open={showReviewModal}
        onOpenChange={setShowReviewModal}
        onSubmit={async (data: any) => {
          try {
            const res = await api.reviews.addReview({
              vendorId: id,
              rating: data.overall,
              comment: data.review || "",
              // orderId omitted for direct reviews
            } as any)
            if (res.success) {
              toast({ title: "Thank you for your review!" })
              setShowReviewModal(false)
              fetchReviews()
            }
          } catch (e) {
            toast({ title: "Failed to post review", variant: "destructive" })
          }
        }}
      />
    </SharedCustomerLayout >
  )
}