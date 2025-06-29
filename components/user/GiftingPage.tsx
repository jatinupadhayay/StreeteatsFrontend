"use client"

import { useState } from "react"
import { Gift, Send, Users, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

const giftableItems = [
  {
    id: 1,
    name: "Pani Puri Treat",
    description: "8 pieces of delicious pani puri",
    price: 60,
    points: 120,
    image: "/placeholder.svg?height=80&width=80",
    vendor: "Spice Street Corner",
  },
  {
    id: 2,
    name: "Chai & Samosa Combo",
    description: "Hot chai with crispy samosas",
    price: 40,
    points: 80,
    image: "/placeholder.svg?height=80&width=80",
    vendor: "Tea Junction",
  },
  {
    id: 3,
    name: "Street Food Voucher",
    description: "₹100 voucher for any vendor",
    price: 100,
    points: 200,
    image: "/placeholder.svg?height=80&width=80",
    vendor: "Any Vendor",
  },
]

const recentGifts = [
  {
    id: 1,
    type: "sent",
    item: "Pani Puri Treat",
    recipient: "Priya Sharma",
    date: "2024-01-15",
    status: "delivered",
  },
  {
    id: 2,
    type: "received",
    item: "Chai & Samosa Combo",
    sender: "Rahul Kumar",
    date: "2024-01-14",
    status: "redeemed",
  },
]

export default function GiftingPage() {
  const [selectedGift, setSelectedGift] = useState<number | null>(null)
  const [recipientPhone, setRecipientPhone] = useState("")
  const [giftMessage, setGiftMessage] = useState("")
  const [pointsToGift, setPointsToGift] = useState("")
  const { toast } = useToast()

  const handleSendGift = () => {
    if (!selectedGift || !recipientPhone) {
      toast({
        title: "Missing Information",
        description: "Please select a gift and enter recipient's phone number",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Gift Sent! 🎁",
      description: "Your gift has been sent successfully",
    })

    // Reset form
    setSelectedGift(null)
    setRecipientPhone("")
    setGiftMessage("")
  }

  const handleSendPoints = () => {
    if (!pointsToGift || !recipientPhone) {
      toast({
        title: "Missing Information",
        description: "Please enter points amount and recipient's phone number",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Points Sent! ⭐",
      description: `${pointsToGift} points sent successfully`,
    })

    setPointsToGift("")
    setRecipientPhone("")
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center">
          <Gift className="w-8 h-8 mr-3 text-orange-500" />
          Gifting & Sharing
        </h1>
        <p className="text-gray-600">Share the joy of street food with friends and family</p>
      </div>

      <Tabs defaultValue="send-food" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="send-food">Send Food</TabsTrigger>
          <TabsTrigger value="send-points">Send Points</TabsTrigger>
          <TabsTrigger value="history">Gift History</TabsTrigger>
        </TabsList>

        <TabsContent value="send-food" className="space-y-6">
          {/* Gift Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Choose a Gift</CardTitle>
              <CardDescription>Select a delicious treat to send to your friend</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {giftableItems.map((item) => (
                  <div
                    key={item.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedGift === item.id
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 hover:border-orange-300"
                    }`}
                    onClick={() => setSelectedGift(item.id)}
                  >
                    <div className="flex items-center space-x-4">
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">{item.vendor}</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-orange-600">₹{item.price}</span>
                            <Badge variant="outline">{item.points} points</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recipient Details */}
          <Card>
            <CardHeader>
              <CardTitle>Send To</CardTitle>
              <CardDescription>Enter recipient details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recipient's Phone Number</label>
                <Input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gift Message (Optional)</label>
                <Input
                  placeholder="Hope you enjoy this delicious treat! 😊"
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                />
              </div>
              <Button
                onClick={handleSendGift}
                className="w-full bg-orange-500 hover:bg-orange-600"
                disabled={!selectedGift || !recipientPhone}
              >
                <Send className="w-4 h-4 mr-2" />
                Send Gift
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="send-points" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Share Points</CardTitle>
              <CardDescription>Send loyalty points to friends and family</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Your Available Points</span>
                  <span className="text-2xl font-bold text-orange-600">1,250</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Points to Send</label>
                <Input
                  type="number"
                  placeholder="Enter points amount"
                  value={pointsToGift}
                  onChange={(e) => setPointsToGift(e.target.value)}
                  max="1250"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recipient's Phone Number</label>
                <Input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                />
              </div>

              <Button
                onClick={handleSendPoints}
                className="w-full bg-orange-500 hover:bg-orange-600"
                disabled={!pointsToGift || !recipientPhone}
              >
                <Star className="w-4 h-4 mr-2" />
                Send Points
              </Button>
            </CardContent>
          </Card>

          {/* Points Packages */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Send Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {[100, 250, 500].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    className="h-16 flex flex-col items-center justify-center"
                    onClick={() => setPointsToGift(amount.toString())}
                  >
                    <Star className="w-5 h-5 mb-1 text-orange-500" />
                    <span className="font-bold">{amount}</span>
                    <span className="text-xs">Points</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold mb-2">Gift History</h3>
            <p className="text-gray-600">Track your sent and received gifts</p>
          </div>

          {recentGifts.map((gift) => (
            <Card key={gift.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        gift.type === "sent" ? "bg-orange-100" : "bg-green-100"
                      }`}
                    >
                      {gift.type === "sent" ? (
                        <Send className="w-5 h-5 text-orange-600" />
                      ) : (
                        <Gift className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium">{gift.item}</h4>
                      <p className="text-sm text-gray-600">
                        {gift.type === "sent" ? `To: ${gift.recipient}` : `From: ${gift.sender}`}
                      </p>
                      <p className="text-xs text-gray-500">{gift.date}</p>
                    </div>
                  </div>
                  <Badge
                    className={
                      gift.status === "delivered" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                    }
                  >
                    {gift.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Social Sharing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Share Street Eats
          </CardTitle>
          <CardDescription>Invite friends and earn bonus points</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Referral Bonus</h4>
              <p className="text-sm text-gray-600 mb-3">
                Invite friends to Street Eats and both of you get 100 bonus points when they place their first order!
              </p>
              <div className="flex space-x-2">
                <Button size="sm" className="bg-green-500 hover:bg-green-600">
                  Share on WhatsApp
                </Button>
                <Button size="sm" variant="outline">
                  Copy Referral Link
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
