"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CheckCircle, XCircle, Clock, Play, RefreshCw } from "lucide-react"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface TestResult {
  endpoint: string
  method: string
  status: "pending" | "success" | "error"
  response?: any
  error?: string
  duration?: number
}

export default function APITestPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const { toast } = useToast()

  const updateTestResult = (endpoint: string, result: Partial<TestResult>) => {
    setTestResults((prev) => prev.map((test) => (test.endpoint === endpoint ? { ...test, ...result } : test)))
  }

  const addTestResult = (test: TestResult) => {
    setTestResults((prev) => [...prev, test])
  }

  const runTest = async (endpoint: string, method: string, testFunction: () => Promise<any>, requiresAuth = true) => {
    const startTime = Date.now()

    addTestResult({
      endpoint,
      method,
      status: "pending",
    })

    try {
      // Check if auth is required and token exists
      if (requiresAuth && !localStorage.getItem("streetEatsToken")) {
        throw new Error("Authentication required - please login first")
      }

      const response = await testFunction()
      const duration = Date.now() - startTime

      updateTestResult(endpoint, {
        status: "success",
        response,
        duration,
      })

      return response
    } catch (error: any) {
      const duration = Date.now() - startTime

      updateTestResult(endpoint, {
        status: "error",
        error: error.message || "Unknown error",
        duration,
      })

      throw error
    }
  }

  // ==================== AUTH TESTS ====================
  const testAuthEndpoints = async () => {
    toast({ title: "🔐 Testing Auth Endpoints..." })

    // Test login (with demo credentials)
    await runTest("/auth/login", "POST", () => api.auth.login("demo@customer.com", "password123", "customer"), false)

    // Test customer registration
    await runTest(
      "/auth/register/customer",
      "POST",
      () =>
        api.auth.registerCustomer({
          name: "Test Customer",
          email: "test@customer.com",
          password: "password123",
          phone: "9876543210",
        }),
      false,
    )

    // Test logout
    await runTest("/auth/logout", "POST", () => api.auth.logout())

    // Test refresh token
    await runTest("/auth/refresh", "POST", () => api.auth.refreshToken())
  }

  // ==================== VENDOR TESTS ====================
  const testVendorEndpoints = async () => {
    toast({ title: "🏪 Testing Vendor Endpoints..." })

    // Get all vendors
    await runTest("/vendors", "GET", () => api.vendors.getAll(), false)

    // Get vendors with filters
    await runTest(
      "/vendors?cuisine=indian",
      "GET",
      () => api.vendors.getAll({ cuisine: "indian", search: "spice" }),
      false,
    )

    // Get single vendor
    await runTest("/vendors/:id", "GET", () => api.vendors.getById("vendor123"))

    // Get vendor dashboard stats
    await runTest("/vendors/dashboard/stats", "GET", () => api.vendors.getDashboardStats())

    // Update vendor profile
    await runTest("/vendors/profile", "PUT", () =>
      api.vendors.updateProfile({
        shopName: "Updated Shop Name",
        description: "Updated description",
      }),
    )

    // Add menu item
    await runTest("/vendors/menu", "POST", () =>
      api.vendors.addMenuItem({
        name: "Test Item",
        description: "Test description",
        price: 100,
        category: "Main Course",
        isVeg: true,
      }),
    )

    // Toggle vendor status
    await runTest("/vendors/toggle-status", "PUT", () => api.vendors.toggleStatus())
  }

  // ==================== ORDER TESTS ====================
  const testOrderEndpoints = async () => {
    toast({ title: "📦 Testing Order Endpoints..." })

    // Create order
    await runTest("/orders", "POST", () =>
      api.orders.create({
        vendorId: "vendor123",
        items: [{ id: "item1", name: "Test Item", quantity: 2, price: 100 }],
        deliveryAddress: {
          street: "123 Test Street",
          city: "Test City",
          pincode: "123456",
        },
        paymentMethod: "online",
      }),
    )

    // Get customer orders
    await runTest("/orders/customer", "GET", () => api.orders.getCustomerOrders())

    // Get vendor orders
    await runTest("/orders/vendor", "GET", () => api.orders.getVendorOrders())

    // Get delivery orders
    await runTest("/orders/delivery", "GET", () => api.orders.getDeliveryOrders())

    // Update order status
    await runTest("/orders/:id/status", "PUT", () => api.orders.updateStatus("order123", "preparing"))

    // Accept delivery
    await runTest("/orders/:id/accept-delivery", "PUT", () => api.orders.acceptDelivery("order123"))

    // Rate order
    await runTest("/orders/:id/rate", "PUT", () =>
      api.orders.rateOrder("order123", {
        overall: 5,
        food: 5,
        delivery: 4,
        review: "Great food!",
      }),
    )

    // Get single order
    await runTest("/orders/:id", "GET", () => api.orders.getById("order123"))
  }

  // ==================== USER TESTS ====================
  const testUserEndpoints = async () => {
    toast({ title: "👤 Testing User Endpoints..." })

    // Get user profile
    await runTest("/users/profile", "GET", () => api.users.getProfile())

    // Update user profile
    await runTest("/users/profile", "PUT", () =>
      api.users.updateProfile({
        name: "Updated Name",
        phone: "9876543210",
      }),
    )

    // Add address
    await runTest("/users/addresses", "POST", () =>
      api.users.addAddress({
        label: "Home",
        street: "123 Test Street",
        city: "Test City",
        pincode: "123456",
      }),
    )

    // Get addresses
    await runTest("/users/addresses", "GET", () => api.users.getAddresses())

    // Update address
    await runTest("/users/addresses/:id", "PUT", () =>
      api.users.updateAddress("address123", {
        label: "Updated Home",
        street: "456 Updated Street",
      }),
    )

    // Delete address
    await runTest("/users/addresses/:id", "DELETE", () => api.users.deleteAddress("address123"))
  }

  // ==================== DELIVERY TESTS ====================
  const testDeliveryEndpoints = async () => {
    toast({ title: "🚚 Testing Delivery Endpoints..." })

    // Get delivery dashboard
    await runTest("/delivery/dashboard", "GET", () => api.delivery.getDashboard())

    // Update availability
    await runTest("/delivery/availability", "PUT", () => api.delivery.updateAvailability(true))

    // Update location
    await runTest("/delivery/location", "PUT", () => api.delivery.updateLocation([19.076, 72.8777]))

    // Get earnings
    await runTest("/delivery/earnings", "GET", () => api.delivery.getEarnings())

    // Get earnings by period
    await runTest("/delivery/earnings?period=week", "GET", () => api.delivery.getEarnings("week"))
  }

  // ==================== PAYMENT TESTS ====================
  const testPaymentEndpoints = async () => {
    toast({ title: "💳 Testing Payment Endpoints..." })

    // Create payment order
    await runTest("/payments/create-order", "POST", () => api.payments.createOrder(500, "order123"))

    // Verify payment (mock data)
    await runTest("/payments/verify", "POST", () =>
      api.payments.verifyPayment({
        razorpay_order_id: "order_test123",
        razorpay_payment_id: "pay_test123",
        razorpay_signature: "signature_test123",
        orderId: "order123",
      }),
    )

    // Get payment history
    await runTest("/payments/history", "GET", () => api.payments.getHistory())
  }

  // ==================== ANALYTICS TESTS ====================
  const testAnalyticsEndpoints = async () => {
    toast({ title: "📊 Testing Analytics Endpoints..." })

    // Get vendor analytics
    await runTest("/analytics/vendor", "GET", () => api.analytics.getVendorAnalytics())

    // Get delivery analytics
    await runTest("/analytics/delivery", "GET", () => api.analytics.getDeliveryAnalytics())

    // Get customer analytics
    await runTest("/analytics/customer", "GET", () => api.analytics.getCustomerAnalytics())
  }

  // ==================== REVIEW TESTS ====================
  const testReviewEndpoints = async () => {
    toast({ title: "⭐ Testing Review Endpoints..." })

    // Get vendor reviews
    await runTest("/reviews/vendor/:id", "GET", () => api.reviews.getVendorReviews("vendor123"))

    // Add review
    await runTest("/reviews", "POST", () =>
      api.reviews.addReview({
        orderId: "order123",
        vendorId: "vendor123",
        rating: 5,
        comment: "Excellent food!",
      }),
    )

    // Reply to review
    await runTest("/reviews/:id/reply", "POST", () =>
      api.reviews.replyToReview("review123", "Thank you for your feedback!"),
    )
  }

  // ==================== NOTIFICATION TESTS ====================
  const testNotificationEndpoints = async () => {
    toast({ title: "🔔 Testing Notification Endpoints..." })

    // Get notifications
    await runTest("/notifications", "GET", () => api.notifications.getAll())

    // Mark as read
    await runTest("/notifications/:id/read", "PUT", () => api.notifications.markAsRead("notif123"))

    // Mark all as read
    await runTest("/notifications/mark-all-read", "PUT", () => api.notifications.markAllAsRead())

    // Delete notification
    await runTest("/notifications/:id", "DELETE", () => api.notifications.delete("notif123"))
  }

  // ==================== SEARCH TESTS ====================
  const testSearchEndpoints = async () => {
    toast({ title: "🔍 Testing Search Endpoints..." })

    // Global search
    await runTest("/search", "GET", () => api.search.global("pizza"), false)

    // Search vendors
    await runTest("/search/vendors", "GET", () => api.search.vendors("indian food"), false)

    // Search menu items
    await runTest("/search/menu-items", "GET", () => api.search.menuItems("biryani"), false)
  }

  // ==================== UPLOAD TESTS ====================
  const testUploadEndpoints = async () => {
    toast({ title: "📁 Testing Upload Endpoints..." })

    // Create a mock file for testing
    const mockFile = new File(["test content"], "test.jpg", { type: "image/jpeg" })

    // Upload single file
    await runTest("/upload/single", "POST", () => api.upload.uploadFile(mockFile, "menu"))

    // Upload multiple files
    await runTest("/upload/multiple", "POST", () => api.upload.uploadFiles([mockFile], "documents"))
  }

  // ==================== RUN ALL TESTS ====================
  const runAllTests = async () => {
    setIsRunning(true)
    setTestResults([])

    try {
      await testAuthEndpoints()
      await testVendorEndpoints()
      await testOrderEndpoints()
      await testUserEndpoints()
      await testDeliveryEndpoints()
      await testPaymentEndpoints()
      await testAnalyticsEndpoints()
      await testReviewEndpoints()
      await testNotificationEndpoints()
      await testSearchEndpoints()
      await testUploadEndpoints()

      toast({
        title: "✅ All Tests Completed!",
        description: "Check the results below",
      })
    } catch (error) {
      toast({
        title: "❌ Testing Error",
        description: "Some tests failed. Check the results.",
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />
    }
  }

  const getStatusBadge = (status: TestResult["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      case "success":
        return <Badge className="bg-green-100 text-green-800">Success</Badge>
      case "error":
        return <Badge variant="destructive">Error</Badge>
    }
  }

  const successCount = testResults.filter((t) => t.status === "success").length
  const errorCount = testResults.filter((t) => t.status === "error").length
  const pendingCount = testResults.filter((t) => t.status === "pending").length

  return (
    <div className="min-h-screen bg-orange-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🧪 API Endpoint Testing Suite</h1>
          <p className="text-gray-600">Comprehensive testing of all Street Eats API endpoints from the frontend</p>
        </div>

        {/* Test Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Test Controls</CardTitle>
            <CardDescription>Run individual test suites or all tests at once</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 mb-4">
              <Button onClick={runAllTests} disabled={isRunning} className="bg-orange-500 hover:bg-orange-600">
                {isRunning ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                Run All Tests
              </Button>
              <Button onClick={testAuthEndpoints} variant="outline" disabled={isRunning}>
                Auth Tests
              </Button>
              <Button onClick={testVendorEndpoints} variant="outline" disabled={isRunning}>
                Vendor Tests
              </Button>
              <Button onClick={testOrderEndpoints} variant="outline" disabled={isRunning}>
                Order Tests
              </Button>
              <Button onClick={testUserEndpoints} variant="outline" disabled={isRunning}>
                User Tests
              </Button>
              <Button onClick={testDeliveryEndpoints} variant="outline" disabled={isRunning}>
                Delivery Tests
              </Button>
            </div>

            {/* Test Summary */}
            {testResults.length > 0 && (
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{testResults.length}</div>
                  <div className="text-sm text-blue-600">Total Tests</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{successCount}</div>
                  <div className="text-sm text-green-600">Passed</div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">{errorCount}</div>
                  <div className="text-sm text-red-600">Failed</div>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
                  <div className="text-sm text-yellow-600">Pending</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Results */}
        {testResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>Detailed results for each API endpoint test</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {testResults.map((result, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(result.status)}
                          <span className="font-mono text-sm">{result.method}</span>
                          <span className="font-medium">{result.endpoint}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {result.duration && <span className="text-xs text-gray-500">{result.duration}ms</span>}
                          {getStatusBadge(result.status)}
                        </div>
                      </div>

                      {result.error && (
                        <div className="bg-red-50 border border-red-200 rounded p-2 mb-2">
                          <p className="text-red-800 text-sm">{result.error}</p>
                        </div>
                      )}

                      {result.response && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                            View Response
                          </summary>
                          <pre className="mt-2 bg-gray-50 p-2 rounded text-xs overflow-auto max-h-32">
                            {JSON.stringify(result.response, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Before Testing:</h4>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• Make sure your backend server is running</li>
                <li>• Update API_BASE_URL in lib/api.ts if needed</li>
                <li>• Some tests require authentication - login first</li>
                <li>• Database should be connected and seeded</li>
              </ul>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Test Coverage:</h4>
              <ul className="text-green-700 text-sm space-y-1">
                <li>• Authentication (login, register, logout)</li>
                <li>• Vendor management (CRUD operations)</li>
                <li>• Order processing (create, update, track)</li>
                <li>• User profile management</li>
                <li>• Delivery partner operations</li>
                <li>• Payment processing</li>
                <li>• Analytics and reporting</li>
                <li>• Reviews and ratings</li>
                <li>• Notifications</li>
                <li>• Search functionality</li>
                <li>• File uploads</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
