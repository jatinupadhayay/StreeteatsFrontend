"use client"

import { useState } from "react"
import { Store, Package, BarChart3, Settings, Bell, Wallet as WalletIcon, CreditCard } from "lucide-react"
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
import ErrorBoundary from "@/components/ErrorBoundary"
export default function VendorDashboard() {
  const [activeTab, setActiveTab] = useState("orders")
  const { isConnected } = useSocket()

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
        title="Vendor Dashboard"
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
      <div className="bg-white border-b px-4 py-2 sticky top-16 z-30">
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
              <div className="px-4 pt-4">
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
      </div>
    </div>
  )
}