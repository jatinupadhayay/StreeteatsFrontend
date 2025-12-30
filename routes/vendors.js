// vendors.js
const express = require('express');
const router = express.Router();

// GET /api/vendors
router.get('/', async (req, res) => {
  try {
    const {
      lat,
      lng,
      nearby = false,
      page = 1,
      pageSize = 20,
      search = '',
    } = req.query;

    // TODO: Implement logic to fetch vendors from the database
    // based on the provided parameters.

    // Dummy data for now
    const vendors = [
      {
        id: 'v123',
        name: 'Sagar's Cafe',
        latitude: 12.97,
        longitude: 77.59,
        imageUrl: 'https://example.com/sagar_cafe.jpg',
      },
      {
        id: 'v456',
        name: 'Desi Delight',
        latitude: 12.98,
        longitude: 77.60,
        imageUrl: 'https://example.com/desi_delight.jpg',
      },
    ];

    res.status(200).json({
      vendors: vendors,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total: vendors.length, // TODO: Replace with actual total count from DB
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Failed to fetch vendors',
      error: error.message,
    });
  }
});

module.exports = router;
