"use client"

import { useState } from "react"
import { MapPin, Search, Clock, Flame, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import VendorCard from "./VendorCard"
import { mockVendors, mockTrendingItems } from "@/data/mockData"
import Link from "next/link"

export default function HomePage() {
  const [location, setLocation] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  return (
    <div className="space-y-6 p-4">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 text-white rounded-2xl p-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-4">Discover Amazing Street Food</h1>

        {/* Location Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1 relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Enter your location..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="pl-10 bg-white/95 border-0 text-gray-900"
            />
          </div>
          <Button className="bg-amber-500 hover:bg-amber-600 text-white">
            <Search className="w-5 h-5 mr-2" />
            Find Food
          </Button>
        </div>

        {/* Quick Stats */}
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

      {/* Trending Items */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Flame className="w-6 h-6 text-orange-500 mr-2" />
            Trending Now
          </h2>
        </div>

        <div className="flex overflow-x-auto space-x-4 pb-4">
          {mockTrendingItems.map((item) => (
            <div key={item.id} className="flex-shrink-0 w-48 bg-white rounded-xl shadow-md overflow-hidden">
              <img src={item.image || "/placeholder.svg"} alt={item.name} className="w-full h-32 object-cover" />
              <div className="p-3">
                <h3 className="font-semibold text-sm mb-1">{item.name}</h3>
                <p className="text-xs text-gray-600 mb-2">{item.vendor}</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-orange-600">₹{item.price}</span>
                  <div className="flex items-center">
                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                    <span className="text-xs ml-1">{item.rating}</span>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockVendors.slice(0, 6).map((vendor) => (
            <VendorCard key={vendor.id} vendor={vendor} />
          ))}
        </div>
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
