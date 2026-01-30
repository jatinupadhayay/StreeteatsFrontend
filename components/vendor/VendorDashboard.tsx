"use client"

import { useState, useEffect } from "react"
import { Store, Package, BarChart3, Settings, Bell, Wallet as WalletIcon, CreditCard, Clock, Loader2, Power, PowerOff } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import Navbar from "@/components/common/Navbar"
import MenuManager from "./MenuManager"
import OrderManager from "./OrderManager"
import Analytics from "./Analytics"
import Promotions from "./Promotions"
import VendorPage from "./VendorProfile"
import Wallet from "./Wallet"
import UpiPaymentSettings from "./UpiPaymentSettings"
import { useSocket } from "@/contexts/SocketContext"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"

// Simple fallback ErrorBoundary
const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}
export default function VendorDashboard() {
  const [activeTab, setActiveTab] = useState("orders")
  const [shopName, setShopName] = useState("Vendor Dashboard")
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isActive, setIsActive] = useState(false)
  const [isToggling, setIsToggling] = useState(false)
  const { isConnected } = useSocket()
  const { toast } = useToast()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        // Fetch by current user info if vendorId not in localstorage yet
        const response = await api.vendors.getDashboard()
        if (response?.success && response?.vendor) {
          setShopName(`${response.vendor.shopName} Dashboard`)
          setStatus(response.vendor.status || "approved")
          setIsActive(response.vendor.isActive || false)
        }
      } catch (error) {
        console.error("Failed to fetch shop profile:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleToggleActive = async () => {
    setIsToggling(true)
    try {
      console.log("Calling toggle API...")
      const response = await api.vendors.toggleStatus()
      console.log("Toggle response:", response)

      if (response && response.success) {
        // Backend returns isActive at top level, not nested in vendor
        const newStatus = response.vendor?.isActive ?? response.isActive
        setIsActive(newStatus)
        toast({
          title: newStatus ? "🟢 You're Online!" : "⚫ You're Offline",
          description: newStatus
            ? "Your shop is now visible to customers"
            : "Your shop is hidden from customers",
        })
      } else {
        throw new Error(response?.message || "Unknown error")
      }
    } catch (error: any) {
      console.error("Toggle error:", error)
      toast({
        title: "❌ Failed to update status",
        description: error.message || "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsToggling(false)
    }
  }

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
      {/* Updated Navbar with Active Toggle */}
      <Navbar
        title={shopName}
        showNotifications={true}
        onProfileClick={() => setActiveTab("profile")}
        extraActions={
          <div className="hidden md:flex items-center gap-3">
            {!loading && status === "approved" && (
              <>
                <div className="flex items-center gap-2 bg-orange-100 rounded-full px-3 py-1.5">
                  {isActive ? (
                    <Power className="w-4 h-4 text-green-600" />
                  ) : (
                    <PowerOff className="w-4 h-4 text-gray-500" />
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    {isActive ? "Online" : "Offline"}
                  </span>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={handleToggleActive}
                  disabled={isToggling}
                  className="data-[state=checked]:bg-green-600"
                />
              </>
            )}
          </div>
        }
        extraMobileActions={
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-orange-600 bg-orange-50 rounded-full"
              onClick={() => setActiveTab("wallet")}
            >
              <WalletIcon className="w-5 h-5" />
            </Button>
            {!loading && status === "approved" && (
              <Switch
                checked={isActive}
                onCheckedChange={handleToggleActive}
                disabled={isToggling}
                className="data-[state=checked]:bg-green-600"
              />
            )}
          </>
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
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 min-h-[60vh]">
            <Loader2 className="w-10 h-10 animate-spin text-orange-500 mb-4" />
            <p className="text-gray-500 animate-pulse">Loading dashboard...</p>
          </div>
        ) : status === "pending" ? (
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
              {/* Mobile Bottom Navigation - Simplified to 5 items */}
              <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-40 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                <TabsList className="flex items-center justify-around w-full h-16 bg-white p-0">
                  {mobileBottomTabs.map((tab) => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="flex-1 flex flex-col items-center justify-center h-full space-y-1 rounded-none border-t-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 data-[state=active]:bg-orange-50/50 transition-all"
                    >
                      <tab.icon className="w-5 h-5" />
                      <span className="text-[10px] font-medium">{tab.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {/* Desktop Side Navigation */}
              <div className="hidden md:flex">
                <div className="w-64 bg-white shadow-lg min-h-[calc(100vh-80px)] border-r">
                  <TabsList className="flex flex-col w-full h-auto bg-transparent p-4 space-y-1">
                    {tabs.map((tab) => (
                      <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        className="w-full justify-start p-3 rounded-lg transition-colors data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700 hover:bg-orange-50"
                      >
                        <tab.icon className="w-5 h-5 mr-3" />
                        <span className="font-medium">{tab.label}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                <div className="flex-1 p-6">
                  <TabsContent value="orders" className="m-0 focus-visible:outline-none">
                    <OrderManager />
                  </TabsContent>
                  <TabsContent value="menu" className="m-0 focus-visible:outline-none">
                    <MenuManager />
                  </TabsContent>
                  <TabsContent value="analytics" className="m-0 focus-visible:outline-none">
                    <Analytics />
                  </TabsContent>
                  <TabsContent value="promotions" className="m-0 focus-visible:outline-none">
                    <Promotions />
                  </TabsContent>
                  <TabsContent value="wallet" className="m-0 focus-visible:outline-none">
                    <Wallet />
                  </TabsContent>
                  <TabsContent value="payment-settings" className="m-0 focus-visible:outline-none">
                    <UpiPaymentSettings />
                  </TabsContent>
                  <TabsContent value="profile" className="m-0 focus-visible:outline-none">
                    <VendorPage />
                  </TabsContent>
                </div>
              </div>

              {/* Mobile Content Area */}
              <div className="md:hidden">
                <div className="p-1">
                  <TabsContent value="orders" className="m-0 focus-visible:outline-none">
                    <OrderManager />
                  </TabsContent>
                  <TabsContent value="menu" className="m-0 focus-visible:outline-none">
                    <MenuManager />
                  </TabsContent>
                  <TabsContent value="analytics" className="m-0 focus-visible:outline-none">
                    <Analytics />
                  </TabsContent>
                  <TabsContent value="promotions" className="m-0 focus-visible:outline-none">
                    <Promotions />
                  </TabsContent>
                  <TabsContent value="wallet" className="m-0 focus-visible:outline-none">
                    <Wallet />
                  </TabsContent>
                  <TabsContent value="payment-settings" className="m-0 focus-visible:outline-none">
                    <UpiPaymentSettings />
                  </TabsContent>
                  <TabsContent value="profile" className="m-0 focus-visible:outline-none">
                    <VendorPage />
                  </TabsContent>
                </div>
              </div>
            </Tabs>
          </ErrorBoundary>
        )}
      </div>
    </div>
  )
}