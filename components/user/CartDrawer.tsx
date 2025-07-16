"use client"

import { useState } from "react"
import { ShoppingCart, Plus, Minus, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useCart } from "./CartProvider"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function CartDrawer() {
  const [isOpen, setIsOpen] = useState(false)
  const { 
    items, 
    updateQuantity, 
    removeItem, 
    getTotalItems, 
    getTotalPrice, 
    clearCart,
    getCurrentVendor 
  } = useCart()
  const router = useRouter()

  const handleCheckout = () => {
    setIsOpen(false)
    router.push("/checkout")
  }

  const toggleCart = () => setIsOpen(!isOpen)

  if (getTotalItems() === 0) {
    return null
  }

  const currentVendor = getCurrentVendor()

  return (
    <>
      {/* Floating Cart Button */}
      <Button
        onClick={toggleCart}
        size="lg"
        className="fixed bottom-20 right-4 z-50 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg md:bottom-4"
        aria-label="Open cart"
      >
        <ShoppingCart className="w-5 h-5 mr-2" />
        <Badge className="bg-white text-orange-500 ml-2">{getTotalItems()}</Badge>
      </Button>

      {/* Cart Drawer Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        >
          <div
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform duration-300 ease-in-out"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h2 className="text-lg font-semibold">Your Cart</h2>
                {currentVendor && (
                  <p className="text-xs text-gray-500">
                    Ordering from: {currentVendor.shopName}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearCart}
                  disabled={items.length === 0}
                  aria-label="Clear cart"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsOpen(false)}
                  aria-label="Close cart"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Cart Content */}
            <div className="flex flex-col h-[calc(100%-60px)]">
              <div className="flex-1 overflow-y-auto p-4">
                {items.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">Your cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div 
                        key={item.id} 
                        className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg"
                      >
                        <div className="relative w-12 h-12">
                          <Image
                            src={item.image || "/placeholder.svg"}
                            alt={item.name}
                            fill
                            className="object-cover rounded"
                            sizes="48px"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{item.name}</h4>
                          <p className="text-xs text-gray-500 truncate">
                            {typeof item.vendor.address === 'string' 
                              ? item.vendor.address 
                              : `${item.vendor.address?.street}, ${item.vendor.address?.city}`}
                          </p>
                          <p className="font-bold text-orange-600">₹{item.price.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="font-medium w-6 text-center">{item.quantity}</span>
                          <Button 
                            size="sm" 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => removeItem(item.id)}
                          aria-label="Remove item"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cart Footer */}
              {items.length > 0 && (
                <div className="border-t p-4 space-y-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total: ₹{getTotalPrice().toFixed(2)}</span>
                    <span>{getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'}</span>
                  </div>
                  <Button 
                    onClick={handleCheckout} 
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    aria-label="Proceed to checkout"
                  >
                    Proceed to Checkout
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}