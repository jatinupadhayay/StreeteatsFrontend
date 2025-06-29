"use client"

import { useState } from "react"
import { MapPin, Search, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function Hero() {
  const [location, setLocation] = useState("")

  return (
    <div className="relative bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 text-white">
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center">
          <h1 className="text-4xl sm:text-6xl font-bold mb-6">
            Discover Amazing
            <span className="block text-amber-200">Street Food</span>
          </h1>
          <p className="text-xl sm:text-2xl mb-8 text-orange-100 max-w-3xl mx-auto">
            Fresh, authentic, and delicious street food from local vendors. Order now or schedule for later!
          </p>

          {/* Location Search */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Enter your location..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-10 h-12 text-gray-900 bg-white/95 border-0 focus:ring-2 focus:ring-amber-300"
                />
              </div>
              <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-white px-8">
                <Search className="w-5 h-5 mr-2" />
                Find Food
              </Button>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50 px-8 py-3 text-lg font-semibold">
              Order Now
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-orange-600 px-8 py-3 text-lg font-semibold"
            >
              <Clock className="w-5 h-5 mr-2" />
              Schedule Later
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-8 mt-12 max-w-md mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-200">500+</div>
              <div className="text-sm text-orange-100">Vendors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-200">50K+</div>
              <div className="text-sm text-orange-100">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-200">15min</div>
              <div className="text-sm text-orange-100">Avg Pickup</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
