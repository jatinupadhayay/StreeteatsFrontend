import VendorsPage from "@/app/vendors/page"
import { Search } from "lucide-react"


// Complete API service layer for all data fetching
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

// Helper function to get auth headers for JSON requests
const getAuthHeaders = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("streetEatsToken") : null
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

// Helper function for FormData requests (no Content-Type header needed, browser sets it)
const getAuthHeadersFormData = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("streetEatsToken") : null
  return {
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

// Define common interfaces for better type safety
interface Address {
  street: string
  city: string
  state: string
  pincode: string
  coordinates: [number, number] // [longitude, latitude]
}

interface Contact {
  website?: string
  socialMedia?: string
}

interface OperationalHours {
  monday: { open: string; close: string }
  tuesday: { open: string; close: string }
  wednesday: { open: string; close: string }
  thursday: { open: string; close: string }
  friday: { open: string; close: string }
  saturday: { open: string; close: string }
  sunday: { open: string; close: string }
}

interface MenuItem {
  _id: string // MongoDB ID
  name: string
  description: string
  price: number
  image: string
  category: string
  isAvailable: boolean
  isVeg: boolean
  stock?: number // Optional, if stock is managed on backend
  lowStockThreshold?: number // Optional
}

interface VendorImages {
  profile?: string
  shop?: string
  license?: string
}
interface OrderTrackingResponse {
  success: boolean
  order: {
    _id: string
    orderNumber: string

    status: string
    orderType: string
    items: Array<{
      name: string
      quantity: number
      price: number
      customizations?: Record<string, any>
    }>
    pricing: {
      subtotal: number
      deliveryFee: number
      taxes: { total: number }
      total: number
    }
    deliveryAddress: {
      street: string
      city: string
      state: string
      pincode: string
      coordinates?: [number, number]
      instructions?: string
    }
    specialInstructions?: string
    createdAt: string
    updatedAt: string
    estimatedDeliveryTime?: string
    actualDeliveryTime?: string
    vendor: {
      _id: string
      shopName: string
      address: any
      images: any
      contact: any
    }
  }
  deliveryPerson?: {
    name: string
    rating: number
    phone: string
    vehicle: string
    photo?: string
  }
}

interface RatingData {
  food?: number
  delivery?: number
  overall: number
  review?: string
}

// Define VendorDashboardStatsResponse interface
interface VendorDashboardStatsResponse {
  analytics(analytics: any): unknown
  success: boolean
  vendor: {
    id: string
    shopName: string
    shopDescription: string
    cuisine: string[]
    address: Address
    contact: Contact
    operationalHours: OperationalHours
    deliveryRadius: number
    minimumOrderValue: number
    averagePreparationTime: number
    images: VendorImages
    rating: number
    totalOrders: number
    totalRevenue: number
    isActive: boolean
    menu: MenuItem[]
  }
  todayStats: {
    orders: number
    revenue: number
    avgOrderValue: number
  }
  weeklyStats: {
    revenue: number
    orders: number
    growth: number
  }
  topDishes: Array<{
    _id: string
    name: string
    orders: number
    revenue: number
  }>
  customerFeedback: {
    averageRating: number
    totalReviews: number
    recentReviews: Array<{
      customer: string
      rating: number
      comment: string
    }>
  }
  pendingOrders: Array<{
    id: string
    orderId: string
    customerName: string
    customerPhone: string
    items: Array<{ name: string; quantity: number; price: number }>
    total: number
    status: string
    orderTime: string
    deliveryAddress: string
  }>
}

export const api = {
  // ==================== AUTH APIs ====================
  auth: {
    login: async (email: string, password: string, role: string) => {
      console.log("login in as", email, password, role)
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      })
      return response.json()
    },

    registerCustomer: async (userData: any) => {
      console.log("User try to register as ", userData)
      const response = await fetch(`${API_BASE}/auth/register/customer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      })
      return response.json()
    },

    registerVendor: async (formData: FormData) => {
      console.log("vendor want register as", formData)
      const response = await fetch(`${API_BASE}/auth/register/vendor`, {
        method: "POST",
        body: formData,
      })
      return response.json()
    },

    registerDelivery: async (formData: FormData) => {
      console.log("delivery boy want register as", formData)

      const response = await fetch(`${API_BASE}/auth/register/delivery`, {
        method: "POST",
        body: formData,
      })
      return response.json()
    },

    logout: async () => {
      const response = await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: getAuthHeaders(),
      })
      return response.json()
    },

    refreshToken: async () => {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: getAuthHeaders(),
      })
      return response.json()
    },
  },

  // ==================== PAYMENT APIs (SECURE) ====================
  payments: {
    // Get payment config securely from server
    getConfig: async () => {
      const response = await fetch(`${API_BASE}/payments/config`, {
        method: "GET",
        headers: getAuthHeaders(),
      })
      return response.json()
    },

    // Create payment order
    createOrder: async (amount: number, orderId: string) => {
      const response = await fetch(`${API_BASE}/payments/create-order`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ amount, orderId }),
      })
      return response.json()
    },

    // Verify payment
    verifyPayment: async (paymentData: {
      razorpay_order_id: string
      razorpay_payment_id: string
      razorpay_signature: string
      orderId: string
    }) => {
      const response = await fetch(`${API_BASE}/payments/verify`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(paymentData),
      })
      return response.json()
    },

    // Get payment history
    getHistory: async (page?: number, limit?: number) => {
      const params = new URLSearchParams()
      if (page) params.append("page", page.toString())
      if (limit) params.append("limit", limit.toString())

      const response = await fetch(`${API_BASE}/payments/history?${params}`, {
        headers: getAuthHeaders(),
      })
      return response.json()
    },
  },

  // ==================== VENDOR APIs ====================
  vendors: {
    // Get all vendors (for customers)
    getAll: async (filters?: {
      cuisine?: string
      search?: string
      lat?: number
      lng?: number
      radius?: number
    }) => {
      try {
        const params = new URLSearchParams()
        if (filters?.cuisine) params.append("cuisine", filters.cuisine)
        if (filters?.search) params.append("search", filters.search)
        if (filters?.lat) params.append("lat", filters.lat.toString())
        if (filters?.lng) params.append("lng", filters.lng.toString())
        if (filters?.radius) params.append("radius", filters.radius.toString())

        const response = await fetch(`${API_BASE}/vendors?${params}`, {
          headers: getAuthHeaders(),
        })
        return response.json()
        
      } catch (error) {
        console.error("Failed to fetch vendors:", error)
        return { error: error instanceof Error ? error.message : "Unknown error" }
      }
    },

    // Get single vendor details
    getById: async (id: string) => {
      try {
        const response = await fetch(`${API_BASE}/vendors/${id}`, {
          headers: getAuthHeaders(),
        })
        return response.json()
      } catch (error) {
        console.error(`Failed to fetch vendor ${id}:`, error)
        return { error: error instanceof Error ? error.message : "Unknown error" }
      }
    },

    // Get vendor dashboard stats
   // In api.ts
getDashboardStats: async (): Promise<VendorDashboardStatsResponse> => {
  
  try {
  
    const response = await fetch(`${API_BASE}/vendors/dashboard/stats`, {
      
      headers: getAuthHeaders(),
    });
    
    console.log(response)
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch vendor dashboard stats");
    }
    
    return await response.json() as VendorDashboardStatsResponse;
    
  } catch (error) {
    console.error("Failed to fetch vendor dashboard stats:", error);
    throw error; // Re-throw the error to be caught by useApi hook
  }
},
    // Update vendor profile - now accepts FormData directly
    updateProfile: async (formData: FormData) => {
      const response = await fetch(`${API_BASE}/vendors/profile`, {
        method: "PUT",
        headers: getAuthHeadersFormData(), // No Content-Type for FormData
        body: formData,
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update vendor profile")
      }
      return response.json()
    },

    // Menu management - now accepts FormData directly
    addMenuItem: async (formData: FormData) => {
      const response = await fetch(`${API_BASE}/vendors/menu`, {
        method: "POST",
        headers: getAuthHeadersFormData(), // No Content-Type for FormData
        body: formData,
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to add menu item")
      }
      return response.json()
    },

    // Update menu item - now accepts FormData directly
    updateMenuItem: async (itemId: string, formData: FormData) => {
      const response = await fetch(`${API_BASE}/vendors/menu/${itemId}`, {
        method: "PUT",
        headers: getAuthHeadersFormData(), // No Content-Type for FormData
        body: formData,
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update menu item")
      }
      return response.json()
    },

    deleteMenuItem: async (itemId: string) => {
      const response = await fetch(`${API_BASE}/vendors/menu/${itemId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete menu item")
      }
      return response.json()
    },

    // Toggle vendor active status
    toggleStatus: async () => {
      const response = await fetch(`${API_BASE}/vendors/toggle-status`, {
        method: "PUT",
        headers: getAuthHeaders(),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to toggle vendor status")
      }
      return response.json()
    },
  },

  // ==================== ORDER APIs ====================
  orders: {
    // Create new order (customer)
    create: async (orderData: {
      vendorId: string
      items: any[]
       deliveryAddress?: {
    street: string
    city: string
    state: string
    pincode: string
    coordinates: [number, number]
    instructions?: string
  }
      paymentMethod: string
      specialInstructions?: string
    }) => {
      const response = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(orderData),
      })
      return response.json()
    },

    // Get customer orders
    getCustomerOrders: async (filters?: { status?: string; page?: number; limit?: number }) => {
      const params = new URLSearchParams()
      if (filters?.status) params.append("status", filters.status)
      if (filters?.page) params.append("page", filters.page.toString())
      if (filters?.limit) params.append("limit", filters.limit.toString())

      const response = await fetch(`${API_BASE}/orders/customer?${params}`, {
        headers: getAuthHeaders(),
      })
      return response.json()
    },

    // Get vendor orders
   getVendorOrders: async (filters?: { status?: string | string[]; page?: number; limit?: number }) => {
  const params = new URLSearchParams()

  if (filters?.status) {
    if (Array.isArray(filters.status)) {
      filters.status.forEach((status) => params.append("status", status))
    } else {
      params.append("status", filters.status)
    }
  }

  if (filters?.page) params.append("page", filters.page.toString())
  if (filters?.limit) params.append("limit", filters.limit.toString())

  const response = await fetch(`${API_BASE}/orders/vendor?${params}`, {
    headers: getAuthHeaders(),
  })

  return response.json()
}
,

    // Get delivery orders
    getDeliveryOrders: async (filters?: { status?: string; page?: number; limit?: number }) => {
      const params = new URLSearchParams()
      if (filters?.status) params.append("status", filters.status)
      if (filters?.page) params.append("page", filters.page.toString())
      if (filters?.limit) params.append("limit", filters.limit.toString())

      const response = await fetch(`${API_BASE}/orders/delivery?${params}`, {
        headers: getAuthHeaders(),
      })
      return response.json()
    },

    // Update order status
    updateStatus: async (orderId: string, status: string, notes?: string) => {
      const response = await fetch(`${API_BASE}/orders/${orderId}/status`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status, notes }),
      })
      return response.json()
    },

    // Accept delivery request
    acceptDelivery: async (orderId: string) => {
      const response = await fetch(`${API_BASE}/orders/${orderId}/accept-delivery`, {
        method: "PUT",
        headers: getAuthHeaders(),
      })
      return response.json()
    },

    // Rate order
      
    getById: async (orderId: string): Promise<OrderTrackingResponse> => {
      try {
        const response = await fetch(`${API_BASE}/orders/${orderId}/tracking`, {
          headers: getAuthHeaders(),
        })
        
        if (!response.ok) {
          throw new Error(`Failed to fetch order: ${response.status}`)
        }
        
        return await response.json()
      } catch (error) {
        console.error("Error fetching order:", error)
        throw error
      }
    },

    rateOrder: async (
      orderId: string,
      rating: RatingData
    ): Promise<{ success: boolean; message: string }> => {
      try {
        const response = await fetch(`${API_BASE}/orders/${orderId}/rate`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(rating),
        })
        
        if (!response.ok) {
          throw new Error(`Failed to rate order: ${response.status}`)
        }
        
        return await response.json()
      } catch (error) {
        console.error("Error rating order:", error)
        throw error
      }},
  },

  // ==================== USER APIs ====================
 users: {
    // Get user profile
    getProfile: async () => {
      try {
        const response = await fetch(`${API_BASE}/users/profile`, {
          headers: getAuthHeaders(),
        })
        return response.json()
      } catch (error) {
        console.error("Failed to fetch user profile:", error)
        return { error: error instanceof Error ? error.message : "Unknown error" }
      }
    },

    // Update user profile
    updateProfile: async (profileData: any, avatar?: File) => {
      const formData = new FormData()
      Object.keys(profileData).forEach((key) => {
        if (typeof profileData[key] === "object") {
          formData.append(key, JSON.stringify(profileData[key]))
        } else {
          formData.append(key, profileData[key])
        }
      })
      if (avatar) formData.append("avatar", avatar)

      const response = await fetch(`${API_BASE}/users/profile`, {
        method: "PUT",
        headers: getAuthHeadersFormData(),
        body: formData,
      })
      return response.json()
    },

    // Add delivery address
    addAddress: async (address: any) => {
      const response = await fetch(`${API_BASE}/users/addresses`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(address),
      })
      return response.json()
    },

    // Update delivery address
    updateAddress: async (addressId: string, address: any) => {
      const response = await fetch(`${API_BASE}/users/addresses/${addressId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(address),
      })
      return response.json()
    },

    // Delete delivery address
    deleteAddress: async (addressId: string) => {
      const response = await fetch(`${API_BASE}/users/addresses/${addressId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })
      return response.json()
    },

    // Get user addresses
    getAddresses: async () => {
      try {
        const response = await fetch(`${API_BASE}/users/addresses`, {
          headers: getAuthHeaders(),
        })
        return response.json()
      } catch (error) {
        console.error("Failed to fetch user addresses:", error)
        return { error: error instanceof Error ? error.message : "Unknown error" }
      }
    },
  },

  // ==================== DELIVERY APIs ====================
  delivery: {
    // Get delivery partner dashboard
    getDashboard: async () => {
      const response = await fetch(`${API_BASE}/delivery/dashboard`, {
        headers: getAuthHeaders(),
      })
      return response.json()
    },

    // Update availability
    updateAvailability: async (isOnline: boolean) => {
      const response = await fetch(`${API_BASE}/delivery/availability`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ isOnline }),
      })
      return response.json()
    },

    // Update location
    updateLocation: async (coordinates: [number, number]) => {
      const response = await fetch(`${API_BASE}/delivery/location`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ coordinates }),
      })
      return response.json()
    },

    // Get earnings
    getEarnings: async (period?: string) => {
      const params = period ? `?period=${period}` : ""
      const response = await fetch(`${API_BASE}/delivery/earnings${params}`, {
        headers: getAuthHeaders(),
      })
      return response.json()
    },
  },

  // ==================== ANALYTICS APIs ====================
  analytics: {
    // Get vendor analytics
    getVendorAnalytics: async (period?: string) => {
      const params = period ? `?period=${period}` : ""
      const response = await fetch(`${API_BASE}/analytics/vendor${params}`, {
        headers: getAuthHeaders(),
      })
      return response.json()
    },

    // Get delivery analytics
    getDeliveryAnalytics: async (period?: string) => {
      const params = period ? `?period=${period}` : ""
      const response = await fetch(`${API_BASE}/analytics/delivery${params}`, {
        headers: getAuthHeaders(),
      })
      return response.json()
    },

    // Get customer analytics
    getCustomerAnalytics: async () => {
      const response = await fetch(`${API_BASE}/analytics/customer`, {
        headers: getAuthHeaders(),
      })
      return response.json()
    },
  },

  // ==================== REVIEWS APIs ====================
  reviews: {
    // Get vendor reviews
    getVendorReviews: async (vendorId: string, page?: number, limit?: number) => {
      const params = new URLSearchParams()
      if (page) params.append("page", page.toString())
      if (limit) params.append("limit", limit.toString())

      const response = await fetch(`${API_BASE}/reviews/vendor/${vendorId}?${params}`, {
        headers: getAuthHeaders(),
      })
      return response.json()
    },

    // Add review
    addReview: async (reviewData: {
      orderId: string
      vendorId: string
      rating: number
      comment: string
      images?: string[]
    }) => {
      const response = await fetch(`${API_BASE}/reviews`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(reviewData),
      })
      return response.json()
    },

    // Reply to review (vendor)
    replyToReview: async (reviewId: string, reply: string) => {
      const response = await fetch(`${API_BASE}/reviews/${reviewId}/reply`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ reply }),
      })
      return response.json()
    },
  },

  // ==================== NOTIFICATIONS APIs ====================
  notifications: {
    // Get user notifications
    getAll: async (page?: number, limit?: number) => {
      const params = new URLSearchParams()
      if (page) params.append("page", page.toString())
      if (limit) params.append("limit", limit.toString())

      const response = await fetch(`${API_BASE}/notifications?${params}`, {
        headers: getAuthHeaders(),
      })
      return response.json()
    },

    // Mark notification as read
    markAsRead: async (notificationId: string) => {
      const response = await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
        method: "PUT",
        headers: getAuthHeaders(),
      })
      return response.json()
    },

    // Mark all as read
    markAllAsRead: async () => {
      const response = await fetch(`${API_BASE}/notifications/mark-all-read`, {
        method: "PUT",
        headers: getAuthHeaders(),
      })
      return response.json()
    },

    // Delete notification
    delete: async (notificationId: string) => {
      const response = await fetch(`${API_BASE}/notifications/${notificationId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })
      return response.json()
    },
  },

  // ==================== UPLOAD APIs ====================
  upload: {
    // Upload single file
    uploadFile: async (file: File, type: string) => {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", type)

      const response = await fetch(`${API_BASE}/upload/single`, {
        method: "POST",
        headers: getAuthHeadersFormData(),
        body: formData,
      })
      return response.json()
    },

    // Upload multiple files
    uploadFiles: async (files: File[], type: string) => {
      const formData = new FormData()
      files.forEach((file) => formData.append("files", file))
      formData.append("type", type)

      const response = await fetch(`${API_BASE}/upload/multiple`, {
        method: "POST",
        headers: getAuthHeadersFormData(),
        body: formData,
      })
      return response.json()
    },
  },

  // ==================== SEARCH APIs ====================
  search: {
    // Global search
    global: async (query: string, filters?: any) => {
      const params = new URLSearchParams()
      params.append("q", query)
      if (filters) {
        Object.keys(filters).forEach((key) => {
          params.append(key, filters[key])
        })
      }

      const response = await fetch(`${API_BASE}/search?${params}`, {
        headers: getAuthHeaders(),
      })
      return response.json()
    },

    // Search vendors
    vendors: async (query: string, location?: { lat: number; lng: number }) => {
      const params = new URLSearchParams()
      params.append("q", query)
      if (location) {
        params.append("lat", location.lat.toString())
        params.append("lng", location.lng.toString())
      }

      const response = await fetch(`${API_BASE}/search/vendors?${params}`, {
        headers: getAuthHeaders(),
      })
      return response.json()
    },

    // Search menu items
    menuItems: async (query: string, vendorId?: string) => {
      const params = new URLSearchParams()
      params.append("q", query)
      if (vendorId) params.append("vendorId", vendorId)

      const response = await fetch(`${API_BASE}/search/menu-items?${params}`, {
        headers: getAuthHeaders(),
      })
      return response.json()
    },
  },
}