"use client"

import { useState, useEffect } from "react"
import {
    ArrowLeft,
    MapPin,
    CreditCard,
    Clock,
    CheckCircle,
    Plus,
    QrCode,
    Info,
    Loader2
} from "lucide-react"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useCart } from "@/components/user/CartProvider"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { useAuth } from "@/contexts/AuthContext"

// Declare Razorpay types
declare global {
    interface Window {
        Razorpay: any
    }
}

// Type definitions
interface Address {
    street: string
    city: string
    state: string
    pincode: string
    coordinates: [number, number]
    instructions?: string
}

interface AddressWithLabel {
    id: string
    label: string
    address: Address
}

// Helper function to format address object
const formatAddress = (address: string | Address | undefined): string => {
    if (!address) return "Address not available"
    if (typeof address === 'string') return address
    return `${address.street}, ${address.city}, ${address.state} - ${address.pincode}`
}

// Helper function to detect mobile
const isMobile = () => {
    return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent)
}

export default function CheckoutPage() {
    const { items, getTotalPrice, clearCart, getCurrentVendor } = useCart()
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/auth?mode=register&redirect=/checkout")
        }
    }, [user, authLoading, router])
    const [selectedAddress, setSelectedAddress] = useState("home")
    const [selectedPayment, setSelectedPayment] = useState<string>("")
    const [orderType, setOrderType] = useState("pickup")
    const [isProcessing, setIsProcessing] = useState(false)
    const [specialInstructions, setSpecialInstructions] = useState("")
    const [showAddressForm, setShowAddressForm] = useState(false)
    const [vendorUpiDetails, setVendorUpiDetails] = useState<{ upiId: string; upiName: string; upiEnabled: boolean } | null>(null)
    const [showUpiQrModal, setShowUpiQrModal] = useState(false)
    const [upiPaymentOrderId, setUpiPaymentOrderId] = useState<string | null>(null)
    const [upiPaymentUrl, setUpiPaymentUrl] = useState<string | null>(null)
    const [upiQrCodeUrl, setUpiQrCodeUrl] = useState<string | null>(null)
    const [isVerifyingPayment, setIsVerifyingPayment] = useState(false)
    const [paymentVerificationStep, setPaymentVerificationStep] = useState<"none" | "verifying" | "success" | "manual">("none")
    const [newAddress, setNewAddress] = useState({
        label: "",
        street: "",
        city: "",
        state: "",
        pincode: "",
        coordinates: [0, 0] as [number, number]
    })
    const { toast } = useToast()

    const deliveryFee = orderType === "delivery" ? (getTotalPrice() > 300 ? 0 : 30) : 0
    const taxes = orderType === "delivery" ? Math.round(getTotalPrice() * 0.05) : 0
    const finalTotal = getTotalPrice() + deliveryFee + taxes

    // Simplified addresses state
    const [addresses, setAddresses] = useState<any[]>([])

    useEffect(() => {
        if (user) {
            fetchAddresses()
        }
    }, [user])

    const fetchAddresses = async () => {
        try {
            const response = await api.users.getAddresses()
            if (response.addresses) {
                setAddresses(response.addresses)
                const defaultAddr = response.addresses.find((a: any) => a.isDefault)
                if (defaultAddr) setSelectedAddress(defaultAddr._id)
                else if (response.addresses.length > 0) setSelectedAddress(response.addresses[0]._id)
            }
        } catch (error) {
            console.error("Failed to fetch addresses:", error)
        }
    }

    const basePaymentMethods = [
        { id: "cod", label: "Cash on Delivery", description: "Pay when you receive" },
        { id: "pickup_pay", label: "Pay at Pickup", description: "Pay when you pick up your order" },
    ]

    // Add UPI payment method if enabled for the vendor
    const paymentMethods = [
        ...basePaymentMethods,
        ...(vendorUpiDetails?.upiEnabled && vendorUpiDetails.upiId && vendorUpiDetails.upiName
            ? [{ id: "upi", label: "Pay via UPI", description: "Pay directly to vendor using any UPI app" }]
            : [])
    ]

    // Get selected address object
    const selectedAddrObj = addresses.find(addr => (addr._id || addr.id) === selectedAddress)
    const currentVendor = getCurrentVendor()

    // Fetch vendor UPI settings from vendor profile
    useEffect(() => {
        const fetchUpiSettings = async () => {
            if (!currentVendor?._id) return
            try {
                const response = await api.vendors.getById(currentVendor._id)
                if (response.success && response.vendor?.upiPayment) {
                    const upiPayment = response.vendor.upiPayment
                    if (upiPayment.enabled && upiPayment.upiId && upiPayment.upiName) {
                        setVendorUpiDetails({
                            upiId: upiPayment.upiId,
                            upiName: upiPayment.upiName,
                            upiEnabled: true,
                        })
                    } else {
                        setVendorUpiDetails(null)
                    }
                }
            } catch (error) {
                console.error("Failed to fetch vendor UPI settings:", error)
            }
        }
        fetchUpiSettings()
    }, [currentVendor?._id])

    // Generate QR code when upiPaymentUrl changes
    useEffect(() => {
        if (upiPaymentUrl) {
            try {
                // Use Google Charts API for QR code - CORRECT FORMAT
                const qrCodeUrl = `https://quickchart.io/qr?text=${encodeURIComponent(upiPaymentUrl)}&size=300&margin=1`
                setUpiQrCodeUrl(qrCodeUrl)
                console.log("QR Code URL generated:", qrCodeUrl)
            } catch (error) {
                console.error("Error generating QR code:", error)
                // Fallback to Google Charts
                try {
                    const fallbackUrl = `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encodeURIComponent(upiPaymentUrl)}&choe=UTF-8&chld=L|0`
                    setUpiQrCodeUrl(fallbackUrl)
                } catch (fallbackError) {
                    console.error("Fallback QR generation failed:", fallbackError)
                    toast({
                        title: "QR Code Error",
                        description: "Failed to generate QR code. Please try the UPI link directly.",
                        variant: "destructive",
                    })
                }
            }
        } else {
            setUpiQrCodeUrl(null)
        }
    }, [upiPaymentUrl, toast])

    // Poll for payment status
    useEffect(() => {
        let intervalId: NodeJS.Timeout

        const checkPaymentStatus = async () => {
            if (!vendorUpiDetails?.upiEnabled || !upiPaymentOrderId || !showUpiQrModal) return

            try {
                const response = await api.orders.getById(upiPaymentOrderId)
                if (response.success && response.order) {
                    // If order status changes to 'placed' (meaning payment verified/skipped) or we have a specific payment check
                    // Currently assuming backend updates order status to 'placed' or similar after webhook
                    // BUT wait, we might need a specific check.
                    // Let's assume 'placed' means success for now, or if paymentStatus is 'completed'

                    const order = response.order as any
                    if (order.paymentStatus === 'completed' || order.paymentStatus === 'success') {
                        setShowUpiQrModal(false)
                        router.push(`/checkout/payment-confirmation?orderId=${upiPaymentOrderId}`)
                    }
                }
            } catch (error) {
                console.error("Error polling payment status:", error)
            }
        }

        if (showUpiQrModal && upiPaymentOrderId) {
            intervalId = setInterval(checkPaymentStatus, 3000)
        }

        return () => {
            if (intervalId) clearInterval(intervalId)
        }
    }, [showUpiQrModal, upiPaymentOrderId, vendorUpiDetails?.upiEnabled, router])

    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setNewAddress(prev => ({
                        ...prev,
                        coordinates: [position.coords.longitude, position.coords.latitude] as [number, number]
                    }))
                    toast({
                        title: "Location fetched!",
                        description: "Your current location has been set",
                    })
                },
                (error) => {
                    toast({
                        title: "Location error",
                        description: "Could not get your location. Please enter manually.",
                        variant: "destructive",
                    })
                }
            )
        } else {
            toast({
                title: "Geolocation not supported",
                description: "Your browser doesn't support location services",
                variant: "destructive",
            })
        }
    }

    const saveNewAddress = () => {
        if (!newAddress.label || !newAddress.street || !newAddress.city || !newAddress.state || !newAddress.pincode) {
            toast({
                title: "Missing information",
                description: "Please fill all address fields",
                variant: "destructive",
            })
            return
        }

        const newAddressObj: AddressWithLabel = {
            id: `addr-${Date.now()}`,
            label: newAddress.label,
            address: {
                street: newAddress.street,
                city: newAddress.city,
                state: newAddress.state,
                pincode: newAddress.pincode,
                coordinates: newAddress.coordinates
            }
        }

        setAddresses([...addresses, newAddressObj])
        setSelectedAddress(newAddressObj.id)
        setNewAddress({
            label: "",
            street: "",
            city: "",
            state: "",
            pincode: "",
            coordinates: [0, 0] as [number, number]
        })
        setShowAddressForm(false)
        toast({
            title: "Address saved!",
            description: "Your new address has been added",
        })
    }

    const getAddressFields = (addr: string | Address | undefined): Address => {
        if (!addr) {
            return {
                street: "Not specified",
                city: "Not specified",
                state: "Not specified",
                pincode: "000000",
                coordinates: [0, 0] as [number, number]
            }
        }

        if (typeof addr === 'string') {
            return {
                street: addr,
                city: "Not specified",
                state: "Not specified",
                pincode: "000000",
                coordinates: [0, 0] as [number, number]
            }
        }

        return {
            street: addr.street || "Not specified",
            city: addr.city || "Not specified",
            state: addr.state || "Not specified",
            pincode: addr.pincode || "000000",
            coordinates: addr.coordinates || [0, 0] as [number, number]
        }
    }

    const handlePlaceOrder = async () => {
        setIsProcessing(true)

        try {
            if (items.length === 0) throw new Error("Your cart is empty")
            if (!currentVendor) throw new Error("Vendor information missing")
            if (!selectedPayment) {
                toast({
                    title: "Payment Method Required",
                    description: "Please select a payment method before placing your order",
                    variant: "destructive"
                })
                setIsProcessing(false)
                return
            }

            // Get vendor address with proper validation
            const vendorAddress: Address = typeof currentVendor.address === 'string'
                ? {
                    street: currentVendor.address,
                    city: "Vendor City",
                    state: "Vendor State",
                    pincode: "000000",
                    coordinates: [0, 0] as [number, number]
                }
                : {
                    street: currentVendor.address?.street || "Vendor Street",
                    city: currentVendor.address?.city || "Vendor City",
                    state: currentVendor.address?.state || "Vendor State",
                    pincode: currentVendor.address?.pincode || "000000",
                    coordinates: currentVendor.address?.coordinates || [0, 0] as [number, number]
                }

            // Format currency values to 2 decimal places
            const subtotal = parseFloat(getTotalPrice().toFixed(2))
            const deliveryFee = orderType === "delivery" ? 30 : 0
            const taxes = parseFloat((subtotal * 0.05).toFixed(2))
            const total = parseFloat((subtotal + deliveryFee + taxes).toFixed(2))

            const orderData = {
                vendorId: currentVendor._id,
                vendorName: currentVendor.shopName,
                customerId: user?.id || "guest",
                items: items.map(item => ({
                    menuItemId: item.id,
                    name: item.name,
                    description: item.description,
                    price: parseFloat(item.price.toFixed(2)),
                    quantity: item.quantity,
                    image: item.image,
                    category: item.category
                })),
                orderType,
                paymentMethod: selectedPayment,
                deliveryAddress: orderType === "delivery" || orderType === "pickup"
                    ? {
                        street: selectedAddrObj?.street || selectedAddrObj?.address?.street || "No street",
                        city: selectedAddrObj?.city || selectedAddrObj?.address?.city || "No city",
                        state: selectedAddrObj?.state || selectedAddrObj?.address?.state || "No state",
                        pincode: selectedAddrObj?.pincode || selectedAddrObj?.address?.pincode || "000000",
                        landmark: selectedAddrObj?.landmark || selectedAddrObj?.address?.landmark || "",
                        coordinates: selectedAddrObj?.coordinates || selectedAddrObj?.address?.coordinates || [0, 0],
                    }
                    : undefined,
                subtotal,
                deliveryFee,
                taxes,
                total,
                status: "placed",
                estimatedPreparationTime: 5,
                estimatedDeliveryTime: currentVendor.duration,
                specialInstructions: {
                    customer: specialInstructions,
                },
            }

            console.log("Order data:", JSON.stringify(orderData, null, 2))

            // If UPI is selected, handle payment intent
            if (selectedPayment === "upi") {
                if (!vendorUpiDetails?.upiId || !vendorUpiDetails.upiName) {
                    toast({
                        title: "UPI Not Configured",
                        description: "Vendor has not configured UPI payments.",
                        variant: "destructive",
                    })
                    setIsProcessing(false)
                    return
                }

                // Instead of creating order immediately, just open modal
                // Generate a temporary UPI link
                const tempId = `TEMP-${Date.now()}`
                const upiUrl = `upi://pay?pa=${vendorUpiDetails.upiId}&pn=${encodeURIComponent(vendorUpiDetails.upiName)}&am=${total.toFixed(2)}&cu=INR&tn=Order-${tempId}`

                setUpiPaymentUrl(upiUrl)
                setShowUpiQrModal(true)
                setPaymentVerificationStep("none")
                setIsProcessing(false)
                return
            }

            // For COD or pickup payment
            const response = await api.orders.create(orderData)
            console.log(response)
            if (!response.success) throw new Error(response.error || "Order failed")

            clearCart()
            router.push(`/customer/orders/${response.order.id}`)

            toast({ title: "Order Placed!", description: "Your order was successful" })

        } catch (error: any) {
            console.error("Order error:", error)
            toast({
                title: "Order Failed",
                description: error.message,
                variant: "destructive"
            })
        } finally {
            setIsProcessing(false)
        }
    }

    const placeFinalOrder = async (isAuto = false) => {
        setIsProcessing(true)
        if (isAuto) {
            setIsVerifyingPayment(true)
            setPaymentVerificationStep("verifying")
            // Simulate payment verification delay
            await new Promise(resolve => setTimeout(resolve, 3000))
            setPaymentVerificationStep("success")
            await new Promise(resolve => setTimeout(resolve, 1000))
        }

        try {
            // Recalculate or use existing values (simplified for this call)
            const subtotal = parseFloat(getTotalPrice().toFixed(2))
            const deliveryFee = orderType === "delivery" ? 30 : 0
            const taxes = parseFloat((subtotal * 0.05).toFixed(2))
            const total = parseFloat((subtotal + deliveryFee + taxes).toFixed(2))

            const orderData = {
                vendorId: currentVendor?._id,
                vendorName: currentVendor?.shopName,
                customerId: user?.id || "guest",
                items: items.map(item => ({
                    menuItemId: item.id,
                    name: item.name,
                    price: parseFloat(item.price.toFixed(2)),
                    quantity: item.quantity,
                })),
                orderType,
                paymentMethod: "upi",
                deliveryAddress: orderType === "delivery" || orderType === "pickup"
                    ? {
                        street: selectedAddrObj?.street || selectedAddrObj?.address?.street || "No street",
                        city: selectedAddrObj?.city || selectedAddrObj?.address?.city || "No city",
                        state: selectedAddrObj?.state || selectedAddrObj?.address?.state || "No state",
                        pincode: selectedAddrObj?.pincode || selectedAddrObj?.address?.pincode || "000000",
                        landmark: selectedAddrObj?.landmark || selectedAddrObj?.address?.landmark || "",
                        coordinates: selectedAddrObj?.coordinates || selectedAddrObj?.address?.coordinates || [0, 0],
                    }
                    : undefined,
                subtotal,
                deliveryFee,
                taxes,
                total,
                status: "placed",
                paymentDetails: {
                    method: "upi",
                    status: "completed",
                    transactionId: `TXN-${Date.now()}`
                },
                specialInstructions: {
                    customer: specialInstructions,
                },
            }

            const response = await api.orders.create(orderData)
            if (response.success) {
                clearCart()
                setShowUpiQrModal(false)
                router.push(`/customer/orders/${response.order.id}`)
                toast({ title: "Order Placed!", description: "Payment confirmed successfully" })
            } else {
                throw new Error(response.error || "Failed to place order")
            }
        } catch (error: any) {
            toast({ title: "Order Failed", description: error.message, variant: "destructive" })
        } finally {
            setIsProcessing(false)
            setIsVerifyingPayment(false)
            setPaymentVerificationStep("none")
        }
    }

    const handleUpiPaymentConfirmation = () => {
        placeFinalOrder(false) // Manual confirmation
    }

    const openUpiAppDirectly = () => {
        if (upiPaymentUrl) {
            // Open link
            window.location.href = upiPaymentUrl
            // Start auto-confirmation flow
            placeFinalOrder(true)
        }

        // Fallback for desktop
        setTimeout(() => {
            if (isMobile()) {
                // For mobile, we've tried the deep link
                // If it fails, show instructions
                toast({
                    title: "UPI App Not Found",
                    description: "Please open your UPI app manually and scan the QR code",
                    variant: "destructive",
                })
            } else {
                // For desktop, show UPI ID for manual entry
                toast({
                    title: "UPI Payment",
                    description: "On desktop, please use the QR code or manually enter the UPI ID in your mobile UPI app",
                })
            }
        }, 1000)
    }

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-orange-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
                    <Link href="/">
                        <Button className="bg-orange-500 hover:bg-orange-600">Continue Shopping</Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-orange-50 pb-20">
            {/* Header */}
            <div className="bg-white shadow-sm">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center space-x-4">
                        <Link href="/">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Special Instructions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Special Instructions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Input
                                    placeholder="Any special requests or instructions for the vendor..."
                                    value={specialInstructions}
                                    onChange={(e) => setSpecialInstructions(e.target.value)}
                                />
                            </CardContent>
                        </Card>

                        {/* Order Type */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Order Type</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <RadioGroup
                                    value={orderType}
                                    onValueChange={(value) => {
                                        setOrderType(value)
                                        // Reset payment selection to force user to choose specifically for the selected order type
                                        setSelectedPayment("")
                                    }}
                                >
                                    <div className="flex items-center space-x-2 opacity-50 cursor-not-allowed">
                                        <RadioGroupItem value="delivery" id="delivery" disabled />
                                        <Label htmlFor="delivery" className="cursor-not-allowed">Delivery <span className="text-xs font-normal text-orange-600 border border-orange-200 bg-orange-50 px-2 py-0.5 rounded-full ml-2">Coming Soon</span></Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="pickup" id="pickup" />
                                        <Label htmlFor="pickup">Pickup</Label>
                                    </div>
                                </RadioGroup>
                            </CardContent>
                        </Card>

                        {/* Delivery Address */}
                        {orderType === "delivery" && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <MapPin className="w-5 h-5 mr-2" />
                                        Delivery Address
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="max-h-[300px] overflow-y-auto pr-2">
                                        <RadioGroup value={selectedAddress} onValueChange={setSelectedAddress}>
                                            {addresses.map((address) => (
                                                <div key={address.id} className="flex items-start space-x-3 p-3 border rounded-lg mb-2 last:mb-0">
                                                    <RadioGroupItem value={address.id} id={address.id} className="mt-1" />
                                                    <div className="flex-1 min-w-0">
                                                        <Label htmlFor={address.id} className="font-medium">
                                                            {address.label}
                                                        </Label>
                                                        <p className="text-sm text-gray-600 mt-1 truncate">
                                                            {formatAddress(address.street ? address : address.address)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </div>

                                    <Dialog open={showAddressForm} onOpenChange={setShowAddressForm}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" className="w-full">
                                                <Plus className="w-4 h-4 mr-2" />
                                                Add New Address
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Add New Address</DialogTitle>
                                                <DialogDescription>
                                                    Add a new delivery address for your order
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4">
                                                <div>
                                                    <Label>Address Label</Label>
                                                    <Input
                                                        placeholder="Home, Work, etc."
                                                        value={newAddress.label}
                                                        onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Address</Label>
                                                    <Input
                                                        placeholder="Street and building number"
                                                        value={newAddress.street}
                                                        onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label>City</Label>
                                                        <Input
                                                            placeholder="City"
                                                            value={newAddress.city}
                                                            onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>State</Label>
                                                        <Input
                                                            placeholder="State"
                                                            value={newAddress.state}
                                                            onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label>Pincode</Label>
                                                        <Input
                                                            placeholder="Pincode"
                                                            value={newAddress.pincode}
                                                            onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Location</Label>
                                                        <Button
                                                            variant="outline"
                                                            className="w-full"
                                                            onClick={getCurrentLocation}
                                                        >
                                                            <MapPin className="w-4 h-4 mr-2" />
                                                            Use Current Location
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="flex justify-end space-x-2">
                                                    <Button variant="outline" onClick={() => setShowAddressForm(false)}>
                                                        Cancel
                                                    </Button>
                                                    <Button onClick={saveNewAddress}>
                                                        Save Address
                                                    </Button>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </CardContent>
                            </Card>
                        )}

                        {/* Pickup Information */}
                        {orderType === "pickup" && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <MapPin className="w-5 h-5 mr-2" />
                                        Pickup Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="p-4 bg-orange-50 rounded-lg">
                                        <p className="font-medium">Vendor Location:</p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {currentVendor?.address ?
                                                formatAddress(currentVendor.address) :
                                                "123 Food Lane, Mumbai"
                                            }
                                        </p>
                                        <p className="mt-2 text-sm">
                                            <span className="font-medium">Pickup Time:</span> 15-20 minutes after placing order
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Delivery Time */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Clock className="w-5 h-5 mr-2" />
                                    {orderType === "delivery" ? "Delivery Time" : "Pickup Time"}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <RadioGroup defaultValue="now">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="now" id="now" />
                                        <Label htmlFor="now">
                                            {orderType === "delivery"
                                                ? "Deliver Now (25-30 mins)"
                                                : "Pickup Now (15-20 mins)"}
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="schedule" id="schedule" />
                                        <Label htmlFor="schedule">Schedule for Later</Label>
                                    </div>
                                </RadioGroup>
                            </CardContent>
                        </Card>

                        {/* Payment Method */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <CreditCard className="w-5 h-5 mr-2" />
                                    Payment Method
                                </CardTitle>
                                <CardDescription>
                                    {orderType === "delivery"
                                        ? "Pay when your order arrives"
                                        : "Pay when you pick up your order"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <RadioGroup value={selectedPayment} onValueChange={setSelectedPayment}>
                                    {paymentMethods.map((method) => (
                                        <div key={method.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                                            <RadioGroupItem
                                                value={method.id}
                                                id={method.id}
                                                className="mt-1"
                                                disabled={
                                                    (orderType === "pickup" && method.id === "cod") ||
                                                    (orderType === "delivery" && method.id === "pickup_pay")
                                                }
                                            />
                                            <div className="flex-1">
                                                <Label htmlFor={method.id} className="font-medium">
                                                    {method.label}
                                                </Label>
                                                <p className="text-sm text-gray-600 mt-1">{method.description}</p>

                                                {orderType === "pickup" && method.id === "cod" && (
                                                    <p className="text-xs text-red-500 mt-1">
                                                        COD not available for pickup orders
                                                    </p>
                                                )}
                                                {orderType === "delivery" && method.id === "pickup_pay" && (
                                                    <p className="text-xs text-red-500 mt-1">
                                                        Pay at pickup not available for delivery orders
                                                    </p>
                                                )}
                                                {method.id === "razorpay" && orderType === "pickup" && (
                                                    <p className="text-xs text-orange-500 mt-1">
                                                        Online payment available for pickup orders
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {selectedPayment === "upi" && vendorUpiDetails?.upiEnabled && (
                                        <div className="flex flex-col items-center space-y-3 mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                            <p className="text-sm text-blue-800 font-medium text-center">
                                                You will be redirected to your UPI app. After payment, return here to confirm.
                                            </p>
                                            <Button
                                                onClick={() => setShowUpiQrModal(true)}
                                                variant="outline"
                                                className="w-full text-blue-700 border-blue-300 hover:bg-blue-100"
                                                disabled={isProcessing}
                                            >
                                                <QrCode className="w-4 h-4 mr-2" /> View UPI QR Code
                                            </Button>
                                        </div>
                                    )}
                                </RadioGroup>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-4">
                            <CardHeader>
                                <CardTitle>Order Summary</CardTitle>
                                <CardDescription>
                                    {items.length} items from {currentVendor?.shopName || "Vendor"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Order Items */}
                                <div className="space-y-3">
                                    {items.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <h4 className="font-medium text-sm">{item.name}</h4>
                                                <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                                            </div>
                                            <span className="font-medium">₹{item.price * item.quantity}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t pt-4 space-y-2">
                                    <div className="flex justify-between">
                                        <span>Subtotal</span>
                                        <span>₹{getTotalPrice().toFixed(2)}</span>
                                    </div>

                                    {orderType === "delivery" && (
                                        <div className="flex justify-between">
                                            <span>Delivery Fee</span>
                                            <span className={deliveryFee === 0 ? "text-green-600" : ""}>
                                                {deliveryFee === 0 ? "FREE" : `₹${deliveryFee.toFixed(2)}`}
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex justify-between">
                                        <span>Taxes & Fees</span>
                                        <span>₹{taxes.toFixed(2)}</span>
                                    </div>
                                    <div className="border-t pt-2 flex justify-between font-bold text-lg">
                                        <span>Total</span>
                                        <span>₹{finalTotal.toFixed(2)}</span>
                                    </div>
                                </div>

                                <Button
                                    onClick={handlePlaceOrder}
                                    disabled={isProcessing}
                                    className="w-full bg-orange-500 hover:bg-orange-600"
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    {isProcessing ? "Processing..." : `Place Order - ₹${finalTotal.toFixed(2)}`}
                                </Button>

                                <div className="text-xs text-gray-500 text-center">
                                    {selectedPayment === "upi" && (
                                        <p className="font-medium text-blue-700">
                                            <Info className="inline w-3 h-3 mr-1" /> UPI payments are verified by the restaurant after order placement.
                                        </p>
                                    )}
                                    <p className="font-medium">Payment at {orderType === "delivery" ? "delivery" : "pickup"}</p>
                                    <p className="mt-1">By placing this order, you agree to our Terms & Conditions</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* UPI QR Code Modal */}
            <Dialog open={showUpiQrModal} onOpenChange={setShowUpiQrModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center">
                            <QrCode className="w-5 h-5 mr-2" />
                            Pay via UPI
                        </DialogTitle>
                        <DialogDescription>
                            Scan the QR code below with any UPI app to make the payment.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col items-center justify-center space-y-4">
                        {isVerifyingPayment ? (
                            <div className="flex flex-col items-center justify-center py-10 space-y-4 text-center">
                                {paymentVerificationStep === "verifying" ? (
                                    <>
                                        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                                        <p className="text-lg font-medium">Verifying Payment...</p>
                                        <p className="text-sm text-gray-500">Please complete the payment in your UPI app. Do not close this window.</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                            <Check className="w-8 h-8 text-green-600" />
                                        </div>
                                        <p className="text-lg font-medium text-green-600">Payment Successful!</p>
                                        <p className="text-sm text-gray-500">Placing your order now...</p>
                                    </>
                                )}
                            </div>
                        ) : upiQrCodeUrl ? (
                            <>
                                <div className="p-4 bg-white rounded-lg border">
                                    <img
                                        src={upiQrCodeUrl}
                                        alt="UPI QR Code"
                                        width={250}
                                        height={250}
                                        className="w-full h-auto"
                                    />
                                </div>

                                <div className="text-center">
                                    <p className="text-sm font-medium">Vendor: {vendorUpiDetails?.upiName}</p>
                                    <p className="text-sm text-gray-600 font-mono mt-1 break-all">{vendorUpiDetails?.upiId}</p>
                                    <p className="text-xl font-bold mt-2 text-orange-600">₹{finalTotal.toFixed(2)}</p>
                                </div>

                                <div className="flex flex-col space-y-2 w-full">
                                    <Button
                                        onClick={openUpiAppDirectly}
                                        className="w-full bg-blue-600 hover:bg-blue-700"
                                        disabled={isProcessing}
                                    >
                                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                        Pay via App
                                    </Button>

                                    <Button
                                        onClick={handleUpiPaymentConfirmation}
                                        className="w-full bg-orange-500 hover:bg-orange-600"
                                        disabled={isProcessing}
                                    >
                                        I Have Paid
                                    </Button>

                                    <Button
                                        onClick={() => setShowUpiQrModal(false)}
                                        variant="ghost"
                                        className="w-full"
                                        disabled={isProcessing}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 space-y-4">
                                <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center animate-pulse">
                                    <QrCode className="w-16 h-16 text-gray-400" />
                                </div>
                                <p className="text-gray-500">Generating QR code...</p>
                            </div>
                        )}

                        <div className="text-xs text-gray-500 text-center">
                            <Info className="inline w-3 h-3 mr-1" />
                            <span>{isVerifyingPayment ? "Secure payment verification" : "Scan or use UPI app to pay"}</span>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}