// components/vendor/MenuManager.jsx
'use client'

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, AlertTriangle, X, Save, ReceiptSwissFrancIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  // Make other properties optional
  originalPrice?: number;
  category: string;
  subCategory?: string;
  image?: string;
  images?: string[];
  isVeg: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  spiceLevel?: string;
  allergens?: string[];
  nutritionalInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  };
  ingredients?: string[];
  preparationTime?: number;
  isAvailable: boolean;
  isPopular?: boolean;
  isFeatured?: boolean;
  customizations?: {
    name: string;
    options: {
      name: string;
      price: number;
    }[];
    required?: boolean;
    multiSelect?: boolean;
  }[];
  tags?: string[];
  stock?: number;
  lowStockThreshold?: number;
}


export default function MenuManager() {
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [formData, setFormData] = useState<Partial<MenuItem>>({})
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const { toast } = useToast()

  // Fetch menu items
  const fetchMenuItems = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await api.vendors.getDashboardStats()
      

      if (response.success && response.vendor?.menu) {
        const vendorId = response.vendor.id

  // Store in localStorage for access in other components
     localStorage.setItem("vendorId", vendorId)

        const formattedItems = response.vendor.menu.map(item => ({
           ...item,
  // Add default values for missing properties
  isVegan: item.isVeg || false,
  stock: item.stock || 0,
  lowStockThreshold: item.lowStockThreshold || 5
        }))
        setMenuItems(formattedItems)
      } else {
        throw new Error("No menu data found")
      }
    } catch (err: any) {
      console.error("Failed to fetch menu:", err)
      setError(err.message || "Failed to load menu items")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMenuItems()
  }, [])

  // Initialize form for adding or editing
  useEffect(() => {
    if (isAdding) {
      setFormData({
        name: '',
        description: '',
        price: 0,
        category: '',
        isVeg: true,
        isAvailable: true,
        spiceLevel: 'medium',
        allergens: [],
        ingredients: [],
        preparationTime: 15,
        isPopular: false,
        isFeatured: false,
        tags: [],
        stock: 10,
        lowStockThreshold: 5
      })
      setImagePreviews([])
    } else if (editingItem) {
      setFormData({ ...editingItem })
      if (editingItem.images) {
        setImagePreviews(editingItem.images)
      } else if (editingItem.image) {
        setImagePreviews([editingItem.image])
      } else {
        setImagePreviews([])
      }
    } else {
      setFormData({})
      setImagePreviews([])
    }
  }, [isAdding, editingItem])

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
             type === 'number' ? Number(value) : value
    }))
  }

  // Handle array fields
  const handleArrayChange = (field: keyof MenuItem, value: string) => {
    if (value.trim() === '') return
    
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] as string[] || []), value.trim()]
    }))
  }

  const removeArrayItem = (field: keyof MenuItem, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }))
  }

  // Handle image uploads
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    
    const files = Array.from(e.target.files)
    const newPreviews = files.map(file => URL.createObjectURL(file))
    setImagePreviews(prev => [...prev, ...newPreviews])
    
    // Add to form data
    setFormData(prev => ({
      ...prev,
      images: [...(prev.images || []), ...files.map(file => file.name)]
    }))
  }

  const removeImage = (index: number) => {
    const updated = [...imagePreviews]
    URL.revokeObjectURL(updated[index])
    updated.splice(index, 1)
    setImagePreviews(updated)
    
    setFormData(prev => {
      const images = [...(prev.images || [])]
      images.splice(index, 1)
      return { ...prev, images }
    })
  }

  // Handle customizations
  const addCustomization = () => {
    setFormData(prev => ({
      ...prev,
      customizations: [
        ...(prev.customizations || []),
        {
          name: '',
          options: [{ name: '', price: 0 }],
          required: false,
          multiSelect: false
        }
      ]
    }))
  }

  const updateCustomization = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const updated = [...(prev.customizations || [])]
      // @ts-ignore
      updated[index][field] = value
      return { ...prev, customizations: updated }
    })
  }

  const addOption = (customizationIndex: number) => {
    setFormData(prev => {
      const updated = [...(prev.customizations || [])]
      updated[customizationIndex].options.push({ name: '', price: 0 })
      return { ...prev, customizations: updated }
    })
  }

  const removeOption = (customizationIndex: number, optionIndex: number) => {
    setFormData(prev => {
      const updated = [...(prev.customizations || [])]
      updated[customizationIndex].options.splice(optionIndex, 1)
      return { ...prev, customizations: updated }
    })
  }

  // Submit form
  const handleSubmit = async () => {
    try {
      const formDataToSend = new FormData()
      
      // Append all form data
      Object.entries(formData).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          formDataToSend.append(key, JSON.stringify(value))
        } else {
          // @ts-ignore
          formDataToSend.append(key, value)
        }
      })
      
      if (isAdding) {
        await api.vendors.addMenuItem(formDataToSend)
        toast({
          title: "Success",
          description: "Menu item added successfully"
        })
      } else if (editingItem) {
        await api.vendors.updateMenuItem(editingItem._id, formDataToSend)
        toast({
          title: "Success",
          description: "Menu item updated successfully"
        })
      }
      
      setIsAdding(false)
      setEditingItem(null)
      fetchMenuItems()
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to save menu item",
        variant: "destructive"
      })
    }
  }

  // Delete menu item
  const handleDelete = async (itemId: string) => {
    try {
      await api.vendors.deleteMenuItem(itemId)
      toast({
        title: "Success",
        description: "Menu item deleted successfully"
      })
      fetchMenuItems()
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete menu item",
        variant: "destructive"
      })
    }
  }

  // Toggle item availability
  const toggleAvailability = (itemId: string) => {
    const item = menuItems.find(i => i._id === itemId)
    if (!item) return

    const newAvailability = !item.isAvailable
    handleItemUpdate(itemId, { isAvailable: newAvailability })
  }

  // Update item stock
  const updateStock = (itemId: string, newStock: number) => {
    if (isNaN(newStock)) return
    handleItemUpdate(itemId, { stock: Math.max(0, newStock) })
  }

  // Helper to update item properties
  const handleItemUpdate = async (itemId: string, updates: Partial<MenuItem>) => {
    try {
      setMenuItems(prev =>
        prev.map(item =>
          item._id === itemId ? { ...item, ...updates } : item
        )
      )

      const formData = new FormData()
      Object.entries(updates).forEach(([key, value]) => {
        formData.append(key, String(value))
      })

      await api.vendors.updateMenuItem(itemId, formData)

      toast({
        title: "Success",
        description: "Menu item updated successfully"
      })
    } catch (err) {
      fetchMenuItems()
      toast({
        title: "Error",
        description: "Failed to update menu item",
        variant: "destructive"
      })
    }
  }

  // Stock status helpers
  const getLowStockItems = () => {
    return menuItems.filter(item => {
      const threshold = item.lowStockThreshold || 5
      return (item.stock || 0) <= threshold
    })
  }

  const getStockStatus = (item: MenuItem) => {
    const stock = item.stock || 0
    const threshold = item.lowStockThreshold || 5

    if (stock === 0) {
      return { text: "Out of Stock", variant: "destructive" as const }
    }
    if (stock <= threshold) {
      return { text: "Low Stock", variant: "outline" as const }
    }
    return { text: "In Stock", variant: "default" as const }
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-48 w-full rounded-t-lg" />
              <CardContent className="p-4 space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-destructive">{error}</p>
        <Button onClick={fetchMenuItems} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  // Render the menu form when adding or editing
  if (isAdding || editingItem) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">
            {isAdding ? "Add New Menu Item" : "Edit Menu Item"}
          </h1>
          <Button variant="ghost" onClick={() => {
            setIsAdding(false)
            setEditingItem(null)
          }}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>
        
        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Name*</Label>
                  <Input
                    name="name"
                    value={formData.name || ''}
                    onChange={handleChange}
                    placeholder="Item name"
                    required
                  />
                </div>
                
                <div>
                  <Label>Category*</Label>
                  <Input
                    name="category"
                    value={formData.category || ''}
                    onChange={handleChange}
                    placeholder="Main course, appetizer, etc."
                    required
                  />
                </div>
                
                <div>
                  <Label>Price*</Label>
                  <Input
                    name="price"
                    type="number"
                    value={formData.price || ''}
                    onChange={handleChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                
                <div>
                  <Label>Original Price</Label>
                  <Input
                    name="originalPrice"
                    type="number"
                    value={formData.originalPrice || ''}
                    onChange={handleChange}
                    placeholder="For discounts"
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    name="description"
                    value={formData.description || ''}
                    onChange={handleChange}
                    placeholder="Describe your menu item"
                    rows={3}
                  />
                </div>
              </div>
            </div>
            
            {/* Dietary Information */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Dietary Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isVeg"
                      name="isVeg"
                      checked={formData.isVeg || false}
                      onCheckedChange={(checked) => setFormData(prev => ({...prev, isVeg: checked}))}
                    />
                    <Label htmlFor="isVeg">Vegetarian</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isVegan"
                      name="isVegan"
                      checked={formData.isVegan || false}
                      onCheckedChange={(checked) => setFormData(prev => ({...prev, isVegan: checked}))}
                    />
                    <Label htmlFor="isVegan">Vegan</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isGlutenFree"
                      name="isGlutenFree"
                      checked={formData.isGlutenFree || false}
                      onCheckedChange={(checked) => setFormData(prev => ({...prev, isGlutenFree: checked}))}
                    />
                    <Label htmlFor="isGlutenFree">Gluten Free</Label>
                  </div>
                </div>
                
                <div>
                  <Label>Spice Level</Label>
                  <select
                    name="spiceLevel"
                    value={formData.spiceLevel || 'medium'}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                  >
                    <option value="mild">Mild</option>
                    <option value="medium">Medium</option>
                    <option value="hot">Hot</option>
                    <option value="extra-hot">Extra Hot</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Ingredients & Allergens */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Ingredients & Allergens</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Ingredients (comma separated)</Label>
                  <Input
                    placeholder="Add ingredient and press Enter"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleArrayChange('ingredients', (e.target as HTMLInputElement).value)
                        ;(e.target as HTMLInputElement).value = ''
                        e.preventDefault()
                      }
                    }}
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.ingredients?.map((ingredient, i) => (
                      <Badge key={i} variant="secondary">
                        {ingredient}
                        <button 
                          type="button"
                          onClick={() => removeArrayItem('ingredients', i)}
                          className="ml-2"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label>Allergens (comma separated)</Label>
                  <Input
                    placeholder="Add allergen and press Enter"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleArrayChange('allergens', (e.target as HTMLInputElement).value)
                        ;(e.target as HTMLInputElement).value = ''
                        e.preventDefault()
                      }
                    }}
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.allergens?.map((allergen, i) => (
                      <Badge key={i} variant="destructive">
                        {allergen}
                        <button 
                          type="button"
                          onClick={() => removeArrayItem('allergens', i)}
                          className="ml-2"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Images */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Images</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Upload Images</Label>
                  <Input 
                    type="file" 
                    multiple 
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload one or more images of your menu item
                  </p>
                </div>
                
                <div>
                  {imagePreviews.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {imagePreviews.map((src, i) => (
                        <div key={i} className="relative">
                          <img 
                            src={src} 
                            alt={`Preview ${i}`}
                            className="w-24 h-24 object-cover rounded"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(i)}
                            className="absolute top-0 right-0 bg-destructive text-white rounded-full p-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No images uploaded yet
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Customizations */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Customizations</h2>
              <div className="space-y-4">
                {formData.customizations?.map((custom, i) => (
                  <div key={i} className="border rounded p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-medium">Customization {i + 1}</h3>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => {
                          setFormData(prev => {
                            const updated = [...(prev.customizations || [])]
                            updated.splice(i, 1)
                            return { ...prev, customizations: updated }
                          })
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Name</Label>
                        <Input
                          value={custom.name}
                          onChange={(e) => updateCustomization(i, 'name', e.target.value)}
                          placeholder="Size, toppings, etc."
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`required-${i}`}
                            checked={custom.required}
                            onCheckedChange={(checked) => updateCustomization(i, 'required', checked)}
                          />
                          <Label htmlFor={`required-${i}`}>Required</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`multi-${i}`}
                            checked={custom.multiSelect}
                            onCheckedChange={(checked) => updateCustomization(i, 'multiSelect', checked)}
                          />
                          <Label htmlFor={`multi-${i}`}>Allow multiple selections</Label>
                        </div>
                      </div>
                      
                      <div className="md:col-span-2">
                        <Label>Options</Label>
                        <div className="space-y-2">
                          {custom.options.map((option, j) => (
                            <div key={j} className="flex gap-2 items-center">
                              <Input
                                value={option.name}
                                onChange={(e) => {
                                  setFormData(prev => {
                                    const updated = [...(prev.customizations || [])]
                                    updated[i].options[j].name = e.target.value
                                    return { ...prev, customizations: updated }
                                  })
                                }}
                                placeholder="Option name"
                              />
                              <Input
                                type="number"
                                value={option.price}
                                onChange={(e) => {
                                  setFormData(prev => {
                                    const updated = [...(prev.customizations || [])]
                                    updated[i].options[j].price = Number(e.target.value)
                                    return { ...prev, customizations: updated }
                                  })
                                }}
                                placeholder="Additional price"
                                min="0"
                                step="0.01"
                              />
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => removeOption(i, j)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => addOption(i)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Option
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                <Button 
                  variant="outline" 
                  onClick={addCustomization}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Customization
                </Button>
              </div>
            </div>
            
            {/* Additional Information */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Additional Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Preparation Time (minutes)</Label>
                  <Input
                    name="preparationTime"
                    type="number"
                    value={formData.preparationTime || 0}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
                
                <div>
                  <Label>Tags (comma separated)</Label>
                  <Input
                    placeholder="Add tag and press Enter"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleArrayChange('tags', (e.target as HTMLInputElement).value)
                        ;(e.target as HTMLInputElement).value = ''
                        e.preventDefault()
                      }
                    }}
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags?.map((tag, i) => (
                      <Badge key={i} variant="secondary">
                        {tag}
                        <button 
                          type="button"
                          onClick={() => removeArrayItem('tags', i)}
                          className="ml-2"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isAvailable"
                      name="isAvailable"
                      checked={formData.isAvailable || false}
                      onCheckedChange={(checked) => setFormData(prev => ({...prev, isAvailable: checked}))}
                    />
                    <Label htmlFor="isAvailable">Available</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isPopular"
                      name="isPopular"
                      checked={formData.isPopular || false}
                      onCheckedChange={(checked) => setFormData(prev => ({...prev, isPopular: checked}))}
                    />
                    <Label htmlFor="isPopular">Popular</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isFeatured"
                      name="isFeatured"
                      checked={formData.isFeatured || false}
                      onCheckedChange={(checked) => setFormData(prev => ({...prev, isFeatured: checked}))}
                    />
                    <Label htmlFor="isFeatured">Featured</Label>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="flex justify-end">
              <Button onClick={handleSubmit}>
                <Save className="mr-2 h-4 w-4" />
                {isAdding ? "Add Menu Item" : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Render the main menu manager
  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Menu Management</h1>
          <p className="text-muted-foreground">
            {menuItems.length} items in menu
          </p>
        </div>
        <Button onClick={() => setIsAdding(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      {getLowStockItems().length > 0 && (
        <Card className="border border-yellow-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {getLowStockItems().map(item => (
                <div key={item._id} className="flex items-center justify-between">
                  <span>{item.name}</span>
                  <Badge variant="outline">{item.stock} left</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {menuItems.map(item => {
          const stockStatus = getStockStatus(item)

          return (
            <Card key={item._id}>
              <div className="relative">
                
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <Badge variant={item.isVeg ? "default" : "destructive"}>
                    {item.isVeg ? "Veg" : "Non-Veg"}
                  </Badge>
                  <Badge variant={stockStatus.variant}>
                    {stockStatus.text}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-4 space-y-4">
                <div className="space-y-1">
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {item.description}
                  </p>
                  <p className="font-bold">₹{item.price.toFixed(2)}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Stock</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateStock(item._id, (item.stock || 0) - 1)}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center">{item.stock}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateStock(item._id, (item.stock || 0) + 1)}
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Available</span>
                    <Switch
                      checked={item.isAvailable}
                      onCheckedChange={() => toggleAvailability(item._id)}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setEditingItem(item)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-destructive"
                    onClick={() => handleDelete(item._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
