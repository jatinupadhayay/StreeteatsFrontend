const express = require("express")
const Razorpay = require("razorpay")
const crypto = require("crypto")
const Order = require("../models/Order")
const auth = require("../middleware/auth")

const router = express.Router()

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

// Create Razorpay Order
router.post("/create-order", auth, async (req, res) => {
  try {
    const { amount, orderId } = req.body

    const options = {
      amount: amount * 100, // Convert to paise
      currency: "INR",
      receipt: `order_${orderId}`,
      payment_capture: 1,
    }

    const razorpayOrder = await razorpay.orders.create(options)

    // Update order with payment details
    await Order.findByIdAndUpdate(orderId, {
      "payment.razorpayOrderId": razorpayOrder.id,
      "payment.status": "pending",
    })

    res.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
    })
  } catch (error) {
    console.error("Razorpay order creation error:", error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Verify Razorpay Payment
router.post("/verify-payment", auth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex")

    if (expectedSignature === razorpay_signature) {
      // Payment verified successfully
      await Order.findByIdAndUpdate(orderId, {
        "payment.status": "completed",
        "payment.razorpayPaymentId": razorpay_payment_id,
        "payment.razorpaySignature": razorpay_signature,
        "payment.paidAt": new Date(),
        status: "confirmed",
      })

      res.json({ success: true, message: "Payment verified successfully" })
    } else {
      res.status(400).json({ success: false, message: "Invalid payment signature" })
    }
  } catch (error) {
    console.error("Payment verification error:", error)
    res.status(500).json({ success: false, error: error.message })
  }
})

module.exports = router
