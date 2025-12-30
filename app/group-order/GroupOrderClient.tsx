"use client"

import { useState, useEffect } from "react"
import { Users, Plus, Trash2, Share2, Calculator, CreditCard, Mail, Phone, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter, useSearchParams } from "next/navigation"
import { api } from "@/lib/api"
import { Label } from "@/components/ui/label"
export const dynamic = "force-dynamic"
interface GroupMember {
  id: string
  name: string
  email?: string
  phone?: string
  items: Array<{
    id: string
    name: string
    price: number
    quantity: number
    menuItemId?: string
  }>
  total: number
  paymentStatus: "unpaid" | "pending" | "paid" | "cash_to_head"
}

interface MenuItem {
  _id: string
  name: string
  price: number
  description?: string
  image?: string
  isVeg?: boolean
}

export default function GroupOrderPage() {
 const { user } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please login to access group orders</p>
      </div>
    )
  }
  const router = useRouter()
  const searchParams = useSearchParams()
  const groupId = searchParams.get("groupId") || `group-${Date.now()}`
  
  const [groupName, setGroupName] = useState("Group Order")
  const [members, setMembers] = useState<GroupMember[]>([
    {
      id: user?.id || "1",
      name: user?.name || "You",
      email: user?.email,
      phone: user?.phone,
      items: [],
      total: 0,
    },
  ])
  const [newMemberInput, setNewMemberInput] = useState("")
  const [newMemberType, setNewMemberType] = useState<"name" | "email" | "phone">("name")
  const [shareLink, setShareLink] = useState("")
  const [showAddItemDialog, setShowAddItemDialog] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [vendorId, setVendorId] = useState<string | null>(null)
  const [headLocation, setHeadLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [vendors, setVendors] = useState<any[]>([])
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null)
  const [groupHistory, setGroupHistory] = useState<any[]>([])
  const { toast } = useToast()

  useEffect(() => {
    // Generate share link with public URL
    const publicUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    const link = `${publicUrl}/group-order?groupId=${groupId}&join=true`
    setShareLink(link)
    
    // Get head location (first member/owner location)
    if (navigator.geolocation && members.length > 0 && members[0].id === (user?.id || "1")) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setHeadLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.error("Location error:", error)
        }
      )
    }
  }, [groupId, members, user])

  // Load vendors near head location
  useEffect(() => {
    const loadVendors = async () => {
      if (!headLocation) return
      
      try {
        const response = await api.vendors.getAll({
          lat: headLocation.lat,
          lng: headLocation.lng,
          radius: 10, // 10km radius
          nearby: true,
        })
        
        if (response.success && response.vendors) {
          setVendors(response.vendors)
          // Auto-select first vendor if none selected
          if (!selectedVendor && response.vendors.length > 0) {
            setSelectedVendor(response.vendors[0]._id || response.vendors[0].id)
            setVendorId(response.vendors[0]._id || response.vendors[0].id)
          }
        }
      } catch (error) {
        console.error("Failed to load vendors:", error)
      }
    }
    
    loadVendors()
  }, [headLocation])

  // Load menu items from selected vendor
  useEffect(() => {
    const loadMenuItems = async () => {
      if (!selectedVendor) {
        setMenuItems([])
        return
      }
      
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/vendors/${selectedVendor}`)
        const data = await response.json()
        
        if (data.success && data.vendor && data.vendor.menu) {
          setMenuItems(data.vendor.menu.filter((item: any) => item.isAvailable))
        }
      } catch (error) {
        console.error("Failed to load menu items:", error)
      }
    }
    
    loadMenuItems()
  }, [selectedVendor])

  const addMember = async () => {
    if (!newMemberInput.trim()) {
      toast({
        title: "Invalid input",
        description: "Please enter a name, email, or phone number",
        variant: "destructive",
      })
      return
    }

    let newMember: GroupMember | null = null

    if (newMemberType === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(newMemberInput)) {
        toast({
          title: "Invalid email",
          description: "Please enter a valid email address",
          variant: "destructive",
        })
        return
      }
      
      // Check if user exists in database
      try {
        const checkResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/users/check-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("streetEatsToken")}`,
          },
          body: JSON.stringify({ email: newMemberInput }),
        })
        
        const checkData = await checkResponse.json()
        
        if (checkData.exists) {
          // User exists - add them directly
          newMember = {
            id: checkData.user._id || checkData.user.id,
            name: checkData.user.name || newMemberInput.split("@")[0],
            email: newMemberInput,
            phone: checkData.user.phone,
            items: [],
            total: 0,
          }
        } else {
          // User doesn't exist - show message to invite them
          toast({
            title: "User not found",
            description: `${newMemberInput} is not registered. They need to join StreetEats first. An invitation will be sent.`,
            variant: "default",
          })
          // Still add them as pending member
          newMember = {
            id: `pending-${Date.now()}`,
            name: newMemberInput.split("@")[0],
            email: newMemberInput,
            items: [],
            total: 0,
            paymentStatus: "unpaid",
          }
        }
      } catch (error) {
        console.error("Error checking user:", error)
        // Fallback - add as pending
        newMember = {
          id: `pending-${Date.now()}`,
          name: newMemberInput.split("@")[0],
          email: newMemberInput,
          items: [],
          total: 0,
        }
      }
    } else if (newMemberType === "phone") {
      const phoneRegex = /^[0-9]{10}$/
      if (!phoneRegex.test(newMemberInput.replace(/\D/g, ""))) {
        toast({
          title: "Invalid phone",
          description: "Please enter a valid 10-digit phone number",
          variant: "destructive",
        })
        return
      }
      
      // Check if user exists by phone
      try {
        const checkResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/users/check-phone`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("streetEatsToken")}`,
          },
          body: JSON.stringify({ phone: newMemberInput.replace(/\D/g, "") }),
        })
        
        const checkData = await checkResponse.json()
        
        if (checkData.exists) {
          newMember = {
            id: checkData.user._id || checkData.user.id,
            name: checkData.user.name || `Member ${members.length + 1}`,
            email: checkData.user.email,
            phone: newMemberInput.replace(/\D/g, ""),
            items: [],
            total: 0,
          }
        } else {
          toast({
            title: "User not found",
            description: "This phone number is not registered. They need to join StreetEats first.",
            variant: "default",
          })
          newMember = {
            id: `pending-${Date.now()}`,
            name: `Member ${members.length + 1}`,
            phone: newMemberInput.replace(/\D/g, ""),
            items: [],
            total: 0,
          }
        }
      } catch (error) {
        console.error("Error checking user:", error)
        newMember = {
          id: `pending-${Date.now()}`,
          name: `Member ${members.length + 1}`,
          phone: newMemberInput.replace(/\D/g, ""),
          items: [],
          total: 0,
        }
      }
    } else {
      newMember = {
        id: Date.now().toString(),
            name: newMemberInput,
        items: [],
        total: 0,
            paymentStatus: "unpaid",
          }
    }

    if (!newMember) return // Should not happen with current logic, but for type safety

    // Check for duplicates
    const isDuplicate = members.some(
      (m) =>
        (m.email && m.email === newMember.email) ||
        (m.phone && m.phone === newMember.phone) ||
        (newMemberType === "name" && m.name.toLowerCase() === newMember.name.toLowerCase())
    )

    if (isDuplicate) {
      toast({
        title: "Member already exists",
        description: "This member is already in the group",
        variant: "destructive",
      })
      return
    }

    setMembers([...members, newMember])
    setNewMemberInput("")
    
    // Add to group history
    setGroupHistory(prev => [{
      member: newMember.name,
      action: "joined the group",
      time: new Date().toLocaleTimeString()
    }, ...prev])
    
    toast({
      title: "Member added",
      description: `${newMember.name} has been added to the group order`,
      })
  }

  const removeMember = (memberId: string) => {
    setMembers(members.filter((member) => member.id !== memberId))
  }

  const openAddItemDialog = (memberId: string) => {
    setSelectedMemberId(memberId)
    setShowAddItemDialog(true)
  }

  const addItemToMember = (item: MenuItem) => {
    if (!selectedMemberId) return

    const updatedMembers = members.map((member) => {
      if (member.id === selectedMemberId) {
        const existingItem = member.items.find((i) => i.id === item._id)
        if (existingItem) {
          // Increase quantity if item already exists
          return {
            ...member,
            items: member.items.map((i) =>
              i.id === item._id ? { ...i, quantity: i.quantity + 1 } : i
            ),
            total: member.total + item.price,
          }
        } else {
          // Add new item
        const newItem = {
            id: item._id,
            name: item.name,
            price: item.price,
          quantity: 1,
            menuItemId: item._id,
        }
        return {
          ...member,
          items: [...member.items, newItem],
            total: member.total + item.price,
          }
        }
      }
      return member
    })
    setMembers(updatedMembers)
    setShowAddItemDialog(false)
    const memberName = members.find((m) => m.id === selectedMemberId)?.name || "Member"
    setSelectedMemberId(null)
    
    // Add to group history
    setGroupHistory(prev => [{
      member: memberName,
      action: `added ${item.name}`,
      time: new Date().toLocaleTimeString()
    }, ...prev])
    
    toast({
      title: "Item added",
      description: `${item.name} added to ${memberName}'s order`,
    })
  }

  const removeItemFromMember = (memberId: string, itemId: string) => {
    const updatedMembers = members.map((member) => {
      if (member.id === memberId) {
        const item = member.items.find((i) => i.id === itemId)
        if (item) {
          if (item.quantity > 1) {
            // Decrease quantity
            return {
              ...member,
              items: member.items.map((i) =>
                i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
              ),
              total: member.total - item.price,
            }
          } else {
            // Remove item
            return {
              ...member,
              items: member.items.filter((i) => i.id !== itemId),
              total: member.total - item.price,
            }
          }
        }
      }
      return member
    })
    setMembers(updatedMembers)
  }

  const getTotalAmount = () => {
    return members.reduce((sum, member) => sum + member.total, 0)
  }

  const getDeliveryFee = () => {
    return getTotalAmount() > 300 ? 0 : 30
  }

  const getTaxes = () => {
    return Math.round(getTotalAmount() * 0.05) // 5% tax
  }

  const getFinalTotal = () => {
    return getTotalAmount() + getDeliveryFee() + getTaxes()
  }

  const shareGroupOrder = async () => {
    try {
      await navigator.clipboard.writeText(shareLink)
      toast({
        title: "Link copied!",
        description: "Share this link with your friends to join the group order",
      })
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement("textarea")
      textArea.value = shareLink
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
    toast({
      title: "Link copied!",
      description: "Share this link with your friends to join the group order",
    })
    }
  }

  const handlePlaceOrder = async () => {
    if (members.length === 0 || members.every((m) => m.items.length === 0)) {
      toast({
        title: "Empty order",
        description: "Please add items to at least one member before placing the order",
        variant: "destructive",
      })
      return
    }

    if (!vendorId) {
      toast({
        title: "No vendor selected",
        description: "Please select a vendor first",
        variant: "destructive",
      })
      return
    }

    try {
      // Create group order with all members and their items
      const allItems = members.flatMap((member) =>
        member.items.map((item) => ({
          ...item,
          memberId: member.id,
          memberName: member.name,
        }))
      )

      const orderData = {
        vendorId,
        items: allItems.map((item) => ({
          menuItemId: item.menuItemId || item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        orderType: "delivery", // Always delivery for group orders
        paymentMethod: "razorpay", // Default to Razorpay, will be handled by head after splits
        groupOrder: {
          isGroupOrder: true,
          groupId,
          participants: members.map((member) => ({
            id: member.id,
            name: member.name,
            email: member.email,
            phone: member.phone,
            items: member.items.map((item) => item.menuItemId || item.id),
            amount: member.total,
            paymentStatus: member.id === user?.id ? "pending" : "unpaid", // Head's payment is pending until final order
          })),
        },
        subtotal: getTotalAmount(),
        deliveryFee: getDeliveryFee(),
        taxes: getTaxes(),
        total: getFinalTotal(),
        status: "pending_payment", // Initial status before all payments/confirmations
      }

      const response = await api.orders.create(orderData)
      if (!response.success) throw new Error(response.error || "Order failed")

      toast({
        title: "Order placed!",
        description: "Your group order has been placed successfully",
      })

      router.push(`/delivery/${response.order.id}`)
    } catch (error: any) {
      console.error("Group order error:", error)
      toast({
        title: "Order failed",
        description: error.message || "Failed to place group order",
        variant: "destructive",
      })
    }
  }
  

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center">
          <Users className="w-8 h-8 mr-3 text-orange-500" />
          Group Order
        </h1>
        <p className="text-gray-600">Order together, split the bill, and save on delivery!</p>
      </div>

      {/* Group Info */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <Input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="text-xl font-bold border-none p-0 h-auto bg-transparent"
            />
            <Badge className="bg-green-100 text-green-800">
              {members.length} member{members.length !== 1 ? "s" : ""}
            </Badge>
          </CardTitle>
          <CardDescription>Share the link below to invite friends to join your group order</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Input value={shareLink} readOnly className="flex-1" />
            <Button onClick={shareGroupOrder} variant="outline">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Members List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-2xl font-bold text-gray-900">Group Members</h2>
            <div className="flex items-center space-x-2 flex-wrap">
              <div className="flex items-center space-x-1 border rounded-lg p-1">
                <Button
                  size="sm"
                  variant={newMemberType === "name" ? "default" : "ghost"}
                  onClick={() => setNewMemberType("name")}
                  className="text-xs"
                >
                  Name
                </Button>
                <Button
                  size="sm"
                  variant={newMemberType === "email" ? "default" : "ghost"}
                  onClick={() => setNewMemberType("email")}
                  className="text-xs"
                >
                  <Mail className="w-3 h-3 mr-1" />
                  Email
                </Button>
                <Button
                  size="sm"
                  variant={newMemberType === "phone" ? "default" : "ghost"}
                  onClick={() => setNewMemberType("phone")}
                  className="text-xs"
                >
                  <Phone className="w-3 h-3 mr-1" />
                  Phone
                </Button>
              </div>
              <Input
                placeholder={
                  newMemberType === "email"
                    ? "Enter email"
                    : newMemberType === "phone"
                    ? "Enter phone"
                    : "Enter name"
                }
                value={newMemberInput}
                onChange={(e) => setNewMemberInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addMember()}
                className="w-40"
                type={newMemberType === "email" ? "email" : newMemberType === "phone" ? "tel" : "text"}
              />
              <Button onClick={addMember} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Member Cards */}
          <div className="space-y-4">
            {members.map((member) => (
              <Card key={member.id}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{member.name}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">₹{member.total}</Badge>
                      {member.name !== "You" && (
                        <Button size="sm" variant="ghost" onClick={() => removeMember(member.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {member.items.length > 0 ? (
                    <div className="space-y-2 mb-4">
                      {member.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                          <div className="flex-1">
                          <span>
                            {item.name} × {item.quantity}
                          </span>
                            <span className="ml-2 text-gray-500">₹{item.price} each</span>
                          </div>
                          <div className="flex items-center space-x-2">
                          <span className="font-medium">₹{item.price * item.quantity}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeItemFromMember(member.id, item.id)}
                              className="h-6 w-6 p-0"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm mb-4">No items added yet</p>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openAddItemDialog(member.id)}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="w-5 h-5 mr-2" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Individual Totals */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Individual Totals</h4>
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between text-sm">
                    <span>{member.name}</span>
                    <span>₹{member.total}</span>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Bill Breakdown */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span>₹{getTotalAmount()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Delivery Fee</span>
                  <span className={getDeliveryFee() === 0 ? "text-green-600" : ""}>
                    {getDeliveryFee() === 0 ? "FREE" : `₹${getDeliveryFee()}`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Taxes & Fees</span>
                  <span>₹{getTaxes()}</span>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total</span>
                <span>₹{getFinalTotal()}</span>
              </div>

              {/* Split Calculation */}
              <div className="bg-orange-50 p-3 rounded-lg">
                <p className="text-sm text-orange-800 font-medium">
                  Split equally: ₹{Math.round(getFinalTotal() / members.length)} per person
                </p>
                <p className="text-xs text-orange-600 mt-1">(Including delivery & taxes)</p>
              </div>

              {/* Payment Options */}
              <div className="space-y-2">
                <Button
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  onClick={handlePlaceOrder}
                  disabled={members.every((m) => m.items.length === 0)}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Place Group Order
                </Button>
              </div>

              {/* Delivery Info */}
              <div className="text-xs text-gray-500 text-center">
                <p>Estimated delivery: 25-30 mins</p>
                <p>Free delivery on orders above ₹300</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Benefits */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Why Order Together?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">💰</span>
              </div>
              <h4 className="font-medium mb-1">Save on Delivery</h4>
              <p className="text-sm text-gray-600">Split delivery costs among group members</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">🎯</span>
              </div>
              <h4 className="font-medium mb-1">Minimum Order</h4>
              <p className="text-sm text-gray-600">Easily meet minimum order requirements</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">⚡</span>
              </div>
              <h4 className="font-medium mb-1">Faster Delivery</h4>
              <p className="text-sm text-gray-600">Larger orders get priority delivery</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Item Dialog */}
      <Dialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Item to {members.find((m) => m.id === selectedMemberId)?.name || "Member"}</DialogTitle>
            <CardDescription>
              {headLocation ? "Showing vendors within 10km of your location" : "Please allow location access to see nearby vendors"}
            </CardDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Vendor Selection */}
            {vendors.length > 0 && (
              <div>
                <Label className="mb-2 block">Select Vendor</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                  {vendors.map((vendor) => (
                    <Button
                      key={vendor._id || vendor.id}
                      variant={selectedVendor === (vendor._id || vendor.id) ? "default" : "outline"}
                      onClick={() => {
                        setSelectedVendor(vendor._id || vendor.id)
                        setVendorId(vendor._id || vendor.id)
                      }}
                      className="justify-start"
                    >
                      {vendor.shopName}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {!selectedVendor ? (
              <div className="text-center py-8 text-gray-500">
                <p>Please select a vendor first</p>
                {!headLocation && (
                  <p className="text-sm mt-2">Allow location access to see nearby vendors</p>
                )}
              </div>
            ) : menuItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No menu items available for this vendor</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {menuItems
                  .filter((item) =>
                    item.name.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((item) => (
                    <Card
                      key={item._id}
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => addItemToMember(item)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="font-semibold">{item.name}</h4>
                            {item.description && (
                              <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <span className="font-bold text-orange-600">₹{item.price}</span>
                              {item.isVeg !== undefined && (
                                <Badge
                                  className={
                                    item.isVeg
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }
                                >
                                  {item.isVeg ? "VEG" : "NON-VEG"}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
