// components/VendorCard.tsx
"use client"

import { Star, MapPin, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { id } from "date-fns/locale"
import { vendored } from "next/dist/server/future/route-modules/pages/module.compiled"
interface Vendor {
  id: string 
  name: string
  image: string
  rating: number
  distance: string
  cuisine: string
  speciality: string
  isOpen: boolean
  offers?: string
  avgTime: string
  priceRange: string
}

interface VendorCardProps {
  vendor: Vendor
}
export default function VendorCard({ vendor }: VendorCardProps) {
  return (
    
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        <img src={vendor.image || "/placeholder.svg"} alt={vendor.name} className="w-full h-40 object-cover" />
        {vendor.offers && (
          <Badge className="absolute top-2 left-2 bg-red-500 text-white text-xs">{vendor.offers}</Badge>
        )}
        <div
          className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
            vendor.isOpen ? "bg-green-500 text-white" : "bg-gray-500 text-white"
          }`}
        >
          {vendor.isOpen ? "Open" : "Closed"}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-gray-900 mb-1">{vendor.id}</h3>
        <h3 className="font-bold text-gray-900 mb-1">{vendor.name}</h3>
        <p className="text-orange-600 font-medium text-sm mb-1">{vendor.speciality}</p>
        <p className="text-gray-600 text-xs mb-3">{vendor.cuisine}</p>

        <div className="flex items-center justify-between mb-3 text-xs">
          <div className="flex items-center">
            <Star className="w-3 h-3 text-yellow-400 fill-current" />
             <span className="ml-1">{vendor.rating}</span>
          </div>
          <div className="flex items-center text-gray-500">
            <MapPin className="w-3 h-3" />
            <span className="ml-1">{vendor.distance}</span>
          </div>
          <div className="flex items-center text-gray-500">
            <Clock className="w-3 h-3" />
            <span className="ml-1">{vendor.avgTime}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-600">{vendor.priceRange}</span>
        </div>

        {/* FIXED: Use Link with shallow routing instead of router.push */}
        <Link href={`/vendor/${vendor.id}`} shallow>
          <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">View Menu</Button>
        </Link>
        
      </div>
    </div>
  )
}