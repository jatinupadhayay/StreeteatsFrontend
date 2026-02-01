"use client"

import { useState } from "react"
import { Star, Plus, Minus, ChevronDown, ChevronUp } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

interface MenuItemCardProps {
    item: any
    onAddToCart: (item: any, customizations: Record<string, any>, quantity: number) => void
}

export function MenuItemCard({ item, onAddToCart }: MenuItemCardProps) {
    const [expanded, setExpanded] = useState(false)
    const [quantity, setQuantity] = useState(1)
    const [selectedCustomizations, setSelectedCustomizations] = useState<Record<string, any>>({})

    // Initialize default customizations
    useState(() => {
        if (!item?.customizations) return

        const initialCustomizations: Record<string, any> = {}
        item.customizations.forEach((custom: any) => {
            if (custom.required && custom.options?.length > 0) {
                if (custom.multiSelect) {
                    initialCustomizations[custom.name] = []
                } else {
                    initialCustomizations[custom.name] = custom.options[0]
                }
            }
        })
        setSelectedCustomizations(initialCustomizations)
    })

    const calculateFinalPrice = () => {
        let total = item.price || 0

        Object.values(selectedCustomizations).forEach((value) => {
            if (Array.isArray(value)) {
                value.forEach((opt: any) => {
                    total += opt.price || 0
                })
            } else if (value && typeof value === 'object') {
                total += value.price || 0
            }
        })

        return total
    }

    const finalPrice = calculateFinalPrice()
    const hasCustomizations = item.customizations && item.customizations.length > 0

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

    const handleAddToCart = () => {
        onAddToCart(item, selectedCustomizations, quantity)
        // Reset state
        setExpanded(false)
        setQuantity(1)
        setSelectedCustomizations({})
    }

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="p-4">
                <div className="flex gap-4">
                    {/* Image */}
                    <div className="flex-shrink-0">
                        <Image
                            src={item.image || "/placeholder.svg"}
                            className="w-24 h-24 object-cover rounded-lg"
                            alt={item.name}
                            width={96}
                            height={96}
                        />
                    </div>

                    {/* Details */}
                    <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg">{item.name}</h3>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.description || "Delicious dish"}</p>

                        <div className="flex items-center space-x-2 mb-2 flex-wrap gap-1">
                            <Badge className={item.isVeg ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                                {item.isVeg ? "🟢 VEG" : "🔴 NON-VEG"}
                            </Badge>
                            {item.isSpicy && <Badge className="bg-orange-100 text-orange-800">🌶️ SPICY</Badge>}
                            <Badge variant="outline" className="text-xs">
                                <Star className="w-3 h-3 mr-1 text-yellow-400 fill-current" />
                                4.5
                            </Badge>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <span className="font-bold text-lg">₹{finalPrice.toFixed(0)}</span>
                                {item.originalPrice && (
                                    <span className="text-sm text-gray-500 line-through">₹{item.originalPrice}</span>
                                )}
                            </div>

                            {hasCustomizations && !expanded && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setExpanded(true)}
                                    className="text-orange-600 border-orange-600"
                                >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Customize
                                </Button>
                            )}

                            {!hasCustomizations && (
                                <Button
                                    onClick={handleAddToCart}
                                    className="bg-orange-500 hover:bg-orange-600"
                                    size="sm"
                                >
                                    <Plus className="w-4 h-4 mr-1" /> Add
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Expandable Customizations */}
                {hasCustomizations && expanded && (
                    <div className="mt-4 pt-4 border-t space-y-4">
                        {item.customizations.map((custom: any, idx: number) => (
                            <div key={idx} className="space-y-2">
                                <Label className="font-semibold text-sm">
                                    {custom.name}
                                    {custom.required && <span className="text-red-500 ml-1">*</span>}
                                </Label>

                                {custom.multiSelect ? (
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
                                                    <Label className="cursor-pointer text-sm">
                                                        {opt.name}
                                                        {opt.price > 0 && ` (+₹${opt.price})`}
                                                    </Label>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
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
                                                <Label className="cursor-pointer text-sm">
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
                            <Label className="text-sm font-semibold">Quantity</Label>
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                >
                                    <Minus className="w-4 h-4" />
                                </Button>
                                <span className="w-8 text-center font-medium">{quantity}</span>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setQuantity(q => q + 1)}
                                >
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                            <Button
                                variant="outline"
                                onClick={() => setExpanded(false)}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAddToCart}
                                className="flex-1 bg-orange-500 hover:bg-orange-600"
                            >
                                Add to Cart – ₹{(finalPrice * quantity).toFixed(0)}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
