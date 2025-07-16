"use client"

import { useState } from "react"
import { Store, Package, BarChart3, Settings, Bell } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Navbar from "@/components/common/Navbar"
import MenuManager from "./MenuManager"
import OrderManager from "./OrderManager"
import Analytics from "./Analytics"
import Promotions from "./Promotions"
import VendorPage from "./VendorProfile"
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
    { id: "profile", label: "Profile", icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-orange-50">
      {/* Updated Navbar usage */}
      <Navbar 
        title="Vendor Dashboard" 
        showNotifications={true}
      />

      {/* Connection Status - Now placed below Navbar */}
      <div className="bg-white border-b px-4 py-2">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
            <span className="text-sm text-gray-600">
              {isConnected ? "Connected - Real-time updates active" : "Disconnected - Reconnecting..."}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            {/* You'll need to pass this count from OrderManager */}
            {/* {pendingOrdersCount} pending orders */}
          </div>
        </div>
      </div>

      {/* Rest of your dashboard content remains the same */}
      <div className="max-w-7xl mx-auto">
        <ErrorBoundary>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Mobile Bottom Navigation */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-40">
            <TabsList className="grid w-full grid-cols-5 h-16 bg-white">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex flex-col items-center justify-center space-y-1 data-[state=active]:text-orange-600"
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="text-xs">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Desktop Side Navigation */}
          <div className="hidden md:flex">
            <div className="w-64 bg-white shadow-lg min-h-screen">
              <TabsList className="flex flex-col w-full h-auto bg-transparent p-4 space-y-2">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="w-full justify-start p-3 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-600"
                  >
                    <tab.icon className="w-5 h-5 mr-3" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="flex-1">
              <TabsContent value="orders" className="m-0">
                <OrderManager />
              </TabsContent>
              <TabsContent value="menu" className="m-0">
                <MenuManager />
              </TabsContent>
              <TabsContent value="analytics" className="m-0">
                <Analytics />
              </TabsContent>
              <TabsContent value="promotions" className="m-0">
                <Promotions />
              </TabsContent>
              <TabsContent value="profile" className="m-0">
                <VendorPage />
              </TabsContent>
            </div>
          </div>

          {/* Mobile Content */}
          <div className="md:hidden pb-20">
            <TabsContent value="orders" className="m-0">
              <OrderManager />
            </TabsContent>
            <TabsContent value="menu" className="m-0">
              <MenuManager />
            </TabsContent>
            <TabsContent value="analytics" className="m-0">
              <Analytics />
            </TabsContent>
            <TabsContent value="promotions" className="m-0">
              <Promotions />
            </TabsContent>
            <TabsContent value="profile" className="m-0">
              <VendorPage />
            </TabsContent>
          </div>
        </Tabs>
        </ErrorBoundary>
      </div>
    </div>
  )
}