"use client"

import { useState, useEffect } from "react"
import { User, MapPin, CreditCard, Edit, Plus, Trash2, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const { user, setUser } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [addresses, setAddresses] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)

  // Profile Form State
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || ""
  })

  // Address Dialog State
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false)
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null)
  const [addressForm, setAddressForm] = useState({
    label: "Home",
    street: "",
    city: "",
    state: "",
    pincode: "",
    isDefault: false
  })

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone
      })
      fetchAddresses()
    }
  }, [user])

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchAddresses = async () => {
    try {
      const data = await api.users.getAddresses()
      setAddresses(data.addresses || [])
    } catch (error) {
      console.error("Failed to fetch addresses", error)
    }
  }

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true)
      const data = await api.orders.getCustomerOrders()
      setOrders(data.orders || [])
    } catch (error) {
      console.error("Failed to fetch orders", error)
    } finally {
      setLoadingOrders(false)
    }
  }

  const handleProfileSave = async () => {
    try {
      setLoading(true)
      const data = await api.users.updateProfile(formData)

      // Update local user state
      setUser(prev => ({ ...prev, ...data.user }))
      const storedUser = JSON.parse(localStorage.getItem("streetEatsUser") || "{}")
      localStorage.setItem("streetEatsUser", JSON.stringify({ ...storedUser, ...data.user }))

      toast({ title: "Profile updated successfully" })
      setIsEditing(false)
    } catch (error: any) {
      toast({ title: "Error updating profile", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleAddressSubmit = async () => {
    try {
      if (editingAddressId) {
        await api.users.updateAddress(editingAddressId, addressForm)
        toast({ title: "Address updated" })
      } else {
        await api.users.addAddress(addressForm)
        toast({ title: "Address added" })
      }
      setIsAddressDialogOpen(false)
      fetchAddresses()
      resetAddressForm()
    } catch (error: any) {
      toast({ title: "Error saving address", description: error.message, variant: "destructive" })
    }
  }

  const handleDeleteAddress = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return
    try {
      await api.users.deleteAddress(id)
      toast({ title: "Address deleted" })
      fetchAddresses()
    } catch (error: any) {
      toast({ title: "Error deleting address", description: error.message, variant: "destructive" })
    }
  }

  const openEditAddress = (address: any) => {
    setAddressForm({
      label: address.label || "Home",
      street: address.street,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      isDefault: address.isDefault
    })
    setEditingAddressId(address._id)
    setIsAddressDialogOpen(true)
  }

  const resetAddressForm = () => {
    setAddressForm({
      label: "Home",
      street: "",
      city: "",
      state: "",
      pincode: "",
      isDefault: false
    })
    setEditingAddressId(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered": return "bg-green-100 text-green-800"
      case "cancelled": return "bg-red-100 text-red-800"
      case "placed": return "bg-yellow-100 text-yellow-800"
      default: return "bg-blue-100 text-blue-800"
    }
  }

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-xl">{user?.name}</CardTitle>
                <CardDescription>{user?.email}</CardDescription>
                <p className="text-sm text-gray-600">{user?.phone}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? <X className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
              {isEditing ? "Cancel" : "Edit Profile"}
            </Button>
          </div>
        </CardHeader>
        {isEditing && (
          <CardContent className="space-y-4 border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={handleProfileSave} disabled={loading} className="bg-orange-600 hover:bg-orange-700">
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Profile Tabs */}
      <Tabs defaultValue="addresses" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
          <TabsTrigger value="history">Order History</TabsTrigger>
        </TabsList>

        {/* ADDRESSES TAB */}
        <TabsContent value="addresses" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Saved Addresses</h3>
            <Dialog open={isAddressDialogOpen} onOpenChange={(open) => {
              setIsAddressDialogOpen(open)
              if (!open) resetAddressForm()
            }}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Address
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingAddressId ? "Edit Address" : "Add New Address"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Label (e.g. Home, Office)</Label>
                    <Input
                      value={addressForm.label}
                      onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Street Address</Label>
                    <Input
                      value={addressForm.street}
                      onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>State</Label>
                      <Input
                        value={addressForm.state}
                        onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Pincode</Label>
                    <Input
                      value={addressForm.pincode}
                      onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isDefault"
                      checked={addressForm.isDefault}
                      onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <Label htmlFor="isDefault">Set as default address</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddressDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddressSubmit} className="bg-orange-600 hover:bg-orange-700">Save Address</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.length === 0 ? (
              <p className="text-gray-500 col-span-2 text-center py-8">No saved addresses found.</p>
            ) : (
              addresses.map((address) => (
                <Card key={address._id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium text-orange-900">{address.label}</h4>
                          {address.isDefault && <Badge className="bg-green-100 text-green-800 text-xs">Default</Badge>}
                        </div>
                        <p className="text-sm text-gray-600">{address.street}</p>
                        <p className="text-sm text-gray-600">{address.city}, {address.state} - {address.pincode}</p>
                      </div>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditAddress(address)}>
                          <Edit className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteAddress(address._id)}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* ORDER HISTORY TAB */}
        <TabsContent value="history" className="space-y-4">
          <h3 className="text-lg font-semibold">Order History</h3>

          {loadingOrders ? (
            <div className="text-center py-10">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-4">No orders found.</p>
              <Button onClick={() => router.push('/customer/vendors')} className="bg-orange-600">Browse Vendors</Button>
            </div>
          ) : (
            orders.map((order) => (
              <Card key={order._id || order.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium">Order #{order.orderNumber || (order._id || order.id).slice(-6)}</h4>
                      <p className="text-sm text-gray-600 font-medium">{order.vendor?.shopName || "Unknown Vendor"}</p>
                      <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="space-y-1 mb-3 bg-gray-50 p-3 rounded-md">
                    {order.items?.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.quantity} × {item.name}</span>
                        <span className="text-gray-600">₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t">
                    <span className="font-bold text-lg">₹{order.pricing?.total?.toFixed(2)}</span>
                    <div className="space-x-2">
                      <Button variant="outline" size="sm" onClick={() => router.push(`/customer/orders/${order._id || order.id}`)}>
                        Track / View
                      </Button>
                      <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                        Reorder
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

      </Tabs>
    </div>
  )
}
