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
    <div className="flex w-full overflow-hidden rounded-xl bg-white shadow-md transition hover:-translate-y-1 hover:shadow-lg cursor-pointer border border-gray-100 sm:flex-col" onClick={onClick}>
      <div className="relative h-28 w-28 flex-shrink-0 overflow-hidden bg-gray-100 sm:h-40 sm:w-full">
        <img
          src={vendor.image || "/placeholder.svg"}
          alt={vendor.name}
          className="h-full w-full object-cover transition duration-300 hover:scale-105"
        />
        <div
          className={`absolute top-2 left-2 sm:top-2 sm:right-2 sm:left-auto rounded-full px-2 py-0.5 text-[10px] font-semibold ${vendor.isOpen ? "bg-green-500 text-white" : "bg-gray-500 text-white"
            }`}
        >
          {vendor.isOpen ? "Open" : "Closed"}
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-1 p-3 sm:gap-3 sm:p-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 sm:text-base line-clamp-1">{vendor.name}</h3>
          <p className="text-[10px] sm:text-xs font-medium text-orange-600 line-clamp-1">{vendor.speciality}</p>
          <p className="hidden sm:block text-xs text-gray-600 line-clamp-1">{vendor.cuisine}</p>
        </div>

        <div className="flex items-center gap-2 sm:justify-between text-[10px] sm:text-xs text-gray-600">
          <span className="flex items-center gap-1 text-gray-800">
            <Star className="h-2.5 w-2.5 text-yellow-400" />
            {ratingLabel}
          </span>
          {distanceLabel && (
            <span className="flex items-center gap-1">
              <MapPin className="h-2.5 w-2.5" />
              {distanceLabel}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-2.5 w-2.5" />
            {vendor.avgTime}
          </span>
        </div>

        <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-600">
          <span>Price: {vendor.priceRange}</span>
          {!vendor.isOpen && <Badge variant="outline" className="h-4 sm:h-auto border-gray-300 text-gray-600 text-[9px] sm:text-[10px]">Preorder</Badge>}
        </div>

        <div className="mt-1 sm:mt-auto">
          <Button
            size="sm"
            className="w-full h-7 sm:h-9 bg-orange-500 text-white hover:bg-orange-600 text-xs"
            onClick={(e) => {
              if (onClick) {
                e.stopPropagation();
                onClick();
              }
            }}
          >
            Explore
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