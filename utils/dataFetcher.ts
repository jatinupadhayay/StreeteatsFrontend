import { api } from "@/lib/api"

// Utility functions for data fetching with error handling
export class DataFetcher {
  static async fetchWithRetry<T>(apiCall: () => Promise<T>, maxRetries = 3, delay = 1000): Promise<T> {
    let lastError: any

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await apiCall()
      } catch (error) {
        lastError = error
        if (i < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)))
        }
      }
    }

    throw lastError
  }

  static async fetchVendorsWithLocation(userLocation?: { lat: number; lng: number }) {
    return this.fetchWithRetry(() =>
      api.vendors.getAll({
        lat: userLocation?.lat,
        lng: userLocation?.lng,
        radius: 10,
      }),
    )
  }

  static async fetchOrderHistory(userId: string, role: string) {
    switch (role) {
      case "customer":
        return this.fetchWithRetry(() => api.orders.getCustomerOrders())
      case "vendor":
        return this.fetchWithRetry(() => api.orders.getVendorOrders())
      case "delivery":
        return this.fetchWithRetry(() => api.orders.getDeliveryOrders())
      default:
        throw new Error("Invalid role")
    }
  }

  static async fetchDashboardData(role: string) {
    switch (role) {
      case "vendor":
        return this.fetchWithRetry(() => api.vendors.getDashboardStats())
      case "delivery":
        return this.fetchWithRetry(() => api.delivery.getDashboard())
      default:
        return null
    }
  }
}

// Cache management for frequently accessed data
export class DataCache {
  private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  static set(key: string, data: any, ttl: number = 5 * 60 * 1000) {
    // Default 5 minutes TTL
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  static get(key: string) {
    const cached = this.cache.get(key)
    if (!cached) return null

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  static clear() {
    this.cache.clear()
  }

  static async getOrFetch<T>(key: string, fetcher: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = this.get(key)
    if (cached) return cached

    const data = await fetcher()
    this.set(key, data, ttl)
    return data
  }
}
