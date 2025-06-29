"use client"

import { Star, MapPin, Clock, Flame } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

const trendingVendors = [
  {
    id: 1,
    name: "Spice Street Corner",
    image: "/placeholder.svg?height=200&width=300",
    rating: 4.8,
    distance: "0.5 km",
    cuisine: "Indian Street Food",
    speciality: "Pani Puri & Chaat",
    isOpen: true,
    offers: "20% OFF",
    avgTime: "15 min",
  },
  {
    id: 2,
    name: "Taco Fiesta",
    image: "/placeholder.svg?height=200&width=300",
    rating: 4.6,
    distance: "0.8 km",
    cuisine: "Mexican",
    speciality: "Street Tacos",
    isOpen: true,
    offers: "Buy 2 Get 1",
    avgTime: "12 min",
  },
  {
    id: 3,
    name: "Noodle Express",
    image: "/placeholder.svg?height=200&width=300",
    rating: 4.7,
    distance: "1.2 km",
    cuisine: "Asian",
    speciality: "Ramen & Stir Fry",
    isOpen: false,
    offers: null,
    avgTime: "18 min",
  },
]

export default function TrendingVendors() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center">
            <Flame className="w-8 h-8 text-orange-500 mr-3" />
            Trending Vendors
          </h2>
          <p className="text-gray-600 mt-2">Popular choices in your area</p>
        </div>
        <Link href="/vendors">
          <Button variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50">
            View All
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trendingVendors.map((vendor) => (
          <div
            key={vendor.id}
            className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
          >
            <div className="relative">
              <img src={vendor.image || "/placeholder.svg"} alt={vendor.name} className="w-full h-48 object-cover" />
              {vendor.offers && <Badge className="absolute top-3 left-3 bg-red-500 text-white">{vendor.offers}</Badge>}
              <div
                className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${
                  vendor.isOpen ? "bg-green-500 text-white" : "bg-gray-500 text-white"
                }`}
              >
                {vendor.isOpen ? "Open" : "Closed"}
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{vendor.name}</h3>
              <p className="text-orange-600 font-medium mb-2">{vendor.speciality}</p>
              <p className="text-gray-600 text-sm mb-4">{vendor.cuisine}</p>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="ml-1 text-sm font-medium">{vendor.rating}</span>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <MapPin className="w-4 h-4" />
                    <span className="ml-1 text-sm">{vendor.distance}</span>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span className="ml-1 text-sm">{vendor.avgTime}</span>
                  </div>
                </div>
              </div>

              <Link href={`/vendor/${vendor.id}`}>
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">View Menu</Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
