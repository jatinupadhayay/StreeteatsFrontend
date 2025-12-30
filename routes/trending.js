// trending.js
const express = require('express');
const router = express.Router();

// GET /api/trending/dishes
router.get('/dishes', async (req, res) => {
  try {
    const {
      lat,
      lng,
      radius = 5,
      days = 30,
      limit = 20,
    } = req.query;

    // TODO: Implement logic to fetch trending dishes from the database
    // based on the provided parameters.

    // Dummy data for now
    const trendingDishes = [
      {
        id: 'd123',
        name: 'Masala Dosa',
        shopId: 's789',
        shopName: 'Sagar's Cafe',
        orderCount: 54,
        imageUrl: 'https://example.com/masala_dosa.jpg',
        price: 119.9,
      },
      {
        id: 'd456',
        name: 'Butter Chicken',
        shopId: 's101',
        shopName: 'Desi Delight',
        orderCount: 42,
        imageUrl: 'https://example.com/butter_chicken.jpg',
        price: 249.5,
      },
    ];

    res.status(200).json({
      dishes: trendingDishes,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Failed to fetch trending dishes',
      error: error.message,
    });
  }
});

module.exports = router;
