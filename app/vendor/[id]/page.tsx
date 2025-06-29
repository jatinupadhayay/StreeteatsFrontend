"use client"

import { useState } from "react"
import { Star, MapPin, Clock, Heart, Share2, Plus, Minus, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/components/user/CartProvider"
import Link from "next/link"

const vendorData = {
  id: 1,
  name: "Spice Street Corner",
  image: "/placeholder.svg?height=300&width=600",
  rating: 4.8,
  reviews: 324,
  distance: "0.5 km",
  cuisine: "Indian Street Food",
  speciality: "Pani Puri & Chaat",
  isOpen: true,
  offers: "20% OFF on orders above ₹200",
  avgTime: "15-20 min",
  address: "Shop 12, MG Road, Near City Mall",
  phone: "+91 98765 43210",
}

const menuItems = [
  {
    id: 1,
    name: "Pani Puri (8 pieces)",
    description: "Crispy puris filled with spicy tangy water, chutneys and fillings",
    price: 60,
    originalPrice: null,
    image: "/placeholder.svg?height=150&width=150",
    isVeg: true,
    isSpicy: true,
    category: "Chaat",
  },
  {
    id: 2,
    name: "Bhel Puri",
    description: "Puffed rice mixed with sev, chutneys, onions and tomatoes",
    price: 50,
    originalPrice: 70,
    image: "/placeholder.svg?height=150&width=150",
    isVeg: true,
    isSpicy: false,
    category: "Chaat",
  },
  {
    id: 3,
    name: "Vada Pav",
    description: "Mumbai's favorite - spiced potato fritter in a bun with chutneys",
    price: 25,
    originalPrice: null,
    image: "/placeholder.svg?height=150&width=150",
    isVeg: true,
    isSpicy: true,
    category: "Main",
  },
  {
    id: 4,
    name: "Dahi Puri",
    description: "Crispy puris topped with yogurt, chutneys and spices",
    price: 70,
    originalPrice: null,
    image: "/placeholder.svg?height=150&width=150",
    isVeg: true,
    isSpicy: false,
    category: "Chaat",
  },
]

export default function VendorPage({ params }: { params: { id: string } }) {
  const [localCart, setLocalCart] = useState<{ [key: number]: number }>({})
  const [selectedTime, setSelectedTime] = useState("now")
  const { toast } = useToast()
  const { addItem } = useCart()

  const addToLocalCart = (itemId: number) => {
    setLocalCart((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1,
    }))
  }

  const removeFromLocalCart = (itemId: number) => {
    setLocalCart((prev) => {
      const newCart = { ...prev }
      if (newCart[itemId] > 1) {
        newCart[itemId]--
      } else {
        delete newCart[itemId]
      }
      return newCart
    })
  }

  const addToGlobalCart = (itemId: number) => {
    const item = menuItems.find((item) => item.id === itemId)
    if (item) {
      addItem({
        id: item.id,
        name: item.name,
        price: item.price,
        vendor: vendorData.name,
        image: item.image,
      })
      addToLocalCart(itemId)
      toast({
        title: "Added to cart",
        description: `${item.name} has been added to your cart`,
      })
    }
  }

  const getTotalItems = () => {
    return Object.values(localCart).reduce((sum, count) => sum + count, 0)
  }

  const getTotalPrice = () => {
    return Object.entries(localCart).reduce((total, [itemId, count]) => {
      const item = menuItems.find((item) => item.id === Number.parseInt(itemId))
      return total + (item?.price || 0) * count
    }, 0)
  }

  return (
    <div className="min-h-screen bg-orange-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Vendor Details</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Vendor Header */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="relative">
            <img
              src={vendorData.image || "/placeholder.svg"}
              alt={vendorData.name}
              className="w-full h-64 object-cover"
            />
            <div className="absolute top-4 right-4 flex gap-2">
              <Button size="sm" variant="secondary" className="bg-white/90">
                <Heart className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="secondary" className="bg-white/90">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-4 lg:mb-0">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{vendorData.name}</h1>
                <p className="text-orange-600 font-medium text-lg mb-2">{vendorData.speciality}</p>
                <p className="text-gray-600 mb-4">{vendorData.cuisine}</p>

                <div className="flex items-center space-x-6 mb-4">
                  <div className="flex items-center">
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <span className="ml-1 font-medium">{vendorData.rating}</span>
                    <span className="ml-1 text-gray-500">({vendorData.reviews} reviews)</span>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <MapPin className="w-5 h-5" />
                    <span className="ml-1">{vendorData.distance}</span>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <Clock className="w-5 h-5" />
                    <span className="ml-1">{vendorData.avgTime}</span>
                  </div>
                </div>

                {vendorData.offers && <Badge className="bg-red-500 text-white mb-4">🎉 {vendorData.offers}</Badge>}
              </div>

              <div className="text-center lg:text-right">
                <div
                  className={`inline-block px-4 py-2 rounded-full text-sm font-medium mb-4 ${
                    vendorData.isOpen ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {vendorData.isOpen ? "🟢 Open Now" : "🔴 Closed"}
                </div>

                <div className="space-y-2">
                  <Button
                    variant={selectedTime === "now" ? "default" : "outline"}
                    onClick={() => setSelectedTime("now")}
                    className="w-full lg:w-auto"
                  >
                    Order Now
                  </Button>
                  <Button
                    variant={selectedTime === "later" ? "default" : "outline"}
                    onClick={() => setSelectedTime("later")}
                    className="w-full lg:w-auto ml-0 lg:ml-2"
                  >
                    Schedule Later
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Tabs defaultValue="menu" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="menu">Menu</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="info">Info</TabsTrigger>
              </TabsList>

              <TabsContent value="menu" className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Menu</h2>

                  <div className="space-y-4">
                    {menuItems.map((item) => (
                      <div key={item.id} className="bg-white rounded-lg shadow-md p-4 flex items-center space-x-4">
                        <img
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />

                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-bold text-gray-900 mb-1">{item.name}</h3>
                              <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                              <div className="flex items-center space-x-2 mb-2">
                                <Badge
                                  className={item.isVeg ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                                >
                                  {item.isVeg ? "🟢 VEG" : "🔴 NON-VEG"}
                                </Badge>
                                {item.isSpicy && <Badge className="bg-orange-100 text-orange-800">🌶️ SPICY</Badge>}
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-gray-900">₹{item.price}</span>
                                {item.originalPrice && (
                                  <span className="text-sm text-gray-500 line-through">₹{item.originalPrice}</span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              {localCart[item.id] ? (
                                <div className="flex items-center space-x-2">
                                  <Button size="sm" variant="outline" onClick={() => removeFromLocalCart(item.id)}>
                                    <Minus className="w-4 h-4" />
                                  </Button>
                                  <span className="font-medium">{localCart[item.id]}</span>
                                  <Button size="sm" onClick={() => addToGlobalCart(item.id)}>
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  onClick={() => addToGlobalCart(item.id)}
                                  className="bg-orange-500 hover:bg-orange-600"
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  Add
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="reviews">
                <div className="text-center py-8">
                  <p className="text-gray-500">Reviews coming soon!</p>
                </div>
              </TabsContent>

              <TabsContent value="info">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Address</h3>
                    <p className="text-gray-600">{vendorData.address}</p>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Phone</h3>
                    <p className="text-gray-600">{vendorData.phone}</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Cart Sidebar */}
          {getTotalItems() > 0 && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Your Order</h3>

                <div className="space-y-3 mb-4">
                  {Object.entries(localCart).map(([itemId, count]) => {
                    const item = menuItems.find((item) => item.id === Number.parseInt(itemId))
                    if (!item) return null

                    return (
                      <div key={itemId} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-600">
                            ₹{item.price} × {count}
                          </p>
                        </div>
                        <p className="font-bold">₹{item.price * count}</p>
                      </div>
                    )
                  })}
                </div>

                <div className="border-t pt-4 mb-4">
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>₹{getTotalPrice()}</span>
                  </div>
                </div>

                <Link href="/checkout">
                  <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">Proceed to Checkout</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
