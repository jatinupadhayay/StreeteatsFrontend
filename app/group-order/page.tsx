"use client"

import { useState } from "react"
import { Users, Plus, Trash2, Share2, Calculator, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"

interface GroupMember {
  id: string
  name: string
  items: Array<{
    id: number
    name: string
    price: number
    quantity: number
  }>
  total: number
}

export default function GroupOrderPage() {
  const [groupName, setGroupName] = useState("Office Lunch Order")
  const [members, setMembers] = useState<GroupMember[]>([
    {
      id: "1",
      name: "You",
      items: [
        { id: 1, name: "Butter Chicken Roll", price: 120, quantity: 1 },
        { id: 2, name: "Masala Chai", price: 20, quantity: 2 },
      ],
      total: 160,
    },
  ])
  const [newMemberName, setNewMemberName] = useState("")
  const [shareLink] = useState("https://streeteats.app/group/abc123")
  const { toast } = useToast()

  const addMember = () => {
    if (newMemberName.trim()) {
      const newMember: GroupMember = {
        id: Date.now().toString(),
        name: newMemberName,
        items: [],
        total: 0,
      }
      setMembers([...members, newMember])
      setNewMemberName("")
      toast({
        title: "Member added",
        description: `${newMemberName} has been added to the group order`,
      })
    }
  }

  const removeMember = (memberId: string) => {
    setMembers(members.filter((member) => member.id !== memberId))
  }

  const addItemToMember = (memberId: string) => {
    // Simulate adding an item
    const updatedMembers = members.map((member) => {
      if (member.id === memberId) {
        const newItem = {
          id: Date.now(),
          name: "Vada Pav",
          price: 25,
          quantity: 1,
        }
        return {
          ...member,
          items: [...member.items, newItem],
          total: member.total + newItem.price,
        }
      }
      return member
    })
    setMembers(updatedMembers)
  }

  const getTotalAmount = () => {
    return members.reduce((sum, member) => sum + member.total, 0)
  }

  const getDeliveryFee = () => {
    return getTotalAmount() > 300 ? 0 : 30
  }

  const getTaxes = () => {
    return Math.round(getTotalAmount() * 0.05) // 5% tax
  }

  const getFinalTotal = () => {
    return getTotalAmount() + getDeliveryFee() + getTaxes()
  }

  const shareGroupOrder = () => {
    navigator.clipboard.writeText(shareLink)
    toast({
      title: "Link copied!",
      description: "Share this link with your friends to join the group order",
    })
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center">
          <Users className="w-8 h-8 mr-3 text-orange-500" />
          Group Order
        </h1>
        <p className="text-gray-600">Order together, split the bill, and save on delivery!</p>
      </div>

      {/* Group Info */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <Input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="text-xl font-bold border-none p-0 h-auto bg-transparent"
            />
            <Badge className="bg-green-100 text-green-800">
              {members.length} member{members.length !== 1 ? "s" : ""}
            </Badge>
          </CardTitle>
          <CardDescription>Share the link below to invite friends to join your group order</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Input value={shareLink} readOnly className="flex-1" />
            <Button onClick={shareGroupOrder} variant="outline">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Members List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Group Members</h2>
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Add member name"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addMember()}
                className="w-40"
              />
              <Button onClick={addMember} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Member Cards */}
          <div className="space-y-4">
            {members.map((member) => (
              <Card key={member.id}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{member.name}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">₹{member.total}</Badge>
                      {member.name !== "You" && (
                        <Button size="sm" variant="ghost" onClick={() => removeMember(member.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {member.items.length > 0 ? (
                    <div className="space-y-2 mb-4">
                      {member.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                          <span>
                            {item.name} × {item.quantity}
                          </span>
                          <span className="font-medium">₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm mb-4">No items added yet</p>
                  )}

                  <Button size="sm" variant="outline" onClick={() => addItemToMember(member.id)} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="w-5 h-5 mr-2" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Individual Totals */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Individual Totals</h4>
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between text-sm">
                    <span>{member.name}</span>
                    <span>₹{member.total}</span>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Bill Breakdown */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span>₹{getTotalAmount()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Delivery Fee</span>
                  <span className={getDeliveryFee() === 0 ? "text-green-600" : ""}>
                    {getDeliveryFee() === 0 ? "FREE" : `₹${getDeliveryFee()}`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Taxes & Fees</span>
                  <span>₹{getTaxes()}</span>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total</span>
                <span>₹{getFinalTotal()}</span>
              </div>

              {/* Split Calculation */}
              <div className="bg-orange-50 p-3 rounded-lg">
                <p className="text-sm text-orange-800 font-medium">
                  Split equally: ₹{Math.round(getFinalTotal() / members.length)} per person
                </p>
                <p className="text-xs text-orange-600 mt-1">(Including delivery & taxes)</p>
              </div>

              {/* Payment Options */}
              <div className="space-y-2">
                <Button className="w-full bg-orange-500 hover:bg-orange-600">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay & Place Order
                </Button>
                <Button variant="outline" className="w-full">
                  Split Payment via UPI
                </Button>
              </div>

              {/* Delivery Info */}
              <div className="text-xs text-gray-500 text-center">
                <p>Estimated delivery: 25-30 mins</p>
                <p>Free delivery on orders above ₹300</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Benefits */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Why Order Together?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">💰</span>
              </div>
              <h4 className="font-medium mb-1">Save on Delivery</h4>
              <p className="text-sm text-gray-600">Split delivery costs among group members</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">🎯</span>
              </div>
              <h4 className="font-medium mb-1">Minimum Order</h4>
              <p className="text-sm text-gray-600">Easily meet minimum order requirements</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">⚡</span>
              </div>
              <h4 className="font-medium mb-1">Faster Delivery</h4>
              <p className="text-sm text-gray-600">Larger orders get priority delivery</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
