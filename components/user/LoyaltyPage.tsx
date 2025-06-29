"use client"

import { useState } from "react"
import { Gift, Star, Zap, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const userLoyalty = {
  currentPoints: 1250,
  totalEarned: 3450,
  level: "Gold",
  nextLevel: "Platinum",
  pointsToNextLevel: 750,
  multiplier: 2,
}

const rewards = [
  {
    id: 1,
    title: "Free Pani Puri",
    description: "Get 8 pieces of delicious pani puri",
    points: 200,
    image: "/placeholder.svg?height=80&width=80",
    category: "Food",
    vendor: "Spice Street Corner",
  },
  {
    id: 2,
    title: "₹50 Off",
    description: "₹50 discount on orders above ₹200",
    points: 300,
    image: "/placeholder.svg?height=80&width=80",
    category: "Discount",
    vendor: "Any Vendor",
  },
  {
    id: 3,
    title: "Free Delivery",
    description: "Free delivery on your next 3 orders",
    points: 150,
    image: "/placeholder.svg?height=80&width=80",
    category: "Service",
    vendor: "Any Vendor",
  },
]

export default function LoyaltyPage() {
  const [selectedCategory, setSelectedCategory] = useState("All")
  const levelProgress = ((2000 - userLoyalty.pointsToNextLevel) / 2000) * 100

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Street Eats Rewards</h1>
        <p className="text-gray-600">Earn points with every order and unlock amazing rewards!</p>
      </div>

      {/* Points Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Crown className="w-5 h-5 mr-2 text-yellow-500" />
              {userLoyalty.level} Member
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
      </div>

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rewards.map((reward) => (
          <Card key={reward.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <img
                  src={reward.image || "/placeholder.svg"}
                  alt={reward.title}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
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
                  <h3 className="font-bold text-gray-900 mb-1">{reward.title}</h3>
                  <p className="text-sm text-gray-600 mb-1">{reward.description}</p>
                  <p className="text-xs text-gray-500">Valid at {reward.vendor}</p>
                </div>
              </div>

              <Button
                className="w-full mt-4"
                disabled={userLoyalty.currentPoints < reward.points}
                variant={userLoyalty.currentPoints >= reward.points ? "default" : "outline"}
              >
                {userLoyalty.currentPoints >= reward.points ? (
                  <>
                    <Gift className="w-4 h-4 mr-2" />
                    Redeem Now
                  </>
                ) : (
                  `Need ${reward.points - userLoyalty.currentPoints} more points`
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* How it Works */}
      <Card>
        <CardHeader>
          <CardTitle>How Street Eats Rewards Work</CardTitle>
          <CardDescription>Earn points with every order and unlock amazing benefits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🍽️</span>
              </div>
              <h3 className="font-bold mb-2">Order Food</h3>
              <p className="text-sm text-gray-600">Earn 1 point for every ₹10 spent</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-bold mb-2">Collect Points</h3>
              <p className="text-sm text-gray-600">Points multiply with your level</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-bold mb-2">Redeem Rewards</h3>
              <p className="text-sm text-gray-600">Get free food, discounts, and perks</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
