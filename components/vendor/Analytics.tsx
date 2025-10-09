"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useVendorDashboard } from "@/hooks/useApi"

export default function VendorAnalytics() {
  const { data, loading, error } = useVendorDashboard()

  if (loading) return <div className="text-center py-8">Loading analytics...</div>
  if (error) return <div className="text-red-500 p-4">Error: {error.message}</div>
  
  // Prepare data for charts
  const weeklyRevenueData = [
    { day: "Mon", revenue: data?.weeklyStats.revenue ? data.weeklyStats.revenue * 0.2 : 0 },
    { day: "Tue", revenue: data?.weeklyStats.revenue ? data.weeklyStats.revenue * 0.3 : 0 },
    { day: "Wed", revenue: data?.weeklyStats.revenue ? data.weeklyStats.revenue * 0.25 : 0 },
    { day: "Thu", revenue: data?.weeklyStats.revenue ? data.weeklyStats.revenue * 0.15 : 0 },
    { day: "Fri", revenue: data?.weeklyStats.revenue ? data.weeklyStats.revenue * 0.4 : 0 },
    { day: "Sat", revenue: data?.weeklyStats.revenue ? data.weeklyStats.revenue * 0.6 : 0 },
    { day: "Sun", revenue: data?.weeklyStats.revenue ? data.weeklyStats.revenue * 0.7 : 0 },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Today's Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Orders:</strong> {data?.todayStats.orders || 0}</p>
              <p><strong>Revenue:</strong> ₹{data?.todayStats.revenue?.toFixed(2) || "0.00"}</p>
              <p><strong>Avg. Order:</strong> ₹{data?.todayStats.avgOrderValue?.toFixed(2) || "0.00"}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Weekly Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Revenue:</strong> ₹{data?.weeklyStats.revenue?.toFixed(2) || "0.00"}</p>
              <p><strong>Orders:</strong> {data?.weeklyStats.orders || 0}</p>
              <p><strong>Growth:</strong> {data?.weeklyStats.growth?.toFixed(1) || "0.0"}%</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Customer Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Rating:</strong> {data?.customerFeedback.averageRating?.toFixed(1) || "0.0"}/5</p>
              <p><strong>Reviews:</strong> {data?.customerFeedback.totalReviews || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Revenue</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyRevenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip formatter={(value) => [`₹${value}`, "Revenue"]} />
              <Bar dataKey="revenue" fill="#ea580c" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Top Dishes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.topDishes?.length ? data.topDishes.map((dish, index) => (
                <div key={index} className="flex justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">{dish.name}</p>
                    <p className="text-sm text-gray-600">{dish.orders} orders</p>
                  </div>
                  <p className="font-bold">₹{dish.revenue.toFixed(2)}</p>
                </div>
              )) : (
                <p className="text-gray-500">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.customerFeedback?.recentReviews?.length ? 
                data.customerFeedback.recentReviews.map((review, index) => (
                  <div key={index} className="border-b pb-3">
                    <div className="flex justify-between">
                      <p className="font-medium">{review.customer}</p>
                      <div className="flex items-center">
                        <span className="mr-1">{review.rating}</span>
                        <span>★</span>
                      </div>
                    </div>
                    <p className="text-sm mt-1">{review.comment}</p>
                  </div>
                )) : (
                  <p className="text-gray-500">No reviews yet</p>
                )
              }
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}