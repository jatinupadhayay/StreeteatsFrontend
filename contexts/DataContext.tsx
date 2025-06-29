"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect } from "react"
import { api } from "@/lib/api"
import { useAuth } from "./AuthContext"

interface DataState {
  vendors: any[]
  orders: any[]
  notifications: any[]
  userProfile: any
  dashboardStats: any
  loading: {
    vendors: boolean
    orders: boolean
    notifications: boolean
    profile: boolean
    dashboard: boolean
  }
  errors: {
    vendors: string | null
    orders: string | null
    notifications: string | null
    profile: string | null
    dashboard: string | null
  }
}

type DataAction =
  | { type: "SET_LOADING"; payload: { key: keyof DataState["loading"]; value: boolean } }
  | { type: "SET_ERROR"; payload: { key: keyof DataState["errors"]; value: string | null } }
  | { type: "SET_VENDORS"; payload: any[] }
  | { type: "SET_ORDERS"; payload: any[] }
  | { type: "SET_NOTIFICATIONS"; payload: any[] }
  | { type: "SET_USER_PROFILE"; payload: any }
  | { type: "SET_DASHBOARD_STATS"; payload: any }
  | { type: "ADD_ORDER"; payload: any }
  | { type: "UPDATE_ORDER"; payload: { id: string; updates: any } }
  | { type: "ADD_NOTIFICATION"; payload: any }
  | { type: "MARK_NOTIFICATION_READ"; payload: string }

const initialState: DataState = {
  vendors: [],
  orders: [],
  notifications: [],
  userProfile: null,
  dashboardStats: null,
  loading: {
    vendors: false,
    orders: false,
    notifications: false,
    profile: false,
    dashboard: false,
  },
  errors: {
    vendors: null,
    orders: null,
    notifications: null,
    profile: null,
    dashboard: null,
  },
}

function dataReducer(state: DataState, action: DataAction): DataState {
  switch (action.type) {
    case "SET_LOADING":
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.value,
        },
      }
    case "SET_ERROR":
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.key]: action.payload.value,
        },
      }
    case "SET_VENDORS":
      return { ...state, vendors: action.payload }
    case "SET_ORDERS":
      return { ...state, orders: action.payload }
    case "SET_NOTIFICATIONS":
      return { ...state, notifications: action.payload }
    case "SET_USER_PROFILE":
      return { ...state, userProfile: action.payload }
    case "SET_DASHBOARD_STATS":
      return { ...state, dashboardStats: action.payload }
    case "ADD_ORDER":
      return { ...state, orders: [action.payload, ...state.orders] }
    case "UPDATE_ORDER":
      return {
        ...state,
        orders: state.orders.map((order) =>
          order.id === action.payload.id ? { ...order, ...action.payload.updates } : order,
        ),
      }
    case "ADD_NOTIFICATION":
      return { ...state, notifications: [action.payload, ...state.notifications] }
    case "MARK_NOTIFICATION_READ":
      return {
        ...state,
        notifications: state.notifications.map((notif) =>
          notif.id === action.payload ? { ...notif, isRead: true } : notif,
        ),
      }
    default:
      return state
  }
}

const DataContext = createContext<{
  state: DataState
  dispatch: React.Dispatch<DataAction>
  actions: {
    fetchVendors: (filters?: any) => Promise<void>
    fetchOrders: () => Promise<void>
    fetchNotifications: () => Promise<void>
    fetchUserProfile: () => Promise<void>
    fetchDashboardStats: () => Promise<void>
    createOrder: (orderData: any) => Promise<void>
    updateOrderStatus: (orderId: string, status: string) => Promise<void>
    markNotificationAsRead: (notificationId: string) => Promise<void>
  }
} | null>(null)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(dataReducer, initialState)
  const { user, userRole } = useAuth()

  const setLoading = (key: keyof DataState["loading"], value: boolean) => {
    dispatch({ type: "SET_LOADING", payload: { key, value } })
  }

  const setError = (key: keyof DataState["errors"], value: string | null) => {
    dispatch({ type: "SET_ERROR", payload: { key, value } })
  }

  const actions = {
    fetchVendors: async (filters?: any) => {
      setLoading("vendors", true)
      setError("vendors", null)
      try {
        const response = await api.vendors.getAll(filters)
        dispatch({ type: "SET_VENDORS", payload: response.vendors || [] })
      } catch (error: any) {
        setError("vendors", error.message)
      } finally {
        setLoading("vendors", false)
      }
    },

    fetchOrders: async () => {
      if (!user) return

      setLoading("orders", true)
      setError("orders", null)
      try {
        let response
        switch (userRole) {
          case "customer":
            response = await api.orders.getCustomerOrders()
            break
          case "vendor":
            response = await api.orders.getVendorOrders()
            break
          case "delivery":
            response = await api.orders.getDeliveryOrders()
            break
          default:
            throw new Error("Invalid user role")
        }
        dispatch({ type: "SET_ORDERS", payload: response.orders || [] })
      } catch (error: any) {
        setError("orders", error.message)
      } finally {
        setLoading("orders", false)
      }
    },

    fetchNotifications: async () => {
      if (!user) return

      setLoading("notifications", true)
      setError("notifications", null)
      try {
        const response = await api.notifications.getAll()
        dispatch({ type: "SET_NOTIFICATIONS", payload: response.notifications || [] })
      } catch (error: any) {
        setError("notifications", error.message)
      } finally {
        setLoading("notifications", false)
      }
    },

    fetchUserProfile: async () => {
      if (!user) return

      setLoading("profile", true)
      setError("profile", null)
      try {
        const response = await api.users.getProfile()
        dispatch({ type: "SET_USER_PROFILE", payload: response.user })
      } catch (error: any) {
        setError("profile", error.message)
      } finally {
        setLoading("profile", false)
      }
    },

    fetchDashboardStats: async () => {
      if (!user || userRole === "customer") return

      setLoading("dashboard", true)
      setError("dashboard", null)
      try {
        let response
        if (userRole === "vendor") {
          response = await api.vendors.getDashboardStats()
        } else if (userRole === "delivery") {
          response = await api.delivery.getDashboard()
        }
        dispatch({ type: "SET_DASHBOARD_STATS", payload: response })
      } catch (error: any) {
        setError("dashboard", error.message)
      } finally {
        setLoading("dashboard", false)
      }
    },

    createOrder: async (orderData: any) => {
      try {
        const response = await api.orders.create(orderData)
        dispatch({ type: "ADD_ORDER", payload: response.order })
        return response
      } catch (error: any) {
        throw error
      }
    },

    updateOrderStatus: async (orderId: string, status: string) => {
      try {
        const response = await api.orders.updateStatus(orderId, status)
        dispatch({
          type: "UPDATE_ORDER",
          payload: { id: orderId, updates: { status } },
        })
        return response
      } catch (error: any) {
        throw error
      }
    },

    markNotificationAsRead: async (notificationId: string) => {
      try {
        await api.notifications.markAsRead(notificationId)
        dispatch({ type: "MARK_NOTIFICATION_READ", payload: notificationId })
      } catch (error: any) {
        throw error
      }
    },
  }

  // Auto-fetch data when user logs in
  useEffect(() => {
    if (user) {
      actions.fetchUserProfile()
      actions.fetchNotifications()
      if (userRole !== "customer") {
        actions.fetchDashboardStats()
      }
    }
  }, [user, userRole])

  return <DataContext.Provider value={{ state, dispatch, actions }}>{children}</DataContext.Provider>
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error("useData must be used within a DataProvider")
  }
  return context
}
