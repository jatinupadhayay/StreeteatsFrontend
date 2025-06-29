"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api"

// Generic hook for API calls
export function useApi<T>(
  apiCall: (...args: any[]) => Promise<T>,
  dependencies: any[] = [],
  options: {
    immediate?: boolean
    onSuccess?: (data: T) => void
    onError?: (error: any) => void
  } = {},
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { immediate = true, onSuccess, onError } = options;

  const execute = async (...args: any[]) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall(...args);
      setData(result);
      onSuccess?.(result);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || "An error occurred";
      setError(errorMessage);
      onError?.(err);
      throw err; // Re-throw to allow calling code to handle
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (immediate) {
      execute().catch(() => {}); // Catch to prevent unhandled promise rejection
    }
  }, dependencies);

  return {
    data,
    loading,
    error,
    execute,
    refetch: execute,
  };
}
// Define common interfaces (can be moved to a shared types file)
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
  stock?: number
  lowStockThreshold?: number
}

interface VendorImages {
  profile?: string
  shop?: string
  license?: string
}

// Define VendorDashboardData interface to match the API response structure
interface VendorDashboardData {
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

// Specific hooks for common API calls
export function useVendors(filters?: any) {
  return useApi(() => api.vendors.getAll(filters), [filters])
}

export function useVendor(id: string) {
  return useApi(() => api.vendors.getById(id), [id], { immediate: !!id })
}

export function useCustomerOrders(filters?: any) {
  return useApi(() => api.orders.getCustomerOrders(filters), [filters])
}

export function useVendorOrders(filters?: any) {
  return useApi(() => api.orders.getVendorOrders(filters), [filters])
}

export function useDeliveryOrders(filters?: any) {
  return useApi(() => api.orders.getDeliveryOrders(filters), [filters])
}

export function useUserProfile() {
  return useApi(() => api.users.getProfile(), [])
}

export function useNotifications() {
  return useApi(() => api.notifications.getAll(), [])
}

export function useVendorDashboard() {
  return useApi<VendorDashboardData>(() => api.vendors.getDashboardStats(), [])
}

export function useDeliveryDashboard() {
  return useApi(() => api.delivery.getDashboard(), [])
}

// New hook for updating vendor profile - THIS IS THE EXPORTED MEMBER
export function useUpdateVendorProfile() {
  // The `execute` function of useApi will now accept arguments, which will be passed to `api.vendors.updateProfile`
  return useApi(
    (vendorData: FormData) => api.vendors.updateProfile(vendorData),
    [],
    { immediate: false }, // Do not execute immediately
  )
}
