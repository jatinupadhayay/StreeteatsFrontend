"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

export interface VendorInfo {
  _id: string
  id:string
  shopName: string
  address?: string | {
    street: string
    city: string
    state: string
    pincode: string
    coordinates?: [number, number]
  }
  isActive: boolean,
  duration:string
}

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  vendor: VendorInfo
  image: string
  category: string
  description: string
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void
  updateQuantity: (id: string, quantity: number) => void
  removeItem: (id: string) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
  getCurrentVendor: () => VendorInfo | null
  currentVendorId: string | null
}

const CartContext = createContext<CartContextType | undefined>(undefined)

interface CartProviderProps {
  children: ReactNode
}

export function CartProvider({ children }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([])
  const [currentVendorId, setCurrentVendorId] = useState<string | null>(null)

  // Load cart from localStorage on initial render
  useEffect(() => {
    const loadCart = () => {
      const savedCart = localStorage.getItem("street-eats-cart")
      if (savedCart) {
        try {
          const parsed = JSON.parse(savedCart)
          if (Array.isArray(parsed)) {
            setItems(parsed)
            // Ensure we set the vendor ID if there are items
            if (parsed.length > 0) {
              setCurrentVendorId(parsed[0].vendor._id)
            }
          }
        } catch (error) {
          console.error("Failed to parse cart data:", error)
          localStorage.removeItem("street-eats-cart")
        }
      }
    }
    loadCart()
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("street-eats-cart", JSON.stringify(items))
    // Update currentVendorId whenever items change
    if (items.length > 0) {
      setCurrentVendorId(items[0].vendor._id)
    } else {
      setCurrentVendorId(null)
    }
  }, [items])

  const addItem = (newItem: Omit<CartItem, "quantity">, quantity: number = 1) => {
  // Add validation for vendor ID
  if (!newItem.vendor._id) {
    console.error("Vendor ID is missing!", newItem);
    throw new Error("Cannot add item - vendor information is incomplete");
  }

  setItems((prev) => {
    if (prev.length > 0 && prev[0].vendor._id !== newItem.vendor._id) {
      alert("You can only order from one vendor at a time. Please clear your cart first.");
      return prev;
    }

    const existingItemIndex = prev.findIndex((item) => item.id === newItem.id);
    
    if (existingItemIndex !== -1) {
      const updatedItems = [...prev];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: updatedItems[existingItemIndex].quantity + quantity
      };
      return updatedItems;
    }

    setCurrentVendorId(newItem.vendor._id);
    return [...prev, { ...newItem, quantity }];
  });
};
  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id)
      return
    }
    setItems((prev) =>
      prev.map((item) => 
        item.id === id ? { ...item, quantity } : item
      )
    )
  }

  const removeItem = (id: string) => {
    setItems((prev) => {
      const filtered = prev.filter((item) => item.id !== id)
      if (filtered.length === 0) {
        setCurrentVendorId(null)
      }
      return filtered
    })
  }

  const clearCart = () => {
    setItems([])
    setCurrentVendorId(null)
  }

  const getTotalItems = () => 
    items.reduce((sum, item) => sum + item.quantity, 0)

  const getTotalPrice = () =>
    items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const getCurrentVendor = (): VendorInfo | null => {
    return items[0]?.vendor || null
  }

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        getTotalItems,
        getTotalPrice,
        getCurrentVendor,
        currentVendorId,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}