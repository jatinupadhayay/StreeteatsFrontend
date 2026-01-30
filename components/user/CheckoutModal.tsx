"use client"

import { useState, useEffect } from "react"
import { useCart } from "@/components/user/CartProvider"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { MapPin, CreditCard, ChevronRight, Loader2, IndianRupee } from "lucide-react"
import { api } from "@/lib/api"

interface CheckoutModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export default function CheckoutModal({ open, onOpenChange }: CheckoutModalProps) {
    const { items, getTotalPrice, clearCart, currentVendorId } = useCart()
    const { user } = useAuth()
    const { toast } = useToast()
    const router = useRouter()

    const [loading, setLoading] = useState(false)
    const [address, setAddress] = useState("San Francisco, CA") // Placeholder
    const [paymentMethod, setPaymentMethod] = useState("cod") // Default COD

    const subtotal = getTotalPrice()
    const deliveryFee = 50
    const taxes = subtotal * 0.05
    const total = subtotal + deliveryFee + taxes

    const handlePlaceOrder = async () => {
        if (!user) {
            router.push("/auth?mode=register&redirect=/customer")
            return
        }

        if (items.length === 0) {
            toast({ title: "Cart is empty" })
            return
        }

        if (!currentVendorId) {
            toast({ title: "No vendor selected", variant: "destructive" })
            return
        }

        try {
            setLoading(true)

            const orderPayload = {
                vendorId: currentVendorId,
                items: items.map(item => ({
                    menuItemId: item.id,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price
                })),
                deliveryAddress: {
                    street: address,
                    city: "City", // Placeholder
                    state: "State",
                    pincode: "000000",
                    coordinates: [0, 0] as [number, number]
                },
                paymentMethod: paymentMethod,
                orderType: "delivery",
                totalAmount: total
            }

            // API Call through centralized service
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const data = await api.orders.create(orderPayload) as any

            if (!data.success) {
                throw new Error(data.message || "Failed to place order")
            }

            toast({
                title: "Order Placed Successfully!",
                description: `Order #${data.order.orderId || data.order._id.slice(-6)}`,
                duration: 3000
            })

            clearCart()
            onOpenChange(false)
            router.push("/customer/orders")

        } catch (error: any) {
            console.error("Order error:", error)
            toast({
                title: "Order Failed",
                description: error.message || "Could not place order. Please try again.",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
                <SheetHeader className="p-6 border-b">
                    <SheetTitle>Checkout</SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Delivery Address */}
                    <div className="space-y-3">
                        <h3 className="font-semibold flex items-center"><MapPin className="w-4 h-4 mr-2" /> Delivery Address</h3>
                        <div className="p-4 border rounded-lg bg-gray-50 flex justify-between items-center cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition">
                            <div>
                                <p className="font-medium">Home</p>
                                <p className="text-sm text-gray-500">{address}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-3">
                        <h3 className="font-semibold flex items-center"><CreditCard className="w-4 h-4 mr-2" /> Payment Method</h3>
                        <div className="p-4 border rounded-lg bg-gray-50 flex justify-between items-center cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition" onClick={() => setPaymentMethod(paymentMethod === 'cod' ? 'online' : 'cod')}>
                            <div>
                                <p className="font-medium">{paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</p>
                                <p className="text-sm text-gray-500">{paymentMethod === 'cod' ? 'Pay when you receive' : 'UPI / Card'}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="space-y-3">
                        <h3 className="font-semibold">Order Summary</h3>
                        <div className="space-y-2 border rounded-lg p-4 bg-gray-50">
                            {items.map(item => (
                                <div key={item.id} className="flex justify-between text-sm">
                                    <span>{item.quantity}x {item.name}</span>
                                    <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                            <div className="border-t my-2 pt-2 space-y-1">
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Subtotal</span>
                                    <span>₹{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Delivery Fee</span>
                                    <span>₹{deliveryFee.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Taxes (5%)</span>
                                    <span>₹{taxes.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
                                    <span>Total</span>
                                    <span>₹{total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t bg-gray-50">
                    <Button
                        className="w-full bg-orange-500 hover:bg-orange-600 h-12 text-lg font-bold"
                        onClick={handlePlaceOrder}
                        disabled={loading || items.length === 0}
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                        Place Order • ₹{total.toFixed(2)}
                    </Button>
                </div>

            </SheetContent>
        </Sheet>
    )
}
