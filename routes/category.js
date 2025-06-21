const express = require('express');
const router = express.Router();
const { Category, Service } = require('../models');

router.post('/', async (req, res) => {
  const { name, description, order } = req.body;
  const category = await Category.create({ name, description, order });
  res.json(category);
});

router.get('/', async (req, res) => {
  const categories = await Category.findAll({
      include: {
        model: Service,
        as: 'services'
      }
    });
  res.json(categories);
});

router.get('/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;

    // Check if the category exists
    const category = await Category.findByPk(categoryId, {
      include: {
        model: Service,
        as: 'services'
      }
    });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }


    res.status(200).json({
      category
    });
  } catch (error) {
    console.error('Error fetching services by category:', error);
    res.status(500).json({
      message: 'Failed to fetch services',
      error: error.message
    });
  }
});

module.exports = router;
