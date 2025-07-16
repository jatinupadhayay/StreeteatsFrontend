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
  onSubmit: (rating: {
    food?: number
    delivery?: number
    overall: number
    review?: string
  }) => void
}

export function RatingModal({ open, onOpenChange, onSubmit }: RatingModalProps) {
  const [foodRating, setFoodRating] = useState<number>(5)
  const [deliveryRating, setDeliveryRating] = useState<number>(5)
  const [overallRating, setOverallRating] = useState<number>(5)
  const [review, setReview] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await onSubmit({
        food: foodRating,
        delivery: deliveryRating,
        overall: overallRating,
        review: review.trim() || undefined
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rate Your Order</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-medium mb-2">Food Quality</h3>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={`food-${star}`}
                  type="button"
                  onClick={() => setFoodRating(star)}
                  className="p-1"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= foodRating
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Delivery Experience</h3>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={`delivery-${star}`}
                  type="button"
                  onClick={() => setDeliveryRating(star)}
                  className="p-1"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= deliveryRating
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Overall Experience</h3>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={`overall-${star}`}
                  type="button"
                  onClick={() => setOverallRating(star)}
                  className="p-1"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= overallRating
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Review (Optional)</h3>
            <Textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your experience..."
              rows={3}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Submitting..." : "Submit Rating"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}