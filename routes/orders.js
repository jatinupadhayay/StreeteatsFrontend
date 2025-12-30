// orders.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// TODO: Import the Order model
// const Order = require('../models/Order');

// POST /api/orders
router.post('/', async (req, res) => {
  try {
    const {
      vendorId,
      customerId,
      items,
      paymentMethod,
      deliveryAddress,
      subtotal,
      deliveryFee,
      taxes,
      total,
      specialInstructions
    } = req.body;

    // TODO: Validate the order data

    // TODO: Create a new order in the database
    // const newOrder = new Order({
    //   vendorId,
    //   customerId,
    //   items,
    //   paymentMethod,
    //   deliveryAddress,
    //   subtotal,
    //   deliveryFee,
    //   taxes,
    //   total,
    //   specialInstructions
    // });

    // TODO: Save the order to the database
    // const savedOrder = await newOrder.save();

    // Dummy order for now
    const savedOrder = {
      id: 'o123',
      status: 'pending',
    }

    // Get the Socket.io instance
    const io = req.app.get('io');

    // Emit the order:update event to the customer room
    io.to(`customer-${customerId}`).emit('order:update', {
      orderId: savedOrder.id,
      status: savedOrder.status,
      updatedAt: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      order: {
        id: savedOrder.id,
        status: savedOrder.status,
      },
      message: 'Order created successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message,
    });
  }
});

module.exports = router;
