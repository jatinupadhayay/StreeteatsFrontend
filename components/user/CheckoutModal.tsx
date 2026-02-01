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
    const [addresses, setAddresses] = useState<any[]>([])
    const [selectedAddressIndex, setSelectedAddressIndex] = useState<number>(0)
    const [paymentMethod, setPaymentMethod] = useState("cod") // Default COD
    const [step, setStep] = useState<"checkout" | "payment" | "verifying" | "success">("checkout")

    useEffect(() => {
        if (open && user) {
            fetchAddresses()
        }
    }, [open, user])

    const fetchAddresses = async () => {
        try {
            const response = await api.users.getAddresses()
            if (response.addresses) {
                setAddresses(response.addresses)
                const defaultIdx = response.addresses.findIndex((a: any) => a.isDefault)
                if (defaultIdx !== -1) setSelectedAddressIndex(defaultIdx)
            }
        } catch (error) {
            console.error("Failed to fetch addresses:", error)
        }
    }

    const handleAppPayment = async () => {
        setStep("verifying")
        // Simulate app opening and payment verification
        setTimeout(() => {
            handlePlaceOrder()
        }, 3000)
    }

    const subtotal = getTotalPrice()
    const deliveryFee = 50
    const taxes = subtotal * 0.05
    const total = subtotal + deliveryFee + taxes

    const handleConfirmPayment = () => {
        if (paymentMethod === "online") {
            setStep("payment")
        } else {
            handlePlaceOrder()
        }
    }

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

        const currentAddress = addresses[selectedAddressIndex] || {
            street: "No address selected",
            city: "N/A",
            state: "N/A",
            pincode: "000000",
            coordinates: [0, 0],
            landmark: ""
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
                    street: currentAddress.street,
                    city: currentAddress.city,
                    state: currentAddress.state,
                    pincode: currentAddress.pincode,
                    landmark: currentAddress.landmark || "",
                    coordinates: currentAddress.coordinates || [0, 0]
                },
                paymentMethod: paymentMethod === 'online' ? 'upi' : 'cod',
                orderType: "delivery",
                totalAmount: total
            }

            const data = await api.orders.create(orderPayload) as any

            if (!data.success) {
                throw new Error(data.message || "Failed to place order")
            }

            toast({
                title: "Order Placed Successfully!",
                description: `Order #${data.order.orderNumber || data.order.id?.slice(-6) || data.order._id?.slice(-6)}`,
                duration: 3000
            })

            clearCart()
            // Important: Redirect to tracking page, status will be 'placed'
            const orderId = data.order.id || data.order._id
            router.push(`/order-tracking/${orderId}`)
            onOpenChange(false)

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

                <div className="flex-1 overflow-y-auto p-6">
                    {step === "checkout" ? (
                        <div className="space-y-6">
                            {/* Delivery Address */}
                            <div className="space-y-3">
                                <h3 className="font-semibold flex items-center"><MapPin className="w-4 h-4 mr-2" /> Delivery Address</h3>
                                {addresses.length > 0 ? (
                                    <div className="space-y-2">
                                        {addresses.map((addr, idx) => (
                                            <div
                                                key={addr._id || idx}
                                                className={`p-4 border rounded-lg cursor-pointer transition flex items-center justify-between ${selectedAddressIndex === idx
                                                    ? "border-orange-500 bg-orange-50"
                                                    : "bg-gray-50 hover:bg-gray-100"
                                                    }`}
                                                onClick={() => setSelectedAddressIndex(idx)}
                                            >
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm">{addr.label || "Address"}</p>
                                                    <p className="text-xs text-gray-500 leading-tight">
                                                        {addr.street}, {addr.landmark ? `${addr.landmark}, ` : ""}{addr.city}, {addr.state} - {addr.pincode}
                                                    </p>
                                                </div>
                                                {selectedAddressIndex === idx && (
                                                    <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 border rounded-lg bg-gray-50 text-center">
                                        <p className="text-sm text-gray-500 mb-2">No addresses found</p>
                                        <Button size="sm" onClick={() => router.push("/customer/profile")}>
                                            Add Address in Profile
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Payment Method */}
                            <div className="space-y-3">
                                <h3 className="font-semibold flex items-center"><CreditCard className="w-4 h-4 mr-2" /> Payment Method</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <div
                                        className={`p-3 border rounded-lg cursor-pointer text-center transition ${paymentMethod === 'cod' ? "border-orange-500 bg-orange-50" : "bg-gray-50"
                                            }`}
                                        onClick={() => setPaymentMethod('cod')}
                                    >
                                        <p className="font-medium text-sm">Cash</p>
                                        <p className="text-[10px] text-gray-500">Pay on delivery</p>
                                    </div>
                                    <div
                                        className={`p-3 border rounded-lg cursor-pointer text-center transition ${paymentMethod === 'online' ? "border-orange-500 bg-orange-50" : "bg-gray-50"
                                            }`}
                                        onClick={() => setPaymentMethod('online')}
                                    >
                                        <p className="font-medium text-sm">Online</p>
                                        <p className="text-[10px] text-gray-500">Scan & Pay</p>
                                    </div>
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
                    ) : step === "payment" ? (
                        <div className="flex flex-col items-center justify-center space-y-8 py-10 text-center">
                            <div className="relative">
                                <div className="w-48 h-48 bg-white p-4 rounded-2xl shadow-sm border border-orange-100">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=jatin@upi&pn=StreetEats&am=${total.toFixed(2)}&cu=INR`}
                                        alt="Payment QR"
                                        className="w-full h-auto"
                                    />
                                </div>
                                <div className="absolute -top-3 -right-3 bg-orange-500 text-white p-2 rounded-full shadow-lg">
                                    <IndianRupee className="w-4 h-4" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-gray-900">Scan to Pay ₹{total.toFixed(2)}</h3>
                                <p className="text-sm text-gray-500 max-w-xs mx-auto">
                                    Use any UPI app like GPay, PhonePe, or Paytm to scan and pay.
                                </p>
                            </div>

                            <div className="flex flex-col space-y-3 w-full max-w-xs">
                                <Button
                                    className="w-full bg-blue-600 hover:bg-blue-700 h-12 rounded-xl text-lg font-bold"
                                    onClick={handleAppPayment}
                                >
                                    Pay via App
                                </Button>

                                <Button
                                    className="w-full bg-orange-500 hover:bg-orange-600 h-12 rounded-xl text-lg font-bold"
                                    onClick={handlePlaceOrder}
                                >
                                    I Have Paid • Proceed
                                </Button>

                                <Button
                                    variant="ghost"
                                    className="w-full h-12 text-gray-500"
                                    onClick={() => setStep("checkout")}
                                >
                                    Back to Checkout
                                </Button>
                            </div>
                        </div>
                    ) : step === "verifying" ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-6 text-center">
                            <Loader2 className="w-16 h-16 animate-spin text-blue-600" />
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold">Verifying Payment...</h3>
                                <p className="text-sm text-gray-500">Please do not close this window while we confirm your transaction.</p>
                            </div>
                        </div>
                    ) : null}
                </div>

                <div className="p-6 border-t bg-gray-50">
                    {step === "checkout" && (
                        <Button
                            className="w-full bg-orange-500 hover:bg-orange-600 h-12 text-lg font-bold"
                            onClick={handleConfirmPayment}
                            disabled={loading || items.length === 0}
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                            Proceed to Pay • ₹{total.toFixed(2)}
                        </Button>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
