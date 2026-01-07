"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { Star, MapPin, Clock, Heart, Share2, Plus, Minus, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCart, VendorInfo, CartItem } from "@/components/user/CartProvider"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { DishDetailModal } from "@/components/user/DishDetailModal"

interface MenuItem {
    _id: string
    name: string
    description?: string
    quantity: number
    price: number
    originalPrice?: number
    image?: string
    isVeg?: boolean
    isSpicy?: boolean
    category?: string
}

interface Vendor {
    _id: string
    shopName: string
    speciality: string
    cuisine?: string[]
    rating?: {
        average: number
        count: number
    }
    address: {
        street: string
        city: string
        state: string
        pincode: string
        coordinates: [number, number]
    }
    images?: {
        shop?: string[]
        gallery?: string[]
    }
    isActive: boolean
    menu?: MenuItem[]
    activeOffers?: Array<{
        _id: string
        title: string
        description: string
        type: string
        value: number
        minimumOrder?: number
        isActive: boolean
    }>
}

interface VendorDetailModalProps {
    vendorId: string | null
    isOpen: boolean
    onClose: () => void
    initialData?: any
}

export default function VendorDetailModal({ vendorId, isOpen, onClose, initialData }: VendorDetailModalProps) {
    const { toast } = useToast()

    // Initialize with initialData if available
    const [vendor, setVendor] = useState<Vendor | null>(() => {
        if (initialData) {
            return {
                _id: initialData.id,
                shopName: initialData.name,
                speciality: initialData.speciality,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                cuisine: (initialData.cuisine as any)?.split(', ') || [],
                rating: {
                    average: initialData.rating,
                    count: 0
                },
                address: {
                    street: "",
                    city: "",
                    state: "",
                    pincode: "",
                    coordinates: [0, 0]
                },
                images: {
                    shop: [initialData.image],
                    gallery: []
                },
                isActive: initialData.isOpen,
                menu: []
            } as Vendor
        }
        return null
    })

    // Update vendor if initialData changes and matches vendorId? 
    // Actually, when opening a NEW modal, vendorId changes. 
    // We should reset/update vendor state in useEffect or key.
    // simpler to rely on useEffect below but we want INSTANT render.
    // We can use a unique key for the modal in HomePage to force re-construction?
    // Or simpler: useEffect to set vendor from initialData when vendorId changes.

    const [menuItems, setMenuItems] = useState<MenuItem[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [selectedDish, setSelectedDish] = useState<MenuItem | null>(null)
    const [showDishDetail, setShowDishDetail] = useState(false)

    const { items: cart, addItem, updateQuantity, removeItem } = useCart()

    // Helper to get quantity from cart items array
    const getCartQuantity = (itemId: string) => {
        const cartItem = cart.find(i => i.id === itemId)
        return cartItem ? cartItem.quantity : 0
    }

    useEffect(() => {
        if (!vendorId || !isOpen) return

        // If we have initialData for this vendor, use it immediately
        if (initialData && initialData.id === vendorId) {
            setVendor({
                _id: initialData.id,
                shopName: initialData.name,
                speciality: initialData.speciality,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                cuisine: (initialData.cuisine as any)?.split(', ') || [],
                rating: {
                    average: initialData.rating,
                    count: 0
                },
                address: {
                    street: "",
                    city: "",
                    state: "",
                    pincode: "",
                    coordinates: [0, 0]
                },
                images: {
                    shop: [initialData.image],
                    gallery: []
                },
                isActive: initialData.isOpen,
                menu: []
            } as Vendor)
        } else if (vendor?._id !== vendorId) {
            setVendor(null)
        }

        const fetchVendor = async () => {
            try {
                setLoading(true)
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/vendors/${vendorId}`)
                if (!res.ok) throw new Error("Failed to fetch vendor")
                const data = await res.json()

                setVendor(data.vendor)
                setMenuItems(data.vendor.menu || [])
            } catch (err) {
                console.error("Vendor fetch error:", err)
                toast({
                    title: "Error",
                    description: "Unable to load vendor data",
                    variant: "destructive"
                })
            } finally {
                setLoading(false)
            }
        }

        fetchVendor()
    }, [vendorId, isOpen, toast])

    const addToCart = (e: React.MouseEvent, item: MenuItem) => {
        e.stopPropagation()
        if (!vendor) return

        if (!vendor.isActive) {
            toast({
                title: "Vendor Unavailable",
                description: "This vendor is not accepting orders currently.",
                variant: "destructive"
            })
            return
        }

        const vendorInfo: VendorInfo = {
            _id: vendor._id,
            id: vendor._id,
            shopName: vendor.shopName,
            isActive: vendor.isActive,
            address: vendor.address,
            duration: "Calculated at checkout",
        }

        const cartItem: Omit<CartItem, "quantity"> = {
            id: item._id,
            name: item.name,
            price: item.price,
            vendor: vendorInfo,
            image: item.image || '/placeholder.png',
            category: item.category || 'General',
            description: item.description || ""
        }

        addItem(cartItem)
        toast({
            title: "Added to cart",
            description: `${item.name} added to cart`,
            duration: 1000
        })
    }

    const handleUpdateQuantity = (e: React.MouseEvent, itemId: string, newQty: number) => {
        e.stopPropagation()
        if (newQty <= 0) {
            removeItem(itemId)
        } else {
            updateQuantity(itemId, newQty)
        }
    }

    // Group menu items by category
    const groupedMenuItems = () => {
        const grouped: { [category: string]: MenuItem[] } = {}
        menuItems.forEach((item) => {
            const cat = item.category || 'Uncategorized'
            if (!grouped[cat]) {
                grouped[cat] = []
            }
            grouped[cat].push(item)
        })
        return grouped
    }

    return (
        <>
            <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <SheetContent side="right" className="w-full sm:max-w-xl p-0 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-y-auto">
                        {loading && !vendor ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-orange-500 rounded-full"></div>
                            </div>
                        ) : vendor ? (
                            <>
                                <div className="relative h-56 w-full">
                                    <Image
                                        src={vendor.images?.shop?.[0] || "/placeholder.svg"}
                                        alt={vendor.shopName}
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    <div className="absolute bottom-4 left-4 text-white">
                                        <h2 className="text-2xl font-bold">{vendor.shopName}</h2>
                                        <p className="text-sm opacity-90">{vendor.speciality} • {vendor.cuisine?.join(", ")}</p>
                                    </div>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="absolute top-4 right-12 text-white hover:bg-black/20"
                                        onClick={() => {
                                            // Share logic or favorite
                                        }}
                                    >
                                        <Share2 className="w-5 h-5" />
                                    </Button>
                                </div>

                                <div className="p-4 space-y-4">
                                    <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                        <div className="flex items-center">
                                            <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                                            <span className="font-bold text-gray-900">{vendor.rating?.average?.toFixed(1) || "New"}</span>
                                            <span className="ml-1">({vendor.rating?.count || 0})</span>
                                        </div>
                                        <div className="flex items-center">
                                            <Clock className="w-4 h-4 mr-1" />
                                            <span>{vendor.isActive ? "Open Now" : "Closed"}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <MapPin className="w-4 h-4 mr-1" />
                                            <span className="truncate max-w-[100px]">{vendor.address.city}</span>
                                        </div>
                                    </div>

                                    {/* Active Offers Section */}
                                    {vendor.activeOffers && vendor.activeOffers.length > 0 && (
                                        <div className="space-y-3 px-1">
                                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                                <Badge className="bg-orange-500 hover:bg-orange-500">OFFERS</Badge>
                                            </h3>
                                            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                                                {vendor.activeOffers.map((offer) => (
                                                    <div key={offer._id} className="min-w-[240px] bg-orange-50 border border-orange-200 rounded-xl p-3 flex flex-col justify-between">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <Badge variant="outline" className="text-[10px] bg-white text-orange-600 border-orange-200">
                                                                    {offer.type === "percentage" ? `${offer.value}% OFF` : `₹${offer.value} OFF`}
                                                                </Badge>
                                                            </div>
                                                            <h4 className="font-bold text-sm text-gray-900 line-clamp-1">{offer.title}</h4>
                                                            <p className="text-xs text-gray-600 line-clamp-2 mt-1">{offer.description}</p>
                                                        </div>
                                                        {offer.minimumOrder && offer.minimumOrder > 0 && (
                                                            <p className="text-[10px] text-orange-700 font-medium mt-2">Min. order ₹{offer.minimumOrder}</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        {/* Category Filter */}
                                        <div className="overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                                            <div className="flex space-x-2">
                                                <Button
                                                    size="sm"
                                                    variant={selectedCategory === null ? "default" : "outline"}
                                                    onClick={() => setSelectedCategory(null)}
                                                    className={selectedCategory === null ? "bg-orange-500 hover:bg-orange-600" : ""}
                                                >
                                                    All
                                                </Button>
                                                {Object.keys(groupedMenuItems()).map((cat) => (
                                                    <Button
                                                        key={cat}
                                                        size="sm"
                                                        variant={selectedCategory === cat ? "default" : "outline"}
                                                        onClick={() => setSelectedCategory(cat)}
                                                        className={selectedCategory === cat ? "bg-orange-500 hover:bg-orange-600" : ""}
                                                    >
                                                        {cat}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Menu Items */}
                                        <div className="space-y-6 pb-20">
                                            {(selectedCategory
                                                ? [[selectedCategory, groupedMenuItems()[selectedCategory]]] as [string, MenuItem[]][]
                                                : Object.entries(groupedMenuItems()) as [string, MenuItem[]][]
                                            ).map(([category, items]) => (
                                                <div key={category}>
                                                    <h3 className="font-bold text-lg mb-3 text-gray-800">{category}</h3>
                                                    <div className="space-y-4">
                                                        {items?.map((item: MenuItem) => {
                                                            const qty = getCartQuantity(item._id)
                                                            return (
                                                                <div
                                                                    key={item._id}
                                                                    className="flex gap-3 border-b pb-4 last:border-0 cursor-pointer"
                                                                    onClick={() => {
                                                                        setSelectedDish(item)
                                                                        setShowDishDetail(true)
                                                                    }}
                                                                >
                                                                    <div className="flex-1 space-y-1">
                                                                        <div className="flex items-start justify-between">
                                                                            <h4 className="font-medium text-gray-900">{item.name}</h4>
                                                                            <span className="font-semibold text-gray-900">₹{item.price}</span>
                                                                        </div>
                                                                        <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
                                                                        <div className="flex gap-2">
                                                                            {item.isVeg ? (
                                                                                <Badge variant="outline" className="text-[10px] border-green-600 text-green-600 px-1 py-0">VEG</Badge>
                                                                            ) : (
                                                                                <Badge variant="outline" className="text-[10px] border-red-600 text-red-600 px-1 py-0">NON-VEG</Badge>
                                                                            )}
                                                                            {item.isSpicy && (
                                                                                <Badge variant="outline" className="text-[10px] border-orange-600 text-orange-600 px-1 py-0">SPICY</Badge>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    <div className="relative w-24 h-24 shrink-0">
                                                                        <Image
                                                                            src={item.image || "/placeholder.svg"}
                                                                            alt={item.name}
                                                                            fill
                                                                            className="object-cover rounded-lg"
                                                                        />
                                                                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 shadow-lg rounded-lg bg-white">
                                                                            {qty > 0 ? (
                                                                                <div className="flex items-center h-8 bg-white rounded-lg border border-orange-100">
                                                                                    <button
                                                                                        className="px-2 text-orange-600 hover:bg-orange-50 h-full rounded-l-lg"
                                                                                        onClick={(e) => handleUpdateQuantity(e, item._id, qty - 1)}
                                                                                    >
                                                                                        <Minus className="w-3 h-3" />
                                                                                    </button>
                                                                                    <span className="text-xs font-bold w-4 text-center">{qty}</span>
                                                                                    <button
                                                                                        className="px-2 text-orange-600 hover:bg-orange-50 h-full rounded-r-lg"
                                                                                        onClick={(e) => handleUpdateQuantity(e, item._id, qty + 1)}
                                                                                    >
                                                                                        <Plus className="w-3 h-3" />
                                                                                    </button>
                                                                                </div>
                                                                            ) : (
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="secondary"
                                                                                    className="h-8 px-4 text-xs font-bold text-orange-600 bg-white hover:bg-orange-50 border border-orange-200"
                                                                                    onClick={(e) => addToCart(e, item)}
                                                                                >
                                                                                    ADD
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="p-8 text-center text-gray-500">Vendor not found</div>
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            {/* Dish Detail Modal (Reused) */}
            {selectedDish && (
                <DishDetailModal
                    open={showDishDetail}
                    onOpenChange={setShowDishDetail}
                    dish={selectedDish}
                    onAddToCart={(item, customizations, qty) => {
                        const vendorInfo: VendorInfo = {
                            _id: vendor!._id,
                            id: vendor!._id,
                            shopName: vendor!.shopName,
                            isActive: vendor!.isActive,
                            address: vendor!.address,
                            duration: "Calculated at checkout",
                        }
                        const cartItem: Omit<CartItem, "quantity"> = {
                            id: item._id,
                            name: item.name,
                            price: item.price,
                            vendor: vendorInfo,
                            image: item.image || '/placeholder.png',
                            category: item.category || 'General',
                            description: item.description || ""
                        }
                        // Customization logic omitted for now to keep simple
                        addItem(cartItem, qty)
                        toast({
                            title: "Added to cart",
                            description: `${item.name} added to cart`,
                            duration: 1000
                        })
                    }}
                />
            )}
        </>
    )
}
