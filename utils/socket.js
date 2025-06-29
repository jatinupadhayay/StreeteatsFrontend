const socketIo = require("socket.io")

let io

const initializeSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ["GET", "POST"],
    },
  })

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id)

    // Join order room for real-time updates
    socket.on("join-order", (orderId) => {
      socket.join(`order-${orderId}`)
      console.log(`User joined order room: order-${orderId}`)
    })

    // Join vendor room for order notifications
    socket.on("join-vendor", (vendorId) => {
      socket.join(`vendor-${vendorId}`)
      console.log(`Vendor joined room: vendor-${vendorId}`)
    })

    // Join delivery room for delivery updates
    socket.on("join-delivery", (deliveryId) => {
      socket.join(`delivery-${deliveryId}`)
      console.log(`Delivery person joined room: delivery-${deliveryId}`)
    })

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id)
    })
  })

  return io
}

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!")
  }
  return io
}

// Emit order status updates
const emitOrderUpdate = (orderId, orderData) => {
  if (io) {
    io.to(`order-${orderId}`).emit("order-updated", orderData)
  }
}

// Emit new order to vendor
const emitNewOrderToVendor = (vendorId, orderData) => {
  if (io) {
    io.to(`vendor-${vendorId}`).emit("new-order", orderData)
  }
}

// Emit delivery updates
const emitDeliveryUpdate = (orderId, deliveryData) => {
  if (io) {
    io.to(`order-${orderId}`).emit("delivery-updated", deliveryData)
    io.to(`delivery-${deliveryData.deliveryPersonId}`).emit("delivery-task-updated", deliveryData)
  }
}

module.exports = {
  initializeSocket,
  getIO,
  emitOrderUpdate,
  emitNewOrderToVendor,
  emitDeliveryUpdate,
}
