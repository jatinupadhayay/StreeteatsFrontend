"use client"

import { useEffect, useState } from "react"
import { Search, Filter, MapPin, Star, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { api } from "@/lib/api"

interface Vendor {
  id: string
  _id: string
  shopName: string
  shopDescription: string
  cuisine: string[]
  address: {
    street: string
    city: string
    state: string
    pincode: string
    coordinates: [number, number]
  }
  rating: {
    average?: number
    total?: number
  }
  deliveryRadius: number
  operationalHours: any
  images: {
    shop: string | null
    gallery: string[]
  }
  isActive: boolean
  menu: Array<{
    _id: string
    name: string
    description: string
    price: number
    category: string
    isAvailable: boolean
    isVeg: boolean
    image?: string
  }>
}

interface VendorPageProps {
  vendorId: number
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCuisine, setSelectedCuisine] = useState("")
  const [selectedPriceRange, setSelectedPriceRange] = useState("")
  const [showVegOnly, setShowVegOnly] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [activeTab, setActiveTab] = useState("nearby") // "nearby" or "all"
  const [page, setPage] = useState(1)
  const pageSize = 20

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.warn("Location access denied or unavailable:", error)
          // Continue without location
        }
      )
    }
  }, [])

  // Fetch vendors from backend
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoading(true)
        setError(null)

        const filters: any = {
          page: page,
          pageSize: pageSize,
        }

        if (activeTab === "nearby" && userLocation) {
          filters.lat = userLocation.lat
          filters.lng = userLocation.lng
          filters.nearby = true
          filters.radius = 5 // 5km radius
        } else {
          filters.nearby = false
        }

        if (searchTerm) filters.search = searchTerm
        if (selectedCuisine && selectedCuisine !== "all") filters.cuisine = selectedCuisine

        const response = await api.vendors.getAll(filters)

        if (response.success) {
          setVendors(response.vendors || [])
        } else {
          throw new Error(response.message || "Failed to fetch vendors")
        }
      } catch (err: any) {
        console.error("Error fetching vendors:", err)
        setError(err.message || "Failed to load vendors")
      } finally {
        setLoading(false)
      }
    }

    fetchVendors()
  }, [searchTerm, selectedCuisine, userLocation, activeTab, page])

  // Get unique cuisines for filter
  const allCuisines = vendors.flatMap(vendor =>
    Array.isArray(vendor.cuisine) ? vendor.cuisine : [vendor.cuisine]
  )
  const uniqueCuisines = [...new Set(allCuisines.filter(Boolean))]

  // Calculate price range based on menu items
  const getPriceRange = (vendor: Vendor) => {
    if (!vendor.menu || vendor.menu.length === 0) return "₹₹"

    const prices = vendor.menu.map(item => item.price)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)

    if (maxPrice < 100) return "₹"
    if (maxPrice < 300) return "₹₹"
    if (maxPrice < 500) return "₹₹₹"
    return "₹₹₹₹"
  }

  // Check if vendor is veg (all menu items are veg)
  const isVendorVeg = (vendor: Vendor) => {
    if (!vendor.menu || vendor.menu.length === 0) return false
    return vendor.menu.every(item => item.isVeg)
  }

  // Calculate average preparation time (placeholder logic)
  const getAverageTime = (vendor: Vendor) => {
    // You can replace this with actual preparation time from vendor data
    const baseTime = 15
    const menuSize = vendor.menu?.length || 1
    if (menuSize > 20) return "20-25 min"
    if (menuSize > 10) return "15-20 min"
    return "10-15 min"
  }

  // Filter vendors based on current filters
  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch =
      vendor.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.shopDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (Array.isArray(vendor.cuisine) && vendor.cuisine.some(c =>
        c.toLowerCase().includes(searchTerm.toLowerCase())
      ))

    const matchesCuisine = !selectedCuisine ||
      selectedCuisine === "all" ||
      (Array.isArray(vendor.cuisine) && vendor.cuisine.includes(selectedCuisine))

    const matchesVeg = !showVegOnly || isVendorVeg(vendor)

    return matchesSearch && matchesCuisine && matchesVeg && vendor.isActive
  })

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setPage(1) // Reset page to 1 when tab changes
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Food Vendors Near You</h1>
          <p className="text-gray-600">Discover amazing food in your area</p>
        </div>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-red-500 text-lg mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full lg:w-1/4">
          <div className="bg-white rounded-xl shadow-lg p-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Vendors</h2>
            <div className="flex space-x-2">
              <Button
                variant={activeTab === "nearby" ? "default" : "outline"}
                onClick={() => handleTabChange("nearby")}
              >
                Nearby
              </Button>
              <Button
                variant={activeTab === "all" ? "default" : "outline"}
                onClick={() => handleTabChange("all")}
              >
                All
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full lg:w-3/4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Food Vendors Near You</h1>
            <p className="text-gray-600">Discover amazing food in your area</p>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search vendors or cuisine..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Select value={selectedCuisine} onValueChange={setSelectedCuisine}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Cuisine Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cuisines</SelectItem>
                    {uniqueCuisines.map((cuisine) => (
                      <SelectItem key={cuisine} value={cuisine}>
                        {cuisine}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedPriceRange} onValueChange={setSelectedPriceRange}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Price Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Prices</SelectItem>
                    <SelectItem value="₹">Budget (Under ₹100)</SelectItem>
                    <SelectItem value="₹₹">Moderate (₹100-300)</SelectItem>
                    <SelectItem value="₹₹₹">Premium (₹300-500)</SelectItem>
                    <SelectItem value="₹₹₹₹">Luxury (₹500+)</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant={showVegOnly ? "default" : "outline"}
                  onClick={() => setShowVegOnly(!showVegOnly)}
                  className="whitespace-nowrap"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Veg Only
                </Button>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="mb-4">
            <p className="text-gray-600">
              Showing {filteredVendors.length} vendor{filteredVendors.length !== 1 ? "s" : ""}
              {userLocation && " near you"}
            </p>
          </div>

          {/* Vendor Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVendors.map((vendor) => (
              <div
                key={vendor.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                <div className="relative">
                  <img
                    src={vendor.images?.shop || "/placeholder.svg"}
                    alt={vendor.shopName}
                    className="w-full h-48 object-cover"
                  />
                  <div
                    className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${vendor.isActive ? "bg-green-500 text-white" : "bg-gray-500 text-white"
                      }`}
                  >
                    {vendor.isActive ? "Open" : "Closed"}
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{vendor.shopName}</h3>
                  <p className="text-orange-600 font-medium mb-2">
                    {vendor.menu?.[0]?.name || "Specialty Items"}
                  </p>
                  <p className="text-gray-600 text-sm mb-4">
                    {Array.isArray(vendor.cuisine) ? vendor.cuisine.join(", ") : vendor.cuisine}
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="ml-1 text-sm font-medium">
                          {vendor.rating?.average?.toFixed(1) || "4.5"}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-500">
                        <MapPin className="w-4 h-4" />
                        <span className="ml-1 text-sm">{vendor.deliveryRadius} km radius</span>
                      </div>
                      <div className="flex items-center text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span className="ml-1 text-sm">{getAverageTime(vendor)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-600">{getPriceRange(vendor)}</span>
                    <Badge className={isVendorVeg(vendor) ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {isVendorVeg(vendor) ? "VEG" : "NON-VEG"}
                    </Badge>
                  </div>

                  <Link href={`/vendor/${vendor.id}`}>
                    <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                      View Menu
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {filteredVendors.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No vendors found matching your criteria.</p>
              <Button
                onClick={() => {
                  setSearchTerm("")
                  setSelectedCuisine("")
                  setSelectedPriceRange("")
                  setShowVegOnly(false)
                }}
                variant="outline"
                className="mt-4"
              >
                Clear Filters
              </Button>
            </div>
          )}

          {/* Pagination */}
          <div className="flex justify-center mt-8">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="mr-2"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}