const mongoose = require("mongoose")

const deliveryPartnerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  personalDetails: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
  },
  vehicleDetails: {
    type: {
      type: String,
      enum: ["bike", "scooter", "bicycle", "car"],
      required: true,
    },
    number: { type: String, required: true },
    brand: { type: String, required: true },
  },
  documents: {
    licenseNumber: { type: String, required: true },
    aadharNumber: { type: String, required: true },
    profilePhoto: { type: String },
    licensePhoto: { type: String },
    aadharCard: { type: String },
    vehicleRC: { type: String },
  },
  bankDetails: {
    accountNumber: { type: String, required: true },
    ifscCode: { type: String, required: true },
  },
  availability: {
    workingHours: [{ type: String }], // ['9AM-6PM', '6PM-12AM']
    preferredAreas: [{ type: String }],
    isAvailable: { type: Boolean, default: false },
  },
  ratings: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
  },
  earnings: {
    today: { type: Number, default: 0 },
    thisWeek: { type: Number, default: 0 },
    thisMonth: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  deliveryStats: {
    totalDeliveries: { type: Number, default: 0 },
    completedDeliveries: { type: Number, default: 0 },
    cancelledDeliveries: { type: Number, default: 0 },
  },
  currentLocation: {
    type: { type: String, default: "Point" },
    coordinates: [{ type: Number }], // [longitude, latitude]
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "suspended"],
    default: "pending",
  },
  isActive: { type: Boolean, default: false },
  verificationDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

// Index for geospatial queries
deliveryPartnerSchema.index({ currentLocation: "2dsphere" })

module.exports = mongoose.model("DeliveryPartner", deliveryPartnerSchema)
