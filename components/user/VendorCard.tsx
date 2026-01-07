"use client"

import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { Clock, MapPin, Star } from "lucide-react"

interface VendorCardProps {
  vendor: {
    id: string
    name: string
    image: string
    rating: number
    distanceKm: number | null
    cuisine: string
    speciality: string
    isOpen: boolean
    avgTime: string
    priceRange: string
  }
  onClick?: () => void
}

const formatDistance = (distanceKm: number | null) => {
  if (distanceKm == null || Number.isNaN(distanceKm)) return null
  const decimals = distanceKm < 10 ? 1 : 0
  return `${distanceKm.toFixed(decimals)} km away`
}

export default function VendorCard({ vendor, onClick }: VendorCardProps) {
  const distanceLabel = formatDistance(vendor.distanceKm)
  const ratingLabel = Number.isFinite(vendor.rating) ? vendor.rating.toFixed(1) : "4.5"

  const Content = (
    <div className="flex h-full flex-col overflow-hidden rounded-xl bg-white shadow transition hover:-translate-y-1 hover:shadow-lg cursor-pointer" onClick={onClick}>
      <div className="relative h-40 w-full overflow-hidden bg-gray-100">
        <img
          src={vendor.image || "/placeholder.svg"}
          alt={vendor.name}
          className="h-full w-full object-cover transition duration-300 hover:scale-105"
        />
        <div
          className={`absolute top-2 right-2 rounded-full px-3 py-1 text-xs font-semibold ${vendor.isOpen ? "bg-green-500 text-white" : "bg-gray-500 text-white"
            }`}
        >
          {vendor.isOpen ? "Open" : "Closed"}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">{vendor.name}</h3>
          <p className="text-sm font-medium text-orange-600">{vendor.speciality}</p>
          <p className="text-xs text-gray-600">{vendor.cuisine}</p>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-600">
          <span className="flex items-center gap-1 text-gray-800">
            <Star className="h-3 w-3 text-yellow-400" />
            {ratingLabel}
          </span>
          {distanceLabel && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {distanceLabel}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {vendor.avgTime}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>Price: {vendor.priceRange}</span>
          {!vendor.isOpen && <Badge variant="outline" className="border-gray-300 text-gray-600">Preorder</Badge>}
        </div>

        <div className="mt-auto">
          <Button
            className="w-full bg-orange-500 text-white hover:bg-orange-600"
            onClick={(e) => {
              if (onClick) {
                e.stopPropagation();
                onClick();
              }
            }}
          >
            View menu
          </Button>
        </div>
      </div>
    </div>
  )

  if (onClick) {
    return Content
  }

  return (
    <Link href={`/vendor/${vendor.id}`}>
      {Content}
    </Link>
  )
}