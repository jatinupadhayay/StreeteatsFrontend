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
  const [quantity, setQuantity] = useState(1)

  // Store selected customizations: { customizationName: selectedOption(s) }
  const [selectedCustomizations, setSelectedCustomizations] = useState<
    Record<string, any>
  >({})

  const [reviews, setReviews] = useState<any[]>([])
  const [loadingReviews, setLoadingReviews] = useState(false)

  const images = dish.images?.length
    ? dish.images
    : [dish.image || "/placeholder.svg"]

  // Reset customizations when dish changes
  useEffect(() => {
    if (!dish?.customizations) return

    const initialCustomizations: Record<string, any> = {}

    // Set default selections for required customizations
    dish.customizations.forEach((custom: any) => {
      if (custom.required && custom.options?.length > 0) {
        if (custom.multiSelect) {
          initialCustomizations[custom.name] = []
        } else {
          // Select first option for required single-select
          initialCustomizations[custom.name] = custom.options[0]
        }
      }
    })

    setSelectedCustomizations(initialCustomizations)
  }, [dish?._id])

  // Calculate final price based on base price + selected customization prices
  const calculateFinalPrice = () => {
    let total = dish.price || 0

    Object.values(selectedCustomizations).forEach((value) => {
      if (Array.isArray(value)) {
        // Multi-select: sum all selected option prices
        value.forEach((opt: any) => {
          total += opt.price || 0
        })
      } else if (value && typeof value === 'object') {
        // Single-select: add the selected option's price
        total += value.price || 0
      }
    })

    return total
  }

  const finalPrice = calculateFinalPrice()

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
      customizations: selectedCustomizations,
    }

    onAddToCart(item, selectedCustomizations, quantity)
    onOpenChange(false)
  }

  const handleSingleSelectChange = (customizationName: string, option: any) => {
    setSelectedCustomizations(prev => ({
      ...prev,
      [customizationName]: option
    }))
  }

  const handleMultiSelectChange = (customizationName: string, option: any, checked: boolean) => {
    setSelectedCustomizations(prev => {
      const existing = prev[customizationName] || []

      if (checked) {
        return {
          ...prev,
          [customizationName]: [...existing, option]
        }
      }

      return {
        ...prev,
        [customizationName]: existing.filter((o: any) => o.name !== option.name)
      }
    })
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

            {/* Vendor-Defined Customizations */}
            {dish.customizations?.map((custom: any, idx: number) => (
              <div key={idx} className="space-y-2">
                <Label className="font-semibold">
                  {custom.name}
                  {custom.required && <span className="text-red-500 ml-1">*</span>}
                </Label>

                {custom.multiSelect ? (
                  // Multi-select with checkboxes
                  <div className="space-y-2">
                    {custom.options?.map((opt: any, i: number) => {
                      const selected = selectedCustomizations[custom.name]?.some(
                        (o: any) => o.name === opt.name
                      )

                      return (
                        <div key={i} className="flex items-center gap-2">
                          <Checkbox
                            checked={selected}
                            onCheckedChange={(checked) =>
                              handleMultiSelectChange(custom.name, opt, checked as boolean)
                            }
                          />
                          <Label className="cursor-pointer">
                            {opt.name}
                            {opt.price > 0 && ` (+₹${opt.price})`}
                          </Label>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  // Single-select with radio buttons
                  <RadioGroup
                    value={selectedCustomizations[custom.name]?.name || ""}
                    onValueChange={(optionName) => {
                      const option = custom.options.find((o: any) => o.name === optionName)
                      if (option) handleSingleSelectChange(custom.name, option)
                    }}
                    className="space-y-2"
                  >
                    {custom.options?.map((opt: any, i: number) => (
                      <div key={i} className="flex items-center gap-2">
                        <RadioGroupItem value={opt.name} />
                        <Label className="cursor-pointer">
                          {opt.name}
                          {opt.price > 0 && ` (+₹${opt.price})`}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
              </div>
            ))}

            {/* Quantity */}
            <div className="flex items-center gap-4">
              <Label>Quantity</Label>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setQuantity(q => Math.max(1, q - 1))}>
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-8 text-center">{quantity}</span>
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
