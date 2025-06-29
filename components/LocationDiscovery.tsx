"use client"

import { useState } from "react"
import { MapPin, Navigation, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function LocationDiscovery() {
  const [isLocating, setIsLocating] = useState(false)

  const handleGetLocation = () => {
    setIsLocating(true)
    // Simulate location detection
    setTimeout(() => {
      setIsLocating(false)
    }, 2000)
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-8 text-white">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-6 md:mb-0">
            <h2 className="text-2xl font-bold mb-2 flex items-center">
              <MapPin className="w-6 h-6 mr-2" />
              Discover Food Near You
            </h2>
            <p className="text-green-100 mb-4">Find amazing street food vendors within 1-2 km of your location</p>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-white/20 text-white">
                <Clock className="w-3 h-3 mr-1" />
                Real-time updates
              </Badge>
              <Badge className="bg-white/20 text-white">Live offers</Badge>
              <Badge className="bg-white/20 text-white">Quick pickup</Badge>
            </div>
          </div>

          <div className="text-center">
            <Button
              onClick={handleGetLocation}
              disabled={isLocating}
              className="bg-white text-green-600 hover:bg-green-50 px-8 py-3 text-lg font-semibold"
            >
              {isLocating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600 mr-2"></div>
                  Locating...
                </>
              ) : (
                <>
                  <Navigation className="w-5 h-5 mr-2" />
                  Find Food Near Me
                </>
              )}
            </Button>
            <p className="text-green-100 text-sm mt-2">We'll show vendors within 2km</p>
          </div>
        </div>
      </div>
    </section>
  )
}
