"use client"

import { useState, useEffect } from "react"
import { Store, Package, BarChart3, Settings, Bell, Wallet as WalletIcon, CreditCard, Clock } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import Navbar from "@/components/common/Navbar"
import MenuManager from "./MenuManager"
import OrderManager from "./OrderManager"
import Analytics from "./Analytics"
import Promotions from "./Promotions"
import VendorPage from "./VendorProfile"
import Wallet from "./Wallet"
import UpiPaymentSettings from "./UpiPaymentSettings"
import { useSocket } from "@/contexts/SocketContext"
import { api } from "@/lib/api"

// Simple fallback ErrorBoundary
const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}
export default function VendorDashboard() {
  const [activeTab, setActiveTab] = useState("orders")
  const [shopName, setShopName] = useState("Vendor Dashboard")
  const [status, setStatus] = useState<string | null>(null)
  const { isConnected } = useSocket()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Fetch by current user info if vendorId not in localstorage yet
        const response = await api.vendors.getDashboard()
        if (response?.success && response?.vendor) {
          setShopName(`${response.vendor.shopName} Dashboard`)
          setStatus(response.vendor.status || "approved")
        }
      } catch (error) {
        console.error("Failed to fetch shop profile:", error)
      }
    }
    fetchProfile()
  }, [])

  const tabs = [
    { id: "orders", label: "Orders", icon: Package },
    { id: "menu", label: "Menu", icon: Store },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "promotions", label: "Promotions", icon: Bell },
    { id: "wallet", label: "Wallet", icon: WalletIcon },
    { id: "payment-settings", label: "Payment Settings", icon: CreditCard },
    { id: "profile", label: "Profile", icon: Settings },
  ]

  // Tabs specifically for mobile bottom navigation (only 5 items)
  const mobileBottomTabs = tabs.filter(tab =>
    ["orders", "menu", "analytics", "promotions", "payment-settings"].includes(tab.id)
  )

  return (
    <div className="min-h-screen bg-orange-50 pb-20 md:pb-0">
      {/* Updated Navbar with Wallet and Profile transitions */}
      <Navbar
        title={shopName}
        showNotifications={true}
        onProfileClick={() => setActiveTab("profile")}
        extraActions={
          <div className="hidden md:flex">
            {/* Desktop extra actions if needed */}
          </div>
        }
        extraMobileActions={
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-orange-600 bg-orange-50 rounded-full"
            onClick={() => setActiveTab("wallet")}
          >
            <WalletIcon className="w-5 h-5" />
          </Button>
        }
      />

      {/* Connection Status */}
      <div className="bg-white border-b px-2 py-1 sticky top-16 z-30 sm:px-4 sm:py-2">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
            <span className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
              {isConnected ? "Live Network Active" : "Network Disconnected"}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {status === "pending" ? (
          <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
            <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mb-6">
              <Clock className="w-12 h-12 text-orange-600 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Under Review</h2>
            <p className="text-gray-600 max-w-md mx-auto mb-8">
              Thank you for registering with Street Eats! Our team is currently reviewing your shop details and documents.
              We'll notify you via email once your account is approved.
            </p>
            <div className="bg-white p-6 rounded-xl border border-orange-100 shadow-sm max-w-sm w-full">
              <h3 className="font-semibold text-orange-800 mb-4 flex items-center justify-center">
                <Bell className="w-4 h-4 mr-2" /> What happens next?
              </h3>
              <ul className="text-sm text-gray-600 text-left space-y-3">
                <li className="flex items-start">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5 text-[10px] text-green-700 font-bold">1</div>
                  <span>Admin verifies your FSSAI/License documents</span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center mr-3 mt-0.5 text-[10px] text-orange-700 font-bold">2</div>
                  <span>Account is activated for orders</span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center mr-3 mt-0.5 text-[10px] text-orange-700 font-bold">3</div>
                  <span>You can set your menu and go live!</span>
                </li>
              </ul>
            </div>
            <Button variant="outline" className="mt-8" onClick={() => window.location.reload()}>
              Check Status Again
            </Button>
          </div>
        ) : (
          <ErrorBoundary>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Existing navigation and content */}
              {/* ... (keep existing tabs logic) ... */}
            </Tabs>
          </ErrorBoundary>
        )}
      </div>
    </div>
  )
}