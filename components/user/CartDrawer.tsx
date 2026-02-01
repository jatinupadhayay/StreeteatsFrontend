"use client"

import { ShoppingCart, X, Plus, Minus, Trash2 } from "lucide-react"
import { useState } from "react"
import { useCart } from "./CartProvider"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useRouter } from "next/navigation"

export default function CartDrawer() {
    const { items, updateQuantity, removeItem, getTotalItems, getTotalPrice, clearCart } = useCart()
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()

    const handleCheckout = () => {
        setIsOpen(false)
        router.push("/checkout")
    }

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className="fixed bottom-20 right-4 z-50 h-14 w-14 rounded-full bg-orange-500 text-white shadow-lg hover:bg-orange-600 md:bottom-4"
                >
                    <ShoppingCart className="h-6 w-6" />
                    {getTotalItems() > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                            {getTotalItems()}
                        </span>
                    )}
                </Button>
            </SheetTrigger>

            <SheetContent className="w-full sm:max-w-md">
                <SheetHeader>
                    <SheetTitle className="flex items-center justify-between">
                        <span>Your Cart ({getTotalItems()} items)</span>
                        {items.length > 0 && (
                            <Button variant="ghost" size="sm" onClick={clearCart} className="text-red-500 hover:text-red-600">
                                <Trash2 className="h-4 w-4 mr-1" />
                                Clear
                            </Button>
                        )}
                    </SheetTitle>
                </SheetHeader>

                <div className="mt-6 flex flex-col h-[calc(100vh-12rem)]">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center flex-1 text-gray-500">
                            <ShoppingCart className="h-16 w-16 mb-4 text-gray-300" />
                            <p className="text-lg font-medium">Your cart is empty</p>
                            <p className="text-sm">Add items to get started</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                                {items.map((item) => (
                                    <div key={item.id} className="flex gap-3 border-b pb-4">
                                        <img
                                            src={item.image || "/placeholder-dish.jpg"}
                                            alt={item.name}
                                            className="h-20 w-20 rounded-lg object-cover"
                                        />
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-sm">{item.name}</h4>
                                            {item.customizations && Object.keys(item.customizations).length > 0 && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {Object.entries(item.customizations).map(([key, value]: [string, any]) => {
                                                        if (Array.isArray(value)) {
                                                            return value.length > 0 ? (
                                                                <div key={key}>
                                                                    {key}: {value.map((v: any) => v.name).join(", ")}
                                                                </div>
                                                            ) : null;
                                                        } else if (value && typeof value === 'object') {
                                                            return <div key={key}>{key}: {value.name}</div>;
                                                        }
                                                        return null;
                                                    })}
                                                </div>
                                            )}
                                            <p className="text-xs text-gray-500 mt-1">₹{item.price}</p>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 ml-auto text-red-500 hover:text-red-600"
                                                    onClick={() => removeItem(item.id)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">₹{item.price * item.quantity}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t pt-4 space-y-3">
                                <div className="flex justify-between text-lg font-bold">
                                    <span>Total</span>
                                    <span>₹{getTotalPrice()}</span>
                                </div>
                                <Button onClick={handleCheckout} className="w-full bg-orange-500 hover:bg-orange-600">
                                    Proceed to Checkout
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
