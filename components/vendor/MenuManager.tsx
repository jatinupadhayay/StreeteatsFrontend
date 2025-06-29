"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Eye, EyeOff, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { useVendorDashboard } from "@/hooks/useApi" // Import the hook

interface MenuItem {
  _id: string // Added MongoDB ID for fetched items
  name: string
  description: string
  price: number
  image: string
  category: string
  isAvailable: boolean
  isVeg: boolean
  stock: number
  lowStockThreshold: number
}

export default function MenuManager() {
  const { data, loading, error, refetch } = useVendorDashboard() // Use the hook to fetch data
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [editingItem, setEditingItem] = useState<string | null>(null) // Changed to string for MongoDB ID
  const { toast } = useToast()

  useEffect(() => {
    if (data?.vendor?.menu) {
      // Map backend menu items to frontend MenuItem interface, adding default stock values if missing
      const fetchedMenuItems: MenuItem[] = data.vendor.menu.map((item) => ({
        _id: item._id,
        name: item.name,
        description: item.description,
        price: item.price,
        image: item.image || "/placeholder.svg?height=100&width=100", // Ensure default image
        category: item.category,
        isAvailable: item.isAvailable,
        isVeg: item.isVeg,
        stock: item.stock !== undefined ? item.stock : 0, // Default stock to 0 if not provided
        lowStockThreshold: item.lowStockThreshold !== undefined ? item.lowStockThreshold : 10, // Default threshold
      }))
      setMenuItems(fetchedMenuItems)
    }
  }, [data])

  const toggleAvailability = (_id: string) => {
    setMenuItems((items) =>
      items.map((item) => (item._id === _id ? { ...item, isAvailable: !item.isAvailable } : item)),
    )
    const item = menuItems.find((item) => item._id === _id)
    toast({
      title: "Item Updated",
      description: `${item?.name} is now ${item?.isAvailable ? "unavailable" : "available"}`,
    })
    // TODO: Implement API call to update availability on backend
  }

  const updateStock = (_id: string, newStock: number) => {
    setMenuItems((items) => items.map((item) => (item._id === _id ? { ...item, stock: newStock } : item)))
    // TODO: Implement API call to update stock on backend
  }

  const getLowStockItems = () => {
    return menuItems.filter((item) => item.stock <= item.lowStockThreshold)
  }

  const getStockStatusColor = (item: MenuItem) => {
    if (item.stock === 0) return "bg-red-100 text-red-800"
    if (item.stock <= item.lowStockThreshold) return "bg-yellow-100 text-yellow-800"
    return "bg-green-100 text-green-800"
  }

  const getStockStatusText = (item: MenuItem) => {
    if (item.stock === 0) return "Out of Stock"
    if (item.stock <= item.lowStockThreshold) return "Low Stock"
    return "In Stock"
  }

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-600">
        <p>Loading menu items...</p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mt-4"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        <p>Error loading menu: {error}</p>
        <Button onClick={refetch} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
          <p className="text-gray-600">Manage your menu items and inventory</p>
        </div>
        <Button onClick={() => setIsAddingItem(true)} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Low Stock Alert */}
      {getLowStockItems().length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-yellow-800">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {getLowStockItems().map((item) => (
                <div key={item._id} className="flex items-center justify-between">
                  <span className="text-sm">{item.name}</span>
                  <Badge className="bg-yellow-100 text-yellow-800">{item.stock} left</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {menuItems.length === 0 && !loading && (
          <p className="col-span-full text-center text-gray-500">No menu items found. Add some!</p>
        )}
        {menuItems.map((item) => (
          <Card key={item._id} className="overflow-hidden">
            <div className="relative">
              <img src={item.image || "/placeholder.svg"} alt={item.name} className="w-full h-32 object-cover" />
              <div className="absolute top-2 right-2 flex space-x-1">
                <Badge className={item.isVeg ? "bg-green-500" : "bg-red-500"}>{item.isVeg ? "VEG" : "NON-VEG"}</Badge>
                <Badge className={getStockStatusColor(item)}>{getStockStatusText(item)}</Badge>
              </div>
            </div>

            <CardContent className="p-4 space-y-3">
              <div>
                <h3 className="font-bold text-gray-900">{item.name}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
                <p className="text-lg font-bold text-orange-600">₹{item.price}</p>
              </div>

              {/* Stock Management */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Stock:</span>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStock(item._id, Math.max(0, item.stock - 1))}
                    >
                      -
                    </Button>
                    <span className="w-8 text-center text-sm">{item.stock}</span>
                    <Button size="sm" variant="outline" onClick={() => updateStock(item._id, item.stock + 1)}>
                      +
                    </Button>
                  </div>
                </div>

                {/* Availability Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Available:</span>
                  <div className="flex items-center space-x-2">
                    <Switch checked={item.isAvailable} onCheckedChange={() => toggleAvailability(item._id)} />
                    {item.isAvailable ? (
                      <Eye className="w-4 h-4 text-green-500" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => setEditingItem(item._id)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center bg-transparent">
              <Eye className="w-5 h-5 mb-1" />
              <span className="text-sm">Enable All</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center bg-transparent">
              <EyeOff className="w-5 h-5 mb-1" />
              <span className="text-sm">Disable All</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center bg-transparent">
              <Plus className="w-5 h-5 mb-1" />
              <span className="text-sm">Bulk Add Stock</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center bg-transparent">
              <AlertTriangle className="w-5 h-5 mb-1" />
              <span className="text-sm">Set Alerts</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
