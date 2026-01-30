"use client"
import { useEffect, useState } from "react"
import { Gift, Star, Trophy, Zap, Crown, Utensils, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/AuthContext"

export const dynamic = "force-dynamic"

const userLoyalty = {
  currentPoints: 1250,
  totalEarned: 3450,
  level: "Gold",
  nextLevel: "Platinum",
  pointsToNextLevel: 750,
  multiplier: 2,
}

export default function LoyaltyPage() {
  // ✅ All hooks inside the component
  const [giftHistory, setGiftHistory] = useState<any[]>([])
  const [showGiftDialog, setShowGiftDialog] = useState(false)
  const [selectedReward, setSelectedReward] = useState<any>(null)
  const [recipientEmail, setRecipientEmail] = useState("")
  const [recipientMessage, setRecipientMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [mounted, setMounted] = useState(false)

  const { user } = useAuth()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  if (!user) {

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Aahar Rewards</h1>
          <p className="text-gray-600">Earn points with every order and unlock amazing rewards!</p>
        </div>

        {/* Points Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <Zap className="w-5 h-5 mr-2" />
                Current Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{userLoyalty.currentPoints.toLocaleString()}</div>
              <p className="text-orange-100 text-sm">Ready to redeem</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                {getLevelIcon(userLoyalty.level)}
                <span className="ml-2">{userLoyalty.level} Member</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress to {userLoyalty.nextLevel}</span>
                  <span>{userLoyalty.pointsToNextLevel} points to go</span>
                </div>
                <Progress value={levelProgress} className="h-2" />
                <p className="text-sm text-gray-600">{userLoyalty.multiplier}x points multiplier</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <Trophy className="w-5 h-5 mr-2 text-green-500" />
                Total Earned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{userLoyalty.totalEarned.toLocaleString()}</div>
              <p className="text-gray-600 text-sm">Lifetime points</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="rewards" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="rewards">Available Rewards</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            <TabsTrigger value="gifts">Gift History</TabsTrigger>
          </TabsList>

          <TabsContent value="rewards" className="space-y-6">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {["All", "Food", "Discount", "Service"].map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>

            {/* Rewards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRewards.map((reward) => (
                <Card key={reward.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <Badge
                        className={
                          reward.category === "Food"
                            ? "bg-green-100 text-green-800"
                            : reward.category === "Discount"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-purple-100 text-purple-800"
                        }
                      >
                        {reward.category}
                      </Badge>
                      <div className="flex items-center text-orange-600 font-bold">
                        <Star className="w-4 h-4 mr-1" />
                        {reward.points}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <img
                        src={reward.image || "/placeholder.svg"}
                        alt={reward.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">{reward.title}</h3>
                        <p className="text-sm text-gray-600 mb-1">{reward.description}</p>
                        <p className="text-xs text-gray-500">Valid at {reward.vendor}</p>
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      disabled={userLoyalty.currentPoints < reward.points}
                      variant={userLoyalty.currentPoints >= reward.points ? "default" : "outline"}
                      onClick={() => {
                        if (userLoyalty.currentPoints >= reward.points) {
                          // Open gift dialog
                          setSelectedReward(reward)
                          setShowGiftDialog(true)
                        }
                      }}
                    >
                      {userLoyalty.currentPoints >= reward.points ? (
                        <>
                          <Gift className="w-4 h-4 mr-2" />
                          Send as Gift
                        </>
                      ) : (
                        `Need ${reward.points - userLoyalty.currentPoints} more points`
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>

            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <Card key={index}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        {activity.action.includes("Earned") ? (
                          <Zap className="w-5 h-5 text-orange-600" />
                        ) : activity.action.includes("Redeemed") ? (
                          <Gift className="w-5 h-5 text-green-600" />
                        ) : (
                          <Trophy className="w-5 h-5 text-purple-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{activity.action}</p>
                        <p className="text-sm text-gray-600">{activity.description}</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">{activity.date}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="gifts" className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Gift History</h2>
            {giftHistory.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8 text-gray-500">
                  <Gift className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No gifts sent yet</p>
                  <p className="text-sm mt-2">Send food as a gift to your friends!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {giftHistory.map((gift, idx) => (
                  <Card key={idx}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{gift.rewardName}</p>
                          <p className="text-sm text-gray-600">To: {gift.recipientEmail}</p>
                          <p className="text-xs text-gray-500 mt-1">{gift.date}</p>
                        </div>
                        <Badge className={gift.status === "delivered" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                          {gift.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Gift Dialog */}
        <Dialog open={showGiftDialog} onOpenChange={setShowGiftDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Food as Gift</DialogTitle>
              <DialogDescription>
                Order food for your friend! Enter their email and we'll deliver to their address.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedReward && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium">{selectedReward.title}</p>
                  <p className="text-sm text-gray-600">{selectedReward.description}</p>
                  <p className="text-xs text-gray-500 mt-1">Cost: {selectedReward.points} points</p>
                </div>
              )}

              <div>
                <Label htmlFor="recipient-email">Recipient Email</Label>
                <Input
                  id="recipient-email"
                  type="email"
                  placeholder="friend@example.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="message">Message (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Add a personal message..."
                  value={recipientMessage}
                  onChange={(e) => setRecipientMessage(e.target.value)}
                  rows={3}
                />
              </div>

              <Button
                className="w-full"
                onClick={async () => {
                  if (!recipientEmail) {
                    return
                  }

                  setLoading(true)
                  try {
                    // Check if user exists
                    const checkResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/users/check-email`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("streetEatsToken")}`,
                      },
                      body: JSON.stringify({ email: recipientEmail }),
                    })

                    const checkData = await checkResponse.json()

                    if (!checkData.exists) {
                      alert(`${recipientEmail} is not registered. They need to join Aahar first.`)
                      setLoading(false)
                      return
                    }

                    // Create gift order
                    const orderResponse = await api.orders.create({
                      vendorId: selectedReward.vendorId || "vendor-id",
                      items: [{
                        menuItemId: selectedReward.menuItemId || "item-id",
                        name: selectedReward.title,
                        price: 0, // Free gift
                        quantity: 1,
                      }],
                      orderType: "delivery",
                      paymentMethod: "gift",
                      recipientEmail: recipientEmail,
                      giftMessage: recipientMessage,
                      deliveryAddress: checkData.user.address || {},
                    })

                    if (orderResponse.success) {
                      setGiftHistory(prev => [{
                        rewardName: selectedReward.title,
                        recipientEmail: recipientEmail,
                        date: new Date().toLocaleDateString(),
                        status: "pending",
                      }, ...prev])

                      setShowGiftDialog(false)
                      setRecipientEmail("")
                      setRecipientMessage("")
                      alert("Gift order placed successfully!")
                    }
                  } catch (error) {
                    console.error("Gift order error:", error)
                    alert("Failed to place gift order. Please try again.")
                  } finally {
                    setLoading(false)
                  }
                }}
                disabled={loading || !recipientEmail}
              >
                <Send className="w-4 h-4 mr-2" />
                {loading ? "Processing..." : "Send Gift"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* How it Works */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>How Aahar Rewards Work</CardTitle>
            <CardDescription>Earn points with every order and unlock amazing benefits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Utensils className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-bold mb-2">Order Food</h3>
                <p className="text-sm text-gray-600">Earn 1 point for every ₹10 spent</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-bold mb-2">Collect Points</h3>
                <p className="text-sm text-gray-600">Points never expire and multiply with your level</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-bold mb-2">Redeem Rewards</h3>
                <p className="text-sm text-gray-600">Get free food, discounts, and exclusive perks</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
}
