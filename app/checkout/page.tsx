"use client"

import { useState } from "react"
import { ArrowLeft, MapPin, CreditCard, Clock, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useCart } from "@/components/user/CartProvider"
import { useToast } from "@/hooks/use-toast"
import { createPaymentOrder, verifyPayment, getRazorpayConfig } from "@/app/actions/payment"
import Link from "next/link"

declare global {
  interface Window {
    Razorpay: any
  }
}

export default function CheckoutPage() {
  const { items, getTotalPrice, clearCart } = useCart()
  const [selectedAddress, setSelectedAddress] = useState("home")
  const [selectedPayment, setSelectedPayment] = useState("upi")
  const [orderType, setOrderType] = useState("delivery")
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  const deliveryFee = getTotalPrice() > 300 ? 0 : 30
  const taxes = Math.round(getTotalPrice() * 0.05)
  const finalTotal = getTotalPrice() + deliveryFee + taxes

  const addresses = [
    { id: "home", label: "Home", address: "123 Park Street, Near City Mall, Mumbai - 400001" },
    { id: "office", label: "Office", address: "456 Business District, Andheri East, Mumbai - 400069" },
  ]

  const paymentMethods = [
    { id: "upi", label: "UPI", description: "Pay using UPI apps" },
    { id: "card", label: "Credit/Debit Card", description: "Visa, Mastercard, RuPay" },
    { id: "wallet", label: "Digital Wallet", description: "Paytm, PhonePe, Google Pay" },
    { id: "cod", label: "Cash on Delivery", description: "Pay when you receive" },
  ]

  const handlePlaceOrder = async () => {
    if (selectedPayment === "cod") {
      // Handle COD orders
      toast({
        title: "Order Placed Successfully! 🎉",
        description: "Your order has been confirmed and will be prepared soon",
      })
      clearCart()
      window.location.href = "/delivery"
      return
    }

    // Handle online payments
    setIsProcessing(true)

    try {
      // Get Razorpay config from server
      const configResult = await getRazorpayConfig()
      if (!configResult.success) {
        throw new Error("Failed to get payment configuration")
      }

      // Create order on server
      const orderResult = await createPaymentOrder({
        amount: finalTotal,
        orderId: `order_${Date.now()}`,
        currency: "INR",
      })

      if (!orderResult.success) {
        throw new Error(orderResult.error)
      }

      // Load Razorpay script
      const script = document.createElement("script")
      script.src = "https://checkout.razorpay.com/v1/checkout.js"
      script.onload = () => {
        const options = {
          key: configResult.data.key, // Public key from server
          amount: finalTotal * 100, // Convert to paise
          currency: "INR",
          name: "Street Eats",
          description: "Food Order Payment",
          handler: async (response: any) => {
            // Verify payment on server
            const verifyResult = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: `order_${Date.now()}`,
            })

            if (verifyResult.success) {
              toast({
                title: "Payment Successful! 🎉",
                description: "Your order has been confirmed",
              })
              clearCart()
              window.location.href = "/delivery"
            } else {
              toast({
                title: "Payment Verification Failed",
                description: "Please contact support",
                variant: "destructive",
              })
            }
          },
          prefill: {
            name: "Customer Name",
            email: "customer@example.com",
            contact: "9999999999",
          },
          theme: {
            color: "#f97316",
          },
        }

        const rzp = new window.Razorpay(options)
        rzp.open()
      }

      document.body.appendChild(script)
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "Unable to process payment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
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
    <div className="min-h-screen bg-orange-50">
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
            {/* Order Type */}
            <Card>
              <CardHeader>
                <CardTitle>Order Type</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={orderType} onValueChange={setOrderType}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="delivery" id="delivery" />
                    <Label htmlFor="delivery">Delivery</Label>
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
                  <RadioGroup value={selectedAddress} onValueChange={setSelectedAddress}>
                    {addresses.map((address) => (
                      <div key={address.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <RadioGroupItem value={address.id} id={address.id} className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor={address.id} className="font-medium">
                            {address.label}
                          </Label>
                          <p className="text-sm text-gray-600 mt-1">{address.address}</p>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                  <Button variant="outline" className="w-full">
                    <MapPin className="w-4 h-4 mr-2" />
                    Add New Address
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Delivery Time */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Delivery Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup defaultValue="now">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="now" id="now" />
                    <Label htmlFor="now">Deliver Now (25-30 mins)</Label>
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
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={selectedPayment} onValueChange={setSelectedPayment}>
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <RadioGroupItem value={method.id} id={method.id} className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor={method.id} className="font-medium">
                          {method.label}
                        </Label>
                        <p className="text-sm text-gray-600 mt-1">{method.description}</p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>

                {selectedPayment === "upi" && (
                  <div className="space-y-2">
                    <Label htmlFor="upi-id">UPI ID (Optional)</Label>
                    <Input id="upi-id" placeholder="yourname@upi" />
                  </div>
                )}

                {selectedPayment === "card" && (
                  <div className="text-sm text-gray-600">Card details will be collected securely on the next page</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>{items.length} items in your cart</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Order Items */}
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.name}</h4>
                        <p className="text-xs text-gray-600">{item.vendor}</p>
                        <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <span className="font-medium">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{getTotalPrice()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span className={deliveryFee === 0 ? "text-green-600" : ""}>
                      {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxes & Fees</span>
                    <span>₹{taxes}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₹{finalTotal}</span>
                  </div>
                </div>

                <Button
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                  className="w-full bg-orange-500 hover:bg-orange-600"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {isProcessing ? "Processing..." : `Place Order - ₹${finalTotal}`}
                </Button>

                <div className="text-xs text-gray-500 text-center">
                  <p>By placing this order, you agree to our Terms & Conditions</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
