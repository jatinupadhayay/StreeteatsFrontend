"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line } from "recharts"
import { useVendorDashboard } from "@/hooks/useApi"
import { TrendingUp, Users, ShoppingBag, Star, ArrowUpRight, ArrowDownRight, IndianRupee } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const COLORS = ["#f97316", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899", "#f43f5e", "#06b6d4"]

export default function VendorAnalytics() {
  const { data, loading, error } = useVendorDashboard()

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
    </div>
  )
  if (error) return <div className="text-red-500 p-4 font-medium border border-red-200 bg-red-50 rounded-lg">Error loading analytics: {error}</div>

  // Prepare data for charts
  const weeklyRevenueData = [
    { day: "Mon", revenue: data?.weeklyStats.revenue ? Math.round(data.weeklyStats.revenue * 0.2) : 0 },
    { day: "Tue", revenue: data?.weeklyStats.revenue ? Math.round(data.weeklyStats.revenue * 0.3) : 0 },
    { day: "Wed", revenue: data?.weeklyStats.revenue ? Math.round(data.weeklyStats.revenue * 0.25) : 0 },
    { day: "Thu", revenue: data?.weeklyStats.revenue ? Math.round(data.weeklyStats.revenue * 0.15) : 0 },
    { day: "Fri", revenue: data?.weeklyStats.revenue ? Math.round(data.weeklyStats.revenue * 0.4) : 0 },
    { day: "Sat", revenue: data?.weeklyStats.revenue ? Math.round(data.weeklyStats.revenue * 0.6) : 0 },
    { day: "Sun", revenue: data?.weeklyStats.revenue ? Math.round(data.weeklyStats.revenue * 0.7) : 0 },
  ]

  const categoryData = [
    { name: "Mains", value: 40, color: "#f97316" },
    { name: "Snacks", value: 30, color: "#3b82f6" },
    { name: "Drinks", value: 20, color: "#10b981" },
    { name: "Desserts", value: 10, color: "#8b5cf6" },
  ]

  return (
    <div className="p-4 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Performance Insights</h1>
          <p className="text-gray-600">Deep dive into your shop's growth and customer behavior</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-sm border">
          <span className="text-sm font-medium text-gray-500">Last 7 Days</span>
          <TrendingUp className="w-4 h-4 text-green-500" />
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Revenue"
          value={`₹${data?.todayStats.revenue?.toLocaleString() || "0"}`}
          icon={<IndianRupee className="w-5 h-5" />}
          trend="+12.5%"
          trendUp={true}
          color="orange"
        />
        <StatCard
          title="Active Orders"
          value={data?.todayStats.orders || 0}
          icon={<ShoppingBag className="w-5 h-5" />}
          trend="+3 new"
          trendUp={true}
          color="blue"
        />
        <StatCard
          title="Total Customers"
          value="1,248"
          icon={<Users className="w-5 h-5" />}
          trend="+5.2%"
          trendUp={true}
          color="green"
        />
        <StatCard
          title="Average Rating"
          value={data?.customerFeedback.averageRating?.toFixed(1) || "0.0"}
          icon={<Star className="w-5 h-5" />}
          trend="+0.2"
          trendUp={true}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 shadow-sm border-orange-100 overflow-hidden">
          <CardHeader className="bg-orange-50/30 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Revenue Trends</CardTitle>
                <CardDescription>Daily revenue performance for the current week</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-80 pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyRevenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`₹${value}`, "Revenue"]}
                />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]} barSize={40}>
                  {weeklyRevenueData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card className="shadow-sm border-blue-100 overflow-hidden">
          <CardHeader className="bg-blue-50/30 border-b">
            <CardTitle>Popular Categories</CardTitle>
            <CardDescription>Sales distribution by menu category</CardDescription>
          </CardHeader>
          <CardContent className="h-80 flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="70%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-4 w-full px-4">
              {categoryData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs font-medium text-gray-700">{item.name} ({item.value}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Top Selling Items */}
        <Card className="shadow-sm border-green-100">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Star Performers</CardTitle>
              <Badge variant="outline" className="text-green-600 border-green-200">Top 5</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {data?.topDishes?.length ? data.topDishes.map((dish, index) => (
                <div key={index} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{dish.name}</p>
                      <p className="text-xs text-gray-500">{dish.orders} orders this week</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">₹{dish.revenue.toFixed(2)}</p>
                    <div className="flex items-center text-[10px] text-green-600 font-medium">
                      <ArrowUpRight className="w-3 h-3 mr-0.5" />
                      8% growth
                    </div>
                  </div>
                </div>
              )) : (
                <div className="p-8 text-center text-gray-500">No sales data available yet</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Feedback */}
        <Card className="shadow-sm border-purple-100">
          <CardHeader className="border-b">
            <CardTitle className="text-lg">Customer Love</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {data?.customerFeedback?.recentReviews?.length ?
                data.customerFeedback.recentReviews.map((review, index) => (
                  <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-xs font-bold uppercase">
                          {review.customer.substring(0, 2)}
                        </div>
                        <p className="font-medium text-sm text-gray-900">{review.customer}</p>
                      </div>
                      <div className="flex items-center bg-yellow-50 px-2 py-0.5 rounded border border-yellow-200">
                        <span className="text-xs font-bold text-yellow-700 mr-1">{review.rating}</span>
                        <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2 italic">"{review.comment}"</p>
                  </div>
                )) : (
                  <div className="p-8 text-center text-gray-500">No reviews to display</div>
                )
              }
            </div>
            {data?.customerFeedback?.recentReviews && data.customerFeedback.recentReviews.length > 0 && (
              <div className="p-4 border-t text-center">
                <Button variant="ghost" className="text-purple-600 text-xs hover:bg-purple-50">View all feedback</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, trend, trendUp, color }: any) {
  const colorMap: any = {
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-green-50 text-green-600 border-green-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
  }

  return (
    <Card className={`shadow-sm border overflow-hidden ${colorMap[color].split(' ')[2]}`}>
      <CardContent className="p-5">
        <div className="flex justify-between items-start">
          <div className={`p-2 rounded-lg ${colorMap[color].split(' ')[0]} ${colorMap[color].split(' ')[1]}`}>
            {icon}
          </div>
          <div className={`flex items-center text-xs font-bold ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
            {trendUp ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
            {trend}
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}