"use client"

import { Heart, Plus, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const popularDishes = [
  {
    id: 1,
    name: "Butter Chicken Roll",
    vendor: "Spice Street Corner",
    image: "/placeholder.svg?height=200&width=200",
    price: 120,
    originalPrice: 150,
    rating: 4.9,
    isVeg: false,
    isSpicy: true,
    description: "Creamy butter chicken wrapped in soft naan",
  },
  {
    id: 2,
    name: "Veg Hakka Noodles",
    vendor: "Noodle Express",
    image: "/placeholder.svg?height=200&width=200",
    price: 80,
    originalPrice: null,
    rating: 4.7,
    isVeg: true,
    isSpicy: false,
    description: "Stir-fried noodles with fresh vegetables",
  },
  {
    id: 3,
    name: "Fish Tacos (3pc)",
    vendor: "Taco Fiesta",
    image: "/placeholder.svg?height=200&width=200",
    price: 200,
    originalPrice: 250,
    rating: 4.8,
    isVeg: false,
    isSpicy: true,
    description: "Grilled fish with spicy salsa and lime",
  },
  {
    id: 4,
    name: "Pani Puri (8pc)",
    vendor: "Spice Street Corner",
    image: "/placeholder.svg?height=200&width=200",
    price: 60,
    originalPrice: null,
    rating: 4.9,
    isVeg: true,
    isSpicy: true,
    description: "Crispy puris with tangy flavored water",
  },
]

export default function PopularDishes() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Popular Dishes</h2>
        <p className="text-gray-600">Most loved items by our community</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {popularDishes.map((dish) => (
          <div
            key={dish.id}
            className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="relative">
              <img src={dish.image || "/placeholder.svg"} alt={dish.name} className="w-full h-48 object-cover" />
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-3 right-3 bg-white/80 hover:bg-white text-gray-700 p-2"
              >
                <Heart className="w-4 h-4" />
              </Button>
              <div className="absolute bottom-3 left-3 flex gap-2">
                <Badge className={dish.isVeg ? "bg-green-500" : "bg-red-500"}>{dish.isVeg ? "VEG" : "NON-VEG"}</Badge>
                {dish.isSpicy && <Badge className="bg-orange-500">🌶️ SPICY</Badge>}
              </div>
            </div>

            <div className="p-4">
              <h3 className="font-bold text-gray-900 mb-1">{dish.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{dish.vendor}</p>
              <p className="text-xs text-gray-500 mb-3 line-clamp-2">{dish.description}</p>

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="ml-1 text-sm font-medium">{dish.rating}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-gray-900">₹{dish.price}</span>
                  {dish.originalPrice && (
                    <span className="text-sm text-gray-500 line-through">₹{dish.originalPrice}</span>
                  )}
                </div>
              </div>

              <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add to Cart
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
