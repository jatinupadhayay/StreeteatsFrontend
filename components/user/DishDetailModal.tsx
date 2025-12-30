"use client"

import { useState } from "react"
import { X, Star, Image as ImageIcon, Plus, Minus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import Image from "next/image"
import { api } from "@/lib/api"

interface DishDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dish: {
    _id: string
    name: string
    description?: string
    price: number
    originalPrice?: number
    image?: string
    isVeg?: boolean
    isSpicy?: boolean
    category?: string
  }
  onAddToCart: (item: any, customizations: any, quantity: number) => void
}

export function DishDetailModal({ open, onOpenChange, dish, onAddToCart }: DishDetailModalProps) {
  const [selectedSize, setSelectedSize] = useState<"small" | "medium" | "large">("medium")
  const [selectedSpiceLevel, setSelectedSpiceLevel] = useState<"mild" | "medium" | "hot" | "extra-hot">("medium")
  const [customizations, setCustomizations] = useState<Record<string, boolean>>({})
  const [quantity, setQuantity] = useState(1)
  const [reviews, setReviews] = useState<any[]>([])
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [images, setImages] = useState<string[]>([dish.image || "/placeholder.svg"])

  // Size prices (example)
  const sizePrices = {
    small: dish.price * 0.8,
    medium: dish.price,
    large: dish.price * 1.3,
  }

  const currentPrice = sizePrices[selectedSize]

  // Load reviews for this dish
  useState(() => {
    if (open && dish._id) {
      setLoadingReviews(true)
      // Fetch dish reviews (would need backend endpoint)
      // For now, using empty array
      setReviews([])
      setLoadingReviews(false)
    }
  })

  const handleAddToCart = () => {
    const customizedItem = {
      ...dish,
      price: currentPrice,
      customizations: {
        size: selectedSize,
        spiceLevel: selectedSpiceLevel,
        extras: customizations,
      },
    }
    onAddToCart(customizedItem, customizedItem.customizations, quantity)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{dish.name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Images */}
          <div className="space-y-2">
            <div className="relative w-full h-64 rounded-lg overflow-hidden">
              <Image
                src={images[0]}
                alt={dish.name}
                fill
                className="object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.slice(1, 5).map((img, idx) => (
                  <div key={idx} className="relative w-full h-16 rounded overflow-hidden">
                    <Image
                      src={img}
                      alt={`${dish.name} ${idx + 2}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div>
              <p className="text-gray-600 mb-4">{dish.description || "Delicious dish description"}</p>
              
              <div className="flex items-center space-x-2 mb-4">
                <Badge className={dish.isVeg ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                  {dish.isVeg ? "🟢 VEG" : "🔴 NON-VEG"}
                </Badge>
                {dish.isSpicy && <Badge className="bg-orange-100 text-orange-800">🌶️ SPICY</Badge>}
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium">4.5</span>
                  <span className="text-xs text-gray-500">(12 reviews)</span>
                </div>
              </div>

              <div className="text-2xl font-bold text-orange-600 mb-4">
                ₹{currentPrice.toFixed(2)}
                {dish.originalPrice && (
                  <span className="text-lg text-gray-500 line-through ml-2">₹{dish.originalPrice}</span>
                )}
              </div>
            </div>

            {/* Size Selection */}
            <div>
              <Label className="mb-2 block">Size</Label>
              <RadioGroup value={selectedSize} onValueChange={(v) => setSelectedSize(v as any)}>
                <div className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="small" id="small" />
                    <Label htmlFor="small">Small - ₹{sizePrices.small.toFixed(2)}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="medium" />
                    <Label htmlFor="medium">Medium - ₹{sizePrices.medium.toFixed(2)}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="large" id="large" />
                    <Label htmlFor="large">Large - ₹{sizePrices.large.toFixed(2)}</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Spice Level */}
            <div>
              <Label className="mb-2 block">Spice Level</Label>
              <RadioGroup value={selectedSpiceLevel} onValueChange={(v) => setSelectedSpiceLevel(v as any)}>
                <div className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mild" id="mild" />
                    <Label htmlFor="mild">Mild</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="spice-medium" />
                    <Label htmlFor="spice-medium">Medium</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hot" id="hot" />
                    <Label htmlFor="hot">Hot</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="extra-hot" id="extra-hot" />
                    <Label htmlFor="extra-hot">Extra Hot</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Customizations */}
            <div>
              <Label className="mb-2 block">Customizations</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="extra-cheese"
                    checked={customizations["extra-cheese"] || false}
                    onCheckedChange={(checked) =>
                      setCustomizations({ ...customizations, "extra-cheese": checked as boolean })
                    }
                  />
                  <Label htmlFor="extra-cheese">Extra Cheese (+₹20)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="extra-sauce"
                    checked={customizations["extra-sauce"] || false}
                    onCheckedChange={(checked) =>
                      setCustomizations({ ...customizations, "extra-sauce": checked as boolean })
                    }
                  />
                  <Label htmlFor="extra-sauce">Extra Sauce (+₹10)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="no-onion"
                    checked={customizations["no-onion"] || false}
                    onCheckedChange={(checked) =>
                      setCustomizations({ ...customizations, "no-onion": checked as boolean })
                    }
                  />
                  <Label htmlFor="no-onion">No Onion</Label>
                </div>
              </div>
            </div>

            {/* Quantity */}
            <div className="flex items-center space-x-4">
              <Label>Quantity</Label>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-8 text-center font-medium">{quantity}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Reviews Section */}
            {reviews.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Reviews</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {reviews.map((review, idx) => (
                    <div key={idx} className="text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < (review.rating || 0)
                                  ? "text-yellow-400 fill-current"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-medium">{review.customer}</span>
                      </div>
                      <p className="text-gray-600 mt-1">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add to Cart Button */}
            <Button
              onClick={handleAddToCart}
              className="w-full bg-orange-500 hover:bg-orange-600"
              size="lg"
            >
              Add to Cart - ₹{(currentPrice * quantity).toFixed(2)}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

