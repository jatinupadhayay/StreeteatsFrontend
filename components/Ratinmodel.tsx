// components/rating-modal.tsx
"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"

interface RatingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items?: Array<{ menuItemId: string; name: string }>
  onSubmit: (rating: {
    food?: number
    delivery?: number
    overall: number
    review?: string
    dishRatings?: Array<{ menuItemId: string; rating: number; comment?: string }>
  }) => void
}

export function RatingModal({ open, onOpenChange, onSubmit, items = [] }: RatingModalProps) {
  const [foodRating, setFoodRating] = useState<number>(5)
  const [deliveryRating, setDeliveryRating] = useState<number>(5)
  const [overallRating, setOverallRating] = useState<number>(5)
  const [review, setReview] = useState<string>("")
  const [dishRatings, setDishRatings] = useState<Record<string, { rating: number; comment: string }>>(
    items.reduce((acc, item) => ({ ...acc, [item.menuItemId]: { rating: 5, comment: "" } }), {})
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const formattedDishRatings = Object.entries(dishRatings).map(([menuItemId, data]) => ({
        menuItemId,
        rating: data.rating,
        comment: data.comment
      }))

      await onSubmit({
        food: foodRating,
        delivery: deliveryRating,
        overall: overallRating,
        review: review.trim() || undefined,
        dishRatings: formattedDishRatings
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDishRatingChange = (menuItemId: string, rating: number) => {
    setDishRatings(prev => ({
      ...prev,
      [menuItemId]: { ...prev[menuItemId], rating }
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rate Your Order</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Shop/General Ratings */}
          <div className="bg-orange-50 p-4 rounded-lg space-y-4">
            <h3 className="font-bold text-orange-800 border-b border-orange-200 pb-2">Overall Feedback</h3>

            <div>
              <h3 className="font-medium mb-1">Food Quality</h3>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={`food-${star}`}
                    type="button"
                    onClick={() => setFoodRating(star)}
                    className="p-1"
                  >
                    <Star
                      className={`w-5 h-5 ${star <= foodRating
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                        }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-1">Delivery Experience</h3>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={`delivery-${star}`}
                    type="button"
                    onClick={() => setDeliveryRating(star)}
                    className="p-1"
                  >
                    <Star
                      className={`w-5 h-5 ${star <= deliveryRating
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                        }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-1">Overall Satisfaction</h3>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={`overall-${star}`}
                    type="button"
                    onClick={() => setOverallRating(star)}
                    className="p-1"
                  >
                    <Star
                      className={`w-5 h-5 ${star <= overallRating
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                        }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-1">Comment (Optional)</h3>
              <Textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="How was the shop and service?"
                rows={2}
                className="text-sm"
              />
            </div>
          </div>

          {/* Dish Specific Ratings */}
          {items.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-bold text-gray-800 border-b pb-2">Rate Dishes</h3>
              {items.map((item) => {
                const itemId = item.menuItemId
                return (
                  <div key={itemId} className="p-3 border rounded-lg bg-gray-50">
                    <p className="font-medium text-sm mb-2">{item.name}</p>
                    <div className="flex mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={`${itemId}-${star}`}
                          type="button"
                          onClick={() => handleDishRatingChange(itemId, star)}
                          className="p-1"
                        >
                          <Star
                            className={`w-4 h-4 ${star <= (dishRatings[itemId]?.rating || 5)
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300"
                              }`}
                          />
                        </button>
                      ))}
                    </div>
                    <Textarea
                      value={dishRatings[itemId]?.comment || ""}
                      onChange={(e) => setDishRatings(prev => ({
                        ...prev,
                        [itemId]: { ...prev[itemId], comment: e.target.value }
                      }))}
                      placeholder={`What did you think of the ${item.name}?`}
                      rows={1}
                      className="text-xs"
                    />
                  </div>
                )
              })}
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}