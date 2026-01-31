"use client"

import { useState, useEffect } from "react"
import { Star, Plus, Minus } from "lucide-react"
import Image from "next/image"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { api } from "@/lib/api"

interface DishDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dish: any
  onAddToCart: (item: any, customizations: any, quantity: number) => void
}

export function DishDetailModal({
  open,
  onOpenChange,
  dish,
  onAddToCart,
}: DishDetailModalProps) {
  const [selectedSize, setSelectedSize] = useState<"small" | "medium" | "large">("medium")
  const [selectedSpiceLevel, setSelectedSpiceLevel] = useState("medium")
  const [quantity, setQuantity] = useState(1)

  // ✅ Store selected extras dynamically
  const [selectedCustomizations, setSelectedCustomizations] = useState<
    Record<string, { name: string; price: number }[]>
  >({})

  const [reviews, setReviews] = useState<any[]>([])
  const [loadingReviews, setLoadingReviews] = useState(false)

  const images = dish.images?.length
    ? dish.images
    : [dish.image || "/placeholder.svg"]

  // Size pricing
  const sizePrices = {
    small: dish.price * 0.8,
    medium: dish.price,
    large: dish.price * 1.3,
  }

  const basePrice = sizePrices[selectedSize]

  // ✅ Extras price calculation
  const extrasPrice = Object.values(selectedCustomizations)
    .flat()
    .reduce((sum, opt) => sum + opt.price, 0)

  const finalPrice = basePrice + extrasPrice

  // Fetch reviews
  useEffect(() => {
    if (!open || !dish?._id) return

    const fetchReviews = async () => {
      setLoadingReviews(true)
      try {
        const res = await api.reviews.getDishReviews(dish._id)
        if (res?.success) setReviews(res.reviews || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingReviews(false)
      }
    }

    fetchReviews()
  }, [open, dish?._id])

  const handleAddToCart = () => {
    const item = {
      ...dish,
      price: finalPrice,
      customizations: {
        size: selectedSize,
        spiceLevel: selectedSpiceLevel,
        extras: selectedCustomizations,
      },
    }

    onAddToCart(item, item.customizations, quantity)
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
          <div>
            <div className="relative h-64 w-full rounded overflow-hidden">
              <Image src={images[0]} alt={dish.name} fill className="object-cover" />
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <p className="text-gray-600">{dish.description}</p>

            <div className="flex items-center gap-2">
              <Badge variant={dish.isVeg ? "default" : "destructive"}>
                {dish.isVeg ? "Veg" : "Non-Veg"}
              </Badge>
              {dish.isSpicy && <Badge variant="outline">🌶️ Spicy</Badge>}
              <div className="flex items-center gap-1 text-sm">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                4.5
              </div>
            </div>

            <div className="text-2xl font-bold text-orange-600">
              ₹{finalPrice.toFixed(2)}
            </div>

            {/* Size */}
            <div>
              <Label>Size</Label>
              <RadioGroup
                value={selectedSize}
                onValueChange={(v) => setSelectedSize(v as any)}
                className="flex gap-4 mt-2"
              >
                {Object.entries(sizePrices).map(([key, price]) => (
                  <div key={key} className="flex items-center gap-2">
                    <RadioGroupItem value={key} />
                    <Label>
                      {key} – ₹{price.toFixed(0)}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Spice Level */}
            <div>
              <Label>Spice Level</Label>
              <RadioGroup
                value={selectedSpiceLevel}
                onValueChange={setSelectedSpiceLevel}
                className="flex gap-4 mt-2"
              >
                {["mild", "medium", "hot", "extra-hot"].map(level => (
                  <div key={level} className="flex items-center gap-2">
                    <RadioGroupItem value={level} />
                    <Label>{level}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* ✅ Vendor Customizations */}
            {dish.customizations?.map((custom: any, idx: number) => (
              <div key={idx}>
                <Label className="font-semibold">{custom.name}</Label>

                <div className="space-y-2 mt-2">
                  {custom.options.map((opt: any, i: number) => {
                    const selected =
                      selectedCustomizations[custom.name]?.some(o => o.name === opt.name)

                    return (
                      <div key={i} className="flex items-center gap-2">
                        <Checkbox
                          checked={selected}
                          onCheckedChange={(checked) => {
                            setSelectedCustomizations(prev => {
                              const existing = prev[custom.name] || []

                              if (checked) {
                                return {
                                  ...prev,
                                  [custom.name]: [...existing, opt],
                                }
                              }

                              return {
                                ...prev,
                                [custom.name]: existing.filter(o => o.name !== opt.name),
                              }
                            })
                          }}
                        />
                        <Label>
                          {opt.name}
                          {opt.price > 0 && ` (+₹${opt.price})`}
                        </Label>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* Quantity */}
            <div className="flex items-center gap-4">
              <Label>Quantity</Label>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setQuantity(q => Math.max(1, q - 1))}>
                  <Minus className="w-4 h-4" />
                </Button>
                <span>{quantity}</span>
                <Button size="sm" variant="outline" onClick={() => setQuantity(q => q + 1)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Add to cart */}
            <Button
              className="w-full bg-orange-500 hover:bg-orange-600"
              size="lg"
              onClick={handleAddToCart}
            >
              Add to Cart – ₹{(finalPrice * quantity).toFixed(2)}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
