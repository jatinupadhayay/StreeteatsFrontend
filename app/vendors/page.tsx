"use client"

import { useState } from "react"
import { Search, Filter, MapPin, Star, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

interface VendorPageProps {
  vendorId: number  // Explicitly declare the prop
}

const vendors = [
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
    priceRange: "₹50-150",
    isVeg: true,
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
    priceRange: "₹100-300",
    isVeg: false,
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
    priceRange: "₹80-200",
    isVeg: true,
  },
  {
    id: 4,
    name: "Burger Junction",
    image: "/placeholder.svg?height=200&width=300",
    rating: 4.5,
    distance: "1.5 km",
    cuisine: "American",
    speciality: "Gourmet Burgers",
    isOpen: true,
    offers: "Free Fries",
    avgTime: "20 min",
    priceRange: "₹150-400",
    isVeg: false,
  },
]

export default function VendorsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCuisine, setSelectedCuisine] = useState("")
  const [selectedPriceRange, setSelectedPriceRange] = useState("")
  const [showVegOnly, setShowVegOnly] = useState(false)

  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch =
      vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.cuisine.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCuisine = !selectedCuisine || vendor.cuisine === selectedCuisine
    const matchesVeg = !showVegOnly || vendor.isVeg

    return matchesSearch && matchesCuisine && matchesVeg
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Food Vendors Near You</h1>
        <p className="text-gray-600">Discover amazing street food in your area</p>
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
                <SelectItem value="Indian Street Food">Indian Street Food</SelectItem>
                <SelectItem value="Mexican">Mexican</SelectItem>
                <SelectItem value="Asian">Asian</SelectItem>
                <SelectItem value="American">American</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedPriceRange} onValueChange={setSelectedPriceRange}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Price Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="₹50-150">₹50-150</SelectItem>
                <SelectItem value="₹100-300">₹100-300</SelectItem>
                <SelectItem value="₹150-400">₹150-400</SelectItem>
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

              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-600">{vendor.priceRange}</span>
                <Badge className={vendor.isVeg ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                  {vendor.isVeg ? "VEG" : "NON-VEG"}
                </Badge>
              </div>

              <Link href={`/vendor/${vendor.id}`}>
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">View Menu</Button>
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
    </div>
  )
}
