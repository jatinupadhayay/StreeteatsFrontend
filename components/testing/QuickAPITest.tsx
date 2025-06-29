"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export default function QuickAPITest() {
  const [endpoint, setEndpoint] = useState("")
  const [method, setMethod] = useState("GET")
  const [body, setBody] = useState("")
  const [response, setResponse] = useState("")
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const { toast } = useToast()

  const quickTests = [
    {
      name: "Get Vendors",
      endpoint: "/vendors",
      method: "GET",
      body: "",
      action: () => api.vendors.getAll(),
    },
    {
      name: "Get Profile",
      endpoint: "/users/profile",
      method: "GET",
      body: "",
      action: () => api.users.getProfile(),
    },
    {
      name: "Get Orders",
      endpoint: "/orders/customer",
      method: "GET",
      body: "",
      action: () => api.orders.getCustomerOrders(),
    },
    {
      name: "Search Vendors",
      endpoint: "/search/vendors",
      method: "GET",
      body: "",
      action: () => api.search.vendors("pizza"),
    },
  ]

  const runQuickTest = async (test: any) => {
    setLoading(true)
    setEndpoint(test.endpoint)
    setMethod(test.method)
    setBody(test.body)

    try {
      const result = await test.action()
      setResponse(JSON.stringify(result, null, 2))
      setStatus("success")
      toast({
        title: "✅ Test Successful",
        description: `${test.name} completed successfully`,
      })
    } catch (error: any) {
      setResponse(error.message || "Unknown error")
      setStatus("error")
      toast({
        title: "❌ Test Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const runCustomTest = async () => {
    if (!endpoint) {
      toast({
        title: "Missing Endpoint",
        description: "Please enter an endpoint to test",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // This is a simplified custom test - in a real scenario,
      // you'd need to map the endpoint to the appropriate API call
      const result = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("streetEatsToken")}`,
        },
        ...(body && { body }),
      })

      const data = await result.json()
      setResponse(JSON.stringify(data, null, 2))
      setStatus(result.ok ? "success" : "error")

      toast({
        title: result.ok ? "✅ Test Successful" : "❌ Test Failed",
        description: `${method} ${endpoint}`,
        variant: result.ok ? "default" : "destructive",
      })
    } catch (error: any) {
      setResponse(error.message)
      setStatus("error")
      toast({
        title: "❌ Test Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Quick Tests */}
      <Card>
        <CardHeader>
          <CardTitle>Quick API Tests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {quickTests.map((test, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">{test.name}</div>
                <div className="text-sm text-gray-600">
                  <Badge variant="outline" className="mr-2">
                    {test.method}
                  </Badge>
                  {test.endpoint}
                </div>
              </div>
              <Button onClick={() => runQuickTest(test)} disabled={loading} size="sm">
                Test
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Custom Test */}
      <Card>
        <CardHeader>
          <CardTitle>Custom API Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="method">Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="endpoint">Endpoint</Label>
              <Input
                id="endpoint"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="/api/vendors"
              />
            </div>
          </div>

          {(method === "POST" || method === "PUT") && (
            <div>
              <Label htmlFor="body">Request Body (JSON)</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder='{"key": "value"}'
                rows={4}
              />
            </div>
          )}

          <Button onClick={runCustomTest} disabled={loading} className="w-full">
            {loading ? "Testing..." : "Run Test"}
          </Button>
        </CardContent>
      </Card>

      {/* Response */}
      {response && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Response</CardTitle>
              <Badge variant={status === "success" ? "default" : "destructive"}>
                {status === "success" ? "Success" : "Error"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-auto max-h-96">{response}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
