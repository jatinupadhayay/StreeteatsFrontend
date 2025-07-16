"use client"

import { useEffect, useState } from "react"
import { MapPin, Search, Clock, Flame, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import VendorCard from "./VendorCard"
import Link from "next/link"
import { api } from "@/lib/api"

interface Vendor {
  id: string
  name: string
  image: string
  rating: number
  distance: string
  cuisine: string
  speciality: string
  isOpen: boolean
  avgTime: string
  priceRange: string
}

export default function HomePage() {
  const [locationText, setLocationText] = useState("")
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const transformVendors = (data: any[]): Vendor[] =>
    data.map((vendor) => ({
      id: vendor.id,
      name: vendor.shopName,
      image: vendor.images?.shop?.[0] || "/placeholder.svg",
      rating: vendor.rating?.average || 4.5,
      distance: `${vendor.deliveryRadius} km radius`,
      cuisine: Array.isArray(vendor.cuisine) ? vendor.cuisine.join(", ") : vendor.cuisine || "Street Food",
      speciality: vendor.shopDescription || "Specialty Items",
      isOpen: vendor.isActive,
      avgTime: "15-20 min", // Placeholder
      priceRange: "₹₹", // Placeholder
    }))

  // Get user location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude)
        setLng(pos.coords.longitude)
      },
      () => {
        setError("Location access denied or unavailable.")
        setLoading(false)
      }
    )
  }, [])

  // Fetch vendors
  useEffect(() => {
    const fetchVendors = async () => {
      if (lat == null || lng == null) return

      setLoading(true)
      setError(null)

      try {
        const res = await api.vendors.getAll({ lat, lng, radius: 10, cuisine: "indian" })
        console.log(res);
        const vendorArray = res?.vendors || []
        setVendors(transformVendors(vendorArray))
        console.log(vendors)
      } catch {
        setError("Failed to fetch vendors")
      } finally {
        setLoading(false)
      }
    }

    fetchVendors()
  }, [lat, lng])

  return (
    <div className="space-y-6 p-4">
      {/* Hero */}
      <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 text-white rounded-2xl p-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-4">Discover Amazing Street Food</h1>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1 relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Enter your location manually (optional)"
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
              className="pl-10 bg-white/95 border-0 text-gray-900"
            />
          </div>
          <Button className="bg-amber-500 hover:bg-amber-600 text-white">
            <Search className="w-5 h-5 mr-2" />
            Find Food
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xl font-bold text-amber-200">500+</div>
            <div className="text-sm text-orange-100">Vendors</div>
          </div>
          <div>
            <div className="text-xl font-bold text-amber-200">50K+</div>
            <div className="text-sm text-orange-100">Orders</div>
          </div>
          <div>
            <div className="text-xl font-bold text-amber-200">15min</div>
            <div className="text-sm text-orange-100">Avg Pickup</div>
          </div>
        </div>
      </div>

      {/* Trending */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Flame className="w-6 h-6 text-orange-500 mr-2" />
            Trending Now
          </h2>
        </div>

        <div className="flex overflow-x-auto space-x-4 pb-4">
          {vendors.slice(0, 6).map((vendor) => (
            <div
              key={vendor.id}
              className="flex-shrink-0 w-48 bg-white rounded-xl shadow-md overflow-hidden"
            >
              <img
                src={vendor.image}
                alt={vendor.name || "Vendor"}
                className="w-full h-32 object-cover"
              />
              <div className="p-3">
                <h3 className="font-semibold text-sm mb-1">{vendor.name}</h3>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-orange-600">{vendor.priceRange}</span>
                  <div className="flex items-center">
                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                    <span className="text-xs ml-1">{vendor.rating}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Nearby Vendors */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <MapPin className="w-6 h-6 text-green-500 mr-2" />
            Nearby Vendors
          </h2>
          <Link href="/vendors">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        )}

        {error && (
          <div className="text-center py-6">
            <p className="text-red-500 mb-2">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        )}

        {!loading && !error && (
          vendors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vendors.map((vendor) => (
                <VendorCard key={vendor.id} vendor={vendor} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-600">
              <h3 className="text-lg font-semibold mb-2">No vendors found near you</h3>
              <p>Try adjusting your location or search criteria.</p>
            </div>
          )
        )}
      </section>

      {/* Quick Actions */}
      <section className="grid grid-cols-2 gap-4">
        <Link href="/group-order">
          <Button className="h-20 bg-green-500 hover:bg-green-600 text-white flex flex-col items-center justify-center w-full">
            <Clock className="w-6 h-6 mb-1" />
            <span>Group Order</span>
          </Button>
        </Link>
        <Link href="/delivery">
          <Button className="h-20 bg-purple-500 hover:bg-purple-600 text-white flex flex-col items-center justify-center w-full">
            <Star className="w-6 h-6 mb-1" />
            <span>Track Order</span>
          </Button>
        </Link>
      </section>
    </div>
  )
}
