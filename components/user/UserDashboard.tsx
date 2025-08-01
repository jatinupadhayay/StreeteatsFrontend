"use client"

import { useState } from "react"
import {
  MapPin, ShoppingCart, User, Gift, Star, Store
} from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Navbar from "@/components/common/Navbar"
import HomePage from "./HomePage"
import ProfilePage from "./ProfilePage"
import OrdersPage from "./OrdersPage"
import LoyaltyPage from "./LoyaltyPage"
import GiftingPage from "./GiftingPage"
import VendorsPage from "@/app/vendors/page"  // ✅ Import correctly
import CartDrawer from "./CartDrawer"
import BottomTab from "../ui/BottomTab"

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState("home")

  const tabs = [
    { id: "home", label: "Home", icon: MapPin },
    { id: "vendors", label: "Vendors", icon: Store }, // ✅ Valid icon
    { id: "orders", label: "Orders", icon: ShoppingCart },
    { id: "loyalty", label: "Rewards", icon: Star },
    { id: "gifts", label: "Gifts", icon: Gift },
    { id: "profile", label: "Profile", icon: User },
  ]

  const renderTabsContent = () => (
    <>
      <TabsContent value="home" className="m-0">
        <HomePage />
      </TabsContent>
      <TabsContent value="vendors" className="m-0">
        <VendorsPage />
      </TabsContent>
      <TabsContent value="orders" className="m-0">
        <OrdersPage />
      </TabsContent>
      <TabsContent value="loyalty" className="m-0">
        <LoyaltyPage />
      </TabsContent>
      <TabsContent value="gifts" className="m-0">
        <GiftingPage />
      </TabsContent>
      <TabsContent value="profile" className="m-0">
        <ProfilePage />
      </TabsContent>
    </>
  )

  return (
    <div className="min-h-screen bg-orange-50">
      <Navbar title="Street Eats" />
      <CartDrawer />

      <div className="max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Mobile Bottom Navigation */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-40">
            <TabsList className="grid w-full grid-cols-6 h-16 bg-white">
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

            <div className="flex-1">{renderTabsContent()}</div>
          </div>

          {/* Mobile Content with bottom space for navbar */}
          <div className="md:hidden pb-24">{renderTabsContent()}</div>
        </Tabs>
      </div>
      
    </div>
    
  )
}
