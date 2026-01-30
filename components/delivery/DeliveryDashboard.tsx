"use client"

import { useState } from "react"
import { Package, CheckCircle, DollarSign, TrendingUp, Loader2, Clock } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Navbar from "@/components/common/Navbar"
import DeliveryTaskCard from "./DeliveryTaskCard"
import DeliveryHistory from "./DeliveryHistory"
import { useEffect, useCallback } from "react"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export default function DeliveryDashboard() {
  const [activeTab, setActiveTab] = useState("tasks")
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<string | null>(null)
  const [stats, setStats] = useState({
    activeTasks: 0,
    completedToday: 0,
    todayEarnings: 0,
    rating: 4.8
  })
  const { toast } = useToast()

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [tasksRes, dashboardRes] = await Promise.all([
        api.orders.getDeliveryOrders({ status: "all" }),
        api.delivery.getDashboard()
      ])

      if (tasksRes.orders) {
        setTasks(tasksRes.orders)
      }

      if (dashboardRes.success) {
        setStats({
          activeTasks: dashboardRes.stats?.activeDeliveries || 0,
          completedToday: dashboardRes.stats?.todayDeliveries || 0,
          todayEarnings: dashboardRes.stats?.todayEarnings || 0,
          rating: dashboardRes.stats?.rating || 4.8
        })
        setStatus(dashboardRes.deliveryPartner?.status || "approved")
      }
    } catch (error) {
      console.error("Failed to fetch delivery data:", error)
      toast({ title: "Error", description: "Failed to load dashboard data", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const tabs = [
    { id: "tasks", label: "Active Tasks", icon: Package },
    { id: "history", label: "History", icon: CheckCircle },
    { id: "earnings", label: "Earnings", icon: DollarSign },
  ]

  return (
    <div className="min-h-screen bg-orange-50">
      <Navbar title="Delivery Dashboard" showNotifications={false} />

      <div className="max-w-7xl mx-auto">
        {status === "pending" ? (
          <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
            <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mb-6">
              <Clock className="w-12 h-12 text-orange-600 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Under Verification</h2>
            <p className="text-gray-600 max-w-md mx-auto mb-8">
              Welcome to the Aahar delivery team! Your documents (License, Aadhar, etc.) are currently being verified by our operations team.
            </p>
            <div className="bg-white p-6 rounded-xl border border-orange-100 shadow-sm max-w-sm w-full">
              <h3 className="font-semibold text-orange-800 mb-4">Verification Steps</h3>
              <div className="space-y-4 text-sm text-left">
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-4 h-4 mr-2" /> Application Submitted
                </div>
                <div className="flex items-center text-orange-500 font-medium">
                  <Clock className="w-4 h-4 mr-2" /> Document Verification (In Progress)
                </div>
                <div className="flex items-center text-gray-400">
                  <Package className="w-4 h-4 mr-2" /> Ready for Deliveries
                </div>
              </div>
            </div>
            <Button variant="outline" className="mt-8" onClick={() => window.location.reload()}>
              Refresh Status
            </Button>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Mobile Bottom Navigation */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-40">
              <TabsList className="grid w-full grid-cols-3 h-16 bg-white">
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
                {loading ? (
                  <div className="flex items-center justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                  </div>
                ) : (
                  <>
                    <TabsContent value="tasks" className="m-0">
                      <DeliveryTasks tasks={tasks} stats={stats} onRefresh={fetchData} />
                    </TabsContent>
                    <TabsContent value="history" className="m-0">
                      <DeliveryHistory />
                    </TabsContent>
                    <TabsContent value="earnings" className="m-0">
                      <EarningsPage />
                    </TabsContent>
                  </>
                )}
              </div>
            </div>

            {/* Mobile Content */}
            <div className="md:hidden pb-20">
              {loading ? (
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                </div>
              ) : (
                <>
                  <TabsContent value="tasks" className="m-0">
                    <DeliveryTasks tasks={tasks} stats={stats} onRefresh={fetchData} />
                  </TabsContent>
                  <TabsContent value="history" className="m-0">
                    <DeliveryHistory />
                  </TabsContent>
                  <TabsContent value="earnings" className="m-0">
                    <EarningsPage />
                  </TabsContent>
                </>
              )}
            </div>
          </Tabs>
        )}
      </div>
    </div>
  )
}

function DeliveryTasks({ tasks, stats, onRefresh }: { tasks: any[], stats: any, onRefresh: () => void }) {
  const activeTasks = tasks.filter(t => !["delivered", "cancelled", "rejected"].includes(t.status))

  return (
    <div className="p-4 space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 text-center shadow-md">
          <div className="text-2xl font-bold text-orange-600">{stats.activeTasks}</div>
          <div className="text-sm text-gray-600">Active Tasks</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow-md">
          <div className="text-2xl font-bold text-green-600">{stats.completedToday}</div>
          <div className="text-sm text-gray-600">Completed Today</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow-md">
          <div className="text-2xl font-bold text-blue-600">₹{stats.todayEarnings}</div>
          <div className="text-sm text-gray-600">Today's Earnings</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow-md">
          <div className="text-2xl font-bold text-purple-600">{stats.rating}</div>
          <div className="text-sm text-gray-600">Rating</div>
        </div>
      </div>

      {/* Active Tasks */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Active Delivery Tasks</h2>

        {activeTasks.map((task) => (
          <DeliveryTaskCard key={task.id} task={{
            id: task.id || task._id,
            vendor: task.vendor?.shopName || "Vendor",
            customer: task.customer?.name || "Customer",
            phone: task.customer?.phone || "N/A",
            address: task.deliveryAddress ? `${task.deliveryAddress.street}, ${task.deliveryAddress.city}` : "N/A",
            items: (task.items || []).map((i: any) => i.name),
            total: task.pricing?.total || 0,
            distance: "Nearby",
            estimatedTime: task.estimatedDeliveryTime || "20 mins",
            status: task.status === "ready" ? "assigned" : (task.status === "picked_up" ? "picked" : "on_way"),
            orderTime: new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          } as any} onUpdate={onRefresh} />
        ))}

        {activeTasks.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Tasks</h3>
            <p className="text-gray-600">New delivery tasks will appear here when assigned</p>
          </div>
        )}
      </div>
    </div>
  )
}

function EarningsPage() {
  const earningsData = {
    today: 320,
    week: 2240,
    month: 9680,
    totalDeliveries: 156,
    avgEarningPerDelivery: 62,
    bonusEarnings: 450,
  }

  const weeklyBreakdown = [
    { day: "Mon", earnings: 280, deliveries: 5 },
    { day: "Tue", earnings: 340, deliveries: 6 },
    { day: "Wed", earnings: 420, deliveries: 8 },
    { day: "Thu", earnings: 380, deliveries: 7 },
    { day: "Fri", earnings: 460, deliveries: 9 },
    { day: "Sat", earnings: 520, deliveries: 10 },
    { day: "Sun", earnings: 320, deliveries: 6 },
  ]

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Earnings Overview</h1>
        <p className="text-gray-600">Track your delivery earnings and performance</p>
      </div>

      {/* Earnings Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium mb-2">Today's Earnings</h3>
                <p className="text-3xl font-bold">₹{earningsData.today}</p>
                <p className="text-green-100 text-sm">8 deliveries completed</p>
              </div>
              <DollarSign className="w-12 h-12 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium mb-2">This Week</h3>
                <p className="text-3xl font-bold">₹{earningsData.week}</p>
                <p className="text-blue-100 text-sm">36 deliveries completed</p>
              </div>
              <TrendingUp className="w-12 h-12 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium mb-2">This Month</h3>
                <p className="text-3xl font-bold">₹{earningsData.month}</p>
                <p className="text-purple-100 text-sm">156 deliveries completed</p>
              </div>
              <Package className="w-12 h-12 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Breakdown</CardTitle>
          <CardDescription>Your daily earnings and delivery count this week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {weeklyBreakdown.map((day) => (
              <div key={day.day} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="font-bold text-orange-600">{day.day}</span>
                  </div>
                  <div>
                    <p className="font-medium">₹{day.earnings}</p>
                    <p className="text-sm text-gray-600">{day.deliveries} deliveries</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Avg per delivery</p>
                  <p className="font-medium">₹{Math.round(day.earnings / day.deliveries)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Average per Delivery</span>
              <span className="font-bold text-green-600">₹{earningsData.avgEarningPerDelivery}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Deliveries</span>
              <span className="font-bold">{earningsData.totalDeliveries}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Bonus Earnings</span>
              <span className="font-bold text-purple-600">₹{earningsData.bonusEarnings}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tips & Bonuses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Customer Tips</h4>
              <p className="text-2xl font-bold text-green-600">₹125</p>
              <p className="text-sm text-green-600">This week</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-800 mb-2">Performance Bonus</h4>
              <p className="text-2xl font-bold text-purple-600">₹200</p>
              <p className="text-sm text-purple-600">This month</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
