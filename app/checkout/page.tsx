"use client"

import { useState } from "react"
import { ArrowLeft, MapPin, CreditCard, Clock, CheckCircle, Plus } from "lucide-react"
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
import tackorderpage from "@/app/delivery/[id]/page"

// Type definitions
interface Address {
  street: string
  city: string
  state: string
  pincode: string
  coordinates?: [number, number] 
  instructions?: string// Tuple type for coordinates
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

export default function CheckoutPage() {
  const { items, getTotalPrice, clearCart, getCurrentVendor } = useCart()
  const { user } = useAuth()
  const [selectedAddress, setSelectedAddress] = useState("home")
  const [selectedPayment, setSelectedPayment] = useState("cod")
  const [orderType, setOrderType] = useState("delivery")
  const [isProcessing, setIsProcessing] = useState(false)
  const [specialInstructions, setSpecialInstructions] = useState("")
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [newAddress, setNewAddress] = useState({
    label: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    coordinates: [0, 0] as [number, number]
  })
  const { toast } = useToast()
  const router = useRouter()

const deliveryFee = orderType === "delivery" ? (getTotalPrice() > 300 ? 0 : 30) : 0
const taxes = orderType === "delivery" ? Math.round(getTotalPrice() * 0.05) : 0
const finalTotal = getTotalPrice() + deliveryFee + taxes

  // Addresses state with proper object structure
  const [addresses, setAddresses] = useState<AddressWithLabel[]>([
    { 
      id: "home", 
      label: "Home", 
      address: {
        street: "123 Park Street",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
        coordinates: [72.8777, 19.0760]
      }
    },
    { 
      id: "office", 
      label: "Office", 
      address: {
        street: "456 Business District",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400069",
        coordinates: [72.8396, 19.1075]
      }
    }
  ])

  const paymentMethods = [
    { id: "cod", label: "Cash on Delivery", description: "Pay when you receive" },
    { id: "pickup_pay", label: "Pay at Pickup", description: "Pay when you pick up your order" },
  ]

  // Get selected address object
  const selectedAddrObj = addresses.find(addr => addr.id === selectedAddress)
  const currentVendor = getCurrentVendor()
console.log("Current vendor:", currentVendor);
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
       // Corrected payment structure
            paymentMethod: selectedPayment,
      
      deliveryAddress: orderType === "delivery"||orderType === "pickup"
        ? selectedAddrObj?.address || {
            street: "123 Main St",
            city: "Default City",
            state: "Default State",
            pincode: "000000",
            coordinates: [0, 0],
            
          }
        : undefined,
      subtotal,
      deliveryFee,
      taxes,
      total,
      status:"placed",
      estimatedPreparationTime:5,
       estimatedDeliveryTime: currentVendor.duration,
        specialInstructions:{
          customer:specialInstructions,
        },
        
     
    }

    console.log("Order data:", JSON.stringify(orderData, null, 2))

    const response = await api.orders.create(orderData);
    console.log(response)
    if (!response.success) throw new Error(response.error || "Order failed")
    
    
    router.push(`/delivery/${response.order.id}`)

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
                    if (value === "pickup") {
                      setSelectedPayment("pickup_pay")
                    } else {
                      setSelectedPayment("cod")
                    }
                  }}
                >
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
                              {formatAddress(address.address)}
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
                            onChange={(e) => setNewAddress({...newAddress, label: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label>Street Address</Label>
                          <Input
                            placeholder="Street and building number"
                            value={newAddress.street}
                            onChange={(e) => setNewAddress({...newAddress, street: e.target.value})}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>City</Label>
                            <Input
                              placeholder="City"
                              value={newAddress.city}
                              onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label>State</Label>
                            <Input
                              placeholder="State"
                              value={newAddress.state}
                              onChange={(e) => setNewAddress({...newAddress, state: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Pincode</Label>
                            <Input
                              placeholder="Pincode"
                              value={newAddress.pincode}
                              onChange={(e) => setNewAddress({...newAddress, pincode: e.target.value})}
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
                        "123 Street Food Lane, Mumbai"
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
                      </div>
                    </div>
                  ))}
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
                    <span>₹{getTotalPrice()}</span>
                  </div>
                  
                  {orderType === "delivery" && (
                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      <span className={deliveryFee === 0 ? "text-green-600" : ""}>
                        {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
                      </span>
                    </div>
                  )}
                  
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
                  <p className="font-medium">Payment at {orderType === "delivery" ? "delivery" : "pickup"}</p>
                  <p className="mt-1">By placing this order, you agree to our Terms & Conditions</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}